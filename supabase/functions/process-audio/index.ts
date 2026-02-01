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
  deadlines: Array<{
    date: string
    description: string
  }>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY')
    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!DEEPGRAM_API_KEY || !GOOGLE_AI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables')
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

    console.log(`Processing audio for meeting: ${meetingTitle}`)

    // Step 1: Transcribe audio with Deepgram
    const audioBuffer = await audioFile.arrayBuffer()
    
    const deepgramResponse = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': audioFile.type || 'audio/wav',
      },
      body: audioBuffer,
      // Add query parameters for better transcription
      // Note: In a real implementation, you'd add these as URL params
    })

    if (!deepgramResponse.ok) {
      throw new Error(`Deepgram API error: ${deepgramResponse.statusText}`)
    }

    const deepgramData = await deepgramResponse.json()
    console.log('Deepgram transcription completed')

    // Extract transcript segments
    const segments: TranscriptSegment[] = []
    
    if (deepgramData.results?.channels?.[0]?.alternatives?.[0]) {
      const words = deepgramData.results.channels[0].alternatives[0].words || []
      
      // Group words by speaker (simplified approach)
      let currentSpeaker = 'Speaker 1'
      let currentText = ''
      let currentStart = 0
      
      for (const word of words) {
        // In a real implementation, you'd use Deepgram's diarization
        // For now, we'll create segments every 30 seconds or so
        if (word.start - currentStart > 30 || currentText.length > 200) {
          if (currentText.trim()) {
            segments.push({
              speaker: currentSpeaker,
              text: currentText.trim(),
              start: currentStart,
              end: word.start
            })
          }
          currentSpeaker = currentSpeaker === 'Speaker 1' ? 'Speaker 2' : 'Speaker 1'
          currentText = word.word + ' '
          currentStart = word.start
        } else {
          currentText += word.word + ' '
        }
      }
      
      // Add final segment
      if (currentText.trim()) {
        segments.push({
          speaker: currentSpeaker,
          text: currentText.trim(),
          start: currentStart,
          end: words[words.length - 1]?.end || currentStart + 10
        })
      }
    }

    // Step 2: Generate AI insights with Gemini
    const fullTranscript = segments.map(s => `${s.speaker}: ${s.text}`).join('\n\n')
    
    const geminiPrompt = `
Analyze this meeting transcript and extract:
1. A concise summary (2-3 sentences)
2. Action items/tasks with owners and deadlines if mentioned
3. Important deadlines and dates

Transcript:
${fullTranscript}

Respond with valid JSON in this format:
{
  "summary": "Brief meeting summary...",
  "tasks": [
    {
      "task": "Task description",
      "owner": "Person name or null",
      "deadline": "Deadline or null"
    }
  ],
  "deadlines": [
    {
      "date": "Date mentioned",
      "description": "What's due"
    }
  ]
}
`

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: geminiPrompt
          }]
        }]
      })
    })

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`)
    }

    const geminiData = await geminiResponse.json()
    console.log('Gemini analysis completed')

    // Parse AI insights
    let insights: AIInsights = {
      summary: "Meeting analysis completed successfully.",
      tasks: [],
      deadlines: []
    }

    try {
      const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const jsonMatch = aiText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('Error parsing AI insights:', error)
    }

    // Step 3: Save to database
    // Create meeting record
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        user_id: userId,
        title: meetingTitle,
        summary: insights.summary
      })
      .select()
      .single()

    if (meetingError) {
      throw new Error(`Database error: ${meetingError.message}`)
    }

    console.log(`Meeting created with ID: ${meeting.id}`)

    // Save transcript segments
    const transcriptInserts = segments.map((segment, index) => ({
      meeting_id: meeting.id,
      speaker_id: segment.speaker.toLowerCase().replace(' ', '_'),
      speaker_name: segment.speaker,
      text: segment.text,
      order_index: index + 1,
      timestamp: Math.floor(segment.start)
    }))

    if (transcriptInserts.length > 0) {
      const { error: transcriptError } = await supabase
        .from('transcripts')
        .insert(transcriptInserts)

      if (transcriptError) {
        console.error('Error saving transcripts:', transcriptError)
      }
    }

    // Save tasks
    const taskInserts = insights.tasks.map(task => ({
      meeting_id: meeting.id,
      task: task.task,
      owner: task.owner,
      deadline: task.deadline
    }))

    if (taskInserts.length > 0) {
      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(taskInserts)

      if (tasksError) {
        console.error('Error saving tasks:', tasksError)
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        meetingId: meeting.id,
        message: 'Audio processed successfully'
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
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})