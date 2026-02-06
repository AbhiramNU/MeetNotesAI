import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranscriptSegment {
  speaker: string
  text: string
  start: number
  end: number
}

interface AIInsights {
  summary: string
  tasks: Array<{
    task: string
    owner?: string
    deadline?: string
  }>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Edge Function called with method:', req.method)

    // Get environment variables
    const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY')
    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!DEEPGRAM_API_KEY || !GOOGLE_AI_API_KEY) {
      throw new Error('Missing AI API keys. Please add DEEPGRAM_API_KEY and GOOGLE_AI_API_KEY to Supabase Edge Function Secrets.')
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration')
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get request data
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    const meetingTitle = formData.get('title') as string
    const userId = formData.get('userId') as string

    if (!audioFile || !meetingTitle || !userId) {
      throw new Error('Missing required fields: audio, title, or userId')
    }

    console.log(`Processing audio for meeting: ${meetingTitle}, Size: ${audioFile.size} bytes`)

    // 1. Transcribe with Deepgram
    console.log('Sending audio to Deepgram...')
    // Added detect_language=true to support Hindi, Kannada, and English automatically
    const deepgramResponse = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&diarize=true&punctuate=true&detect_language=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': audioFile.type || 'audio/wav',
      },
      body: audioFile,
    })

    if (!deepgramResponse.ok) {
      const errorText = await deepgramResponse.text()
      throw new Error(`Deepgram API error: ${deepgramResponse.status} ${errorText}`)
    }

    const deepgramData = await deepgramResponse.json()
    console.log('Deepgram transcription complete')

    // Process transcript
    const paragraphs = deepgramData.results?.channels[0]?.alternatives[0]?.paragraphs?.paragraphs || []
    const words = deepgramData.results?.channels[0]?.alternatives[0]?.words || []

    let fullTranscriptText = ''
    const formattedTranscript: TranscriptSegment[] = []

    // If we have paragraphs (diarized), use them
    if (paragraphs.length > 0) {
      paragraphs.forEach((p: any) => {
        const text = p.sentences.map((s: any) => s.text).join(' ')
        fullTranscriptText += `${p.speaker > -1 ? `Speaker ${p.speaker}` : 'Unknown'}: ${text}\n\n`

        formattedTranscript.push({
          speaker: p.speaker > -1 ? `Speaker ${p.speaker}` : 'Unknown',
          text: text,
          start: p.start,
          end: p.end
        })
      })
    } else {
      // Fallback if no paragraphs
      const text = deepgramData.results?.channels[0]?.alternatives[0]?.transcript
      fullTranscriptText = text
      formattedTranscript.push({
        speaker: 'Speaker 0',
        text: text,
        start: 0,
        end: deepgramData.metadata?.duration || 0
      })
    }

    let insights: AIInsights = { summary: 'No speech detected in the recording.', tasks: [] }

    // 2. Generate Insights with Gemini (Only if transcript exists)
    if (fullTranscriptText && fullTranscriptText.trim().length > 10) {
      console.log('Generating insights with Gemini...')
      const prompt = `
        Analyze the following meeting transcript and provide a summary and a list of action items/tasks.
        
        Transcript:
        ${fullTranscriptText}
        
        Output format (JSON only):
        {
          "summary": "A concise summary of the meeting...",
          "tasks": [
            { "task": "Action item description", "owner": "Name of person responsible (or 'Unknown')", "deadline": "Deadline if mentioned (or 'None')" }
          ]
        }
      `

      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      })

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text()
        console.error('Gemini API error:', errorText)
        // Don't fail the whole request if AI fails, just provide fallback
        insights.summary = 'AI summary temporarily unavailable.'
      } else {
        try {
          const geminiData = await geminiResponse.json()
          let content = geminiData.candidates[0].content.parts[0].text

          // Sanitize Gemini output: Extract JSON object only
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            content = jsonMatch[0]
            const parsedInsights = JSON.parse(content)
            insights = { ...insights, ...parsedInsights }
            console.log('Gemini insights generated successfully')
          } else {
            console.error('No JSON found in Gemini response:', content)
            insights.summary = 'Error: AI returned invalid format.'
          }
        } catch (e) {
          console.error('Error parsing Gemini response:', e)
          insights.summary = 'Error parsing AI summary.'
        }
      }
    } else {
      console.log('Transcript too short for AI insights.')
    }

    // 3. Save to Supabase
    console.log('Saving to database...')

    // Create Meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        user_id: userId,
        title: meetingTitle,
        summary: insights.summary
      })
      .select()
      .single()

    if (meetingError) throw meetingError

    // Create Transcripts
    if (formattedTranscript.length > 0) {
      const transcriptRows = formattedTranscript.map((t, index) => ({
        meeting_id: meeting.id,
        speaker_id: t.speaker,
        speaker_name: t.speaker,
        text: t.text,
        order_index: index,
        timestamp: Math.floor(t.start)
      }))

      const { error: transcriptError } = await supabase
        .from('transcripts')
        .insert(transcriptRows)

      if (transcriptError) throw transcriptError
    }

    // Create Tasks
    if (insights.tasks.length > 0) {
      const taskRows = insights.tasks.map(t => ({
        meeting_id: meeting.id,
        task: t.task,
        owner: t.owner,
        deadline: t.deadline
      }))

      const { error: taskError } = await supabase
        .from('tasks')
        .insert(taskRows)

      if (taskError) throw taskError
    }

    // Initialize Speakers (Unique)
    const uniqueSpeakers = [...new Set(formattedTranscript.map(t => t.speaker))]
    if (uniqueSpeakers.length > 0) {
      const speakerRows = uniqueSpeakers.map(s => ({
        meeting_id: meeting.id,
        default_name: s,
        custom_name: s // Initially same as default
      }))

      const { error: speakerError } = await supabase
        .from('speakers')
        .insert(speakerRows)

      if (speakerError) throw speakerError
    }

    console.log(`Meeting processed successfully with ID: ${meeting.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        meetingId: meeting.id,
        message: 'Meeting processed successfully with AI insights'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error processing audio:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})