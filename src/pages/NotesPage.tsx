import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import type { Meeting, Transcript, AIInsights } from '@/types'
import { ArrowLeft, Edit2, X, Calendar, User, Clock } from 'lucide-react'

export default function NotesPage() {
  const { meetingId } = useParams()
  const navigate = useNavigate()

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null)
  const [speakerNames, setSpeakerNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMeetingData() {
      if (!meetingId) return

      try {
        setLoading(true)

        // 1. Fetch meeting details
        const { data: meetingData, error: meetingError } = await supabase
          .from('meetings')
          .select('*')
          .eq('id', meetingId)
          .single()

        if (meetingError) throw meetingError
        setMeeting(meetingData)

        // 2. Fetch transcripts
        const { data: transcriptData, error: transcriptError } = await supabase
          .from('transcripts')
          .select('*')
          .eq('meeting_id', meetingId)
          .order('order_index', { ascending: true })

        if (transcriptError) throw transcriptError
        setTranscripts(transcriptData || [])

        // 3. Fetch tasks
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('meeting_id', meetingId)

        if (taskError) throw taskError

        // 4. Fetch speakers
        const { data: speakerData, error: speakerError } = await supabase
          .from('speakers')
          .select('*')
          .eq('meeting_id', meetingId)

        if (speakerError) throw speakerError

        // Construct insights object from fetched data
        const tasks = taskData?.map((t: any) => ({
          task: t.task,
          owner: t.owner,
          deadline: t.deadline
        })) || []

        // Construct insights object from fetched data
        const fetchedInsights: AIInsights = {
          summary: meetingData.summary || 'No summary available.',
          tasks: tasks,
          deadlines: tasks
            .filter((t: any) => t.deadline && t.deadline.toLowerCase() !== 'none')
            .map((t: any) => ({
              date: t.deadline,
              description: t.task
            }))
        }
        setInsights(fetchedInsights)

        // Initialize speaker names map
        const speakerMap: Record<string, string> = {}
        speakerData?.forEach((s: any) => {
          speakerMap[s.default_name] = s.custom_name || s.default_name
        })
        setSpeakerNames(speakerMap)

      } catch (error) {
        console.error('Error fetching meeting data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMeetingData()
  }, [meetingId])

  const handleSpeakerNameEdit = (speakerId: string, newName: string) => {
    setSpeakerNames(prev => ({
      ...prev,
      [speakerId]: newName
    }))
    setEditingSpeaker(null)
  }

  // Export to Text File
  const handleExport = () => {
    if (!meeting || !insights) return

    const content = `
Meeting: ${meeting.title}
Date: ${new Date(meeting.created_at).toLocaleDateString()}
----------------------------------------
SUMMARY:
${insights.summary}

ACTION ITEMS:
${insights.tasks.map(t => `- ${t.task} (${t.owner || 'Unassigned'}) [Due: ${t.deadline || 'No date'}]`).join('\n')}

FULL TRANSCRIPT:
${transcripts.map(t => `${speakerNames[t.speaker_id] || t.speaker_name}: ${t.text}`).join('\n\n')}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${meeting.title.replace(/\s+/g, '_')}_notes.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Share Functionality
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: meeting?.title,
          text: `Check out the notes for "${meeting?.title}"`,
          url: window.location.href,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center glass-panel p-8 rounded-2xl">
          <h2 className="text-xl font-semibold mb-2 text-white">Meeting not found</h2>
          <Button onClick={() => navigate('/dashboard')} className="btn-primary-gradient mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Immersive Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                size="icon"
                className="hover:bg-white/10 text-zinc-400 hover:text-white rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {meeting.title}
                </h1>
                <div className="flex items-center space-x-3 text-sm text-zinc-400 mt-0.5">
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    {new Date(meeting.created_at).toLocaleDateString()}
                  </span>
                  <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                  <span className="flex items-center text-orange-400">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Processed (Multi-Language)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="hidden sm:flex border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 transition-all hover:border-orange-500/30"
              >
                Download
              </Button>
              <Button
                size="sm"
                onClick={handleShare}
                className="btn-accent-gradient shadow-lg"
              >
                Share Notes
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Insight & Summary Block - High Visibility */}
        <section className="animate-fade-in-up">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="w-1 h-8 bg-orange-500 rounded-full mr-3"></span>
            Executive Summary
          </h2>

          <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 bg-[#0f172a]/80 shadow-2xl ring-1 ring-white/5">
            <div className="p-1">
              <Tabs defaultValue="summary" className="w-full">
                <div className="px-6 pt-6 pb-2 border-b border-white/5">
                  <TabsList className="bg-black/20 border border-white/5 p-1 rounded-xl">
                    <TabsTrigger value="summary" className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white font-bold">Summary</TabsTrigger>
                    <TabsTrigger value="tasks" className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white font-bold">Action Items</TabsTrigger>
                    <TabsTrigger value="deadlines" className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white font-bold">Deadlines</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="summary" className="p-8 mt-0 focus-visible:ring-0">
                  <div className="prose prose-invert max-w-none prose-p:text-zinc-300 prose-p:leading-8 prose-lg">
                    <p>{insights?.summary}</p>
                  </div>
                </TabsContent>

                <TabsContent value="tasks" className="p-8 mt-0 focus-visible:ring-0">
                  <div className="grid gap-4">
                    {insights?.tasks.map((task, index) => (
                      <div key={index} className="flex items-start p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                        <div className="mt-1 w-6 h-6 rounded-full border-2 border-orange-500/30 group-hover:border-orange-500 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-lg text-zinc-200 font-medium">{task.task}</p>
                          <div className="flex items-center mt-2 space-x-4 text-sm text-zinc-500">
                            {task.owner && (
                              <span className="flex items-center px-2 py-1 rounded-md bg-white/5">
                                <User className="w-3 h-3 mr-2 text-orange-400" /> {task.owner}
                              </span>
                            )}
                            {task.deadline && (
                              <span className="flex items-center px-2 py-1 rounded-md bg-white/5">
                                <Calendar className="w-3 h-3 mr-2 text-white" /> {task.deadline}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="deadlines" className="p-8 mt-0 focus-visible:ring-0">
                  <div className="space-y-4">
                    {insights?.deadlines.map((deadline, index) => (
                      <div key={index} className="flex items-center p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20">
                        <Calendar className="h-6 w-6 text-orange-500 mr-4" />
                        <div>
                          <p className="font-bold text-orange-200">{deadline.date}</p>
                          <p className="text-sm text-orange-400/80">{deadline.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

        {/* Transcript Section - Human Like */}
        <section className="animate-fade-in-up delay-100 pb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="w-1 h-8 bg-white rounded-full mr-3"></span>
            Transcript
          </h2>

          <div className="space-y-6">
            {transcripts.map((transcript) => (
              <div key={transcript.id} className="flex space-x-6 group">
                {/* Avatar Placeholder (Gradient with Orange+White Hint) */}
                <div className="flex-shrink-0 mt-1">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-black/50 ring-2 ring-white/10 group-hover:ring-orange-500/50 transition-all bg-gradient-to-br from-orange-500 to-white flex items-center justify-center">
                    <span className="text-xl font-bold text-orange-950">
                      {(speakerNames[transcript.speaker_id] || transcript.speaker_name).charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Speech Bubble */}
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    {editingSpeaker === transcript.speaker_id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          defaultValue={speakerNames[transcript.speaker_id] || transcript.speaker_name}
                          className="h-8 w-40 bg-black/40 border-orange-500 focus:ring-orange-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSpeakerNameEdit(transcript.speaker_id, e.currentTarget.value)
                            else if (e.key === 'Escape') setEditingSpeaker(null)
                          }}
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => setEditingSpeaker(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingSpeaker(transcript.speaker_id)}
                        className="text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors flex items-center"
                      >
                        {speakerNames[transcript.speaker_id] || transcript.speaker_name}
                        <Edit2 className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </button>
                    )}
                    <span className="mx-2 text-zinc-600 text-xs">•</span>
                    <span className="text-xs text-zinc-500 font-mono">
                      {formatTimestamp(transcript.timestamp || 0)}
                    </span>
                  </div>

                  <div className="p-4 rounded-r-2xl rounded-bl-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-zinc-300 leading-relaxed text-base">
                      {transcript.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}