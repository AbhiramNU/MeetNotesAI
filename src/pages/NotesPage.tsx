import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    // Mock data for demonstration
    const mockMeeting: Meeting = {
      id: meetingId || 'mock',
      user_id: 'user-1',
      title: 'Product Strategy Meeting',
      summary: 'Discussed Q2 roadmap, feature priorities, and resource allocation.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const mockTranscripts: Transcript[] = [
      {
        id: '1',
        meeting_id: meetingId || 'mock',
        speaker_id: 'speaker-1',
        speaker_name: 'Person 1',
        text: "Good morning everyone. Let's start with our Q2 planning discussion. I think we need to prioritize the user dashboard redesign.",
        order_index: 1,
        timestamp: 0
      },
      {
        id: '2',
        meeting_id: meetingId || 'mock',
        speaker_id: 'speaker-2',
        speaker_name: 'Person 2',
        text: "I agree with that priority. The current dashboard has been getting negative feedback from users. We should also consider the mobile experience.",
        order_index: 2,
        timestamp: 15
      },
      {
        id: '3',
        meeting_id: meetingId || 'mock',
        speaker_id: 'speaker-1',
        speaker_name: 'Person 1',
        text: "Absolutely. Sarah, can you take the lead on the dashboard project? We'll need wireframes by next Friday.",
        order_index: 3,
        timestamp: 35
      },
      {
        id: '4',
        meeting_id: meetingId || 'mock',
        speaker_id: 'speaker-3',
        speaker_name: 'Person 3',
        text: "Sure, I can handle that. I'll coordinate with the design team and have initial mockups ready by Wednesday for review.",
        order_index: 4,
        timestamp: 50
      },
      {
        id: '5',
        meeting_id: meetingId || 'mock',
        speaker_id: 'speaker-2',
        speaker_name: 'Person 2',
        text: "Great. What about the API integration work? That's been on our backlog for a while.",
        order_index: 5,
        timestamp: 70
      },
      {
        id: '6',
        meeting_id: meetingId || 'mock',
        speaker_id: 'speaker-1',
        speaker_name: 'Person 1',
        text: "Good point. Let's assign that to the backend team. The deadline should be end of March to align with the dashboard launch.",
        order_index: 6,
        timestamp: 85
      }
    ]

    const mockInsights: AIInsights = {
      summary: "Team discussed Q2 product roadmap focusing on user dashboard redesign and API integration. Key decisions made on project ownership and timelines. Dashboard redesign prioritized due to user feedback issues.",
      tasks: [
        {
          task: "Create wireframes for dashboard redesign",
          owner: "Sarah",
          deadline: "Next Friday"
        },
        {
          task: "Coordinate with design team for mockups",
          owner: "Sarah",
          deadline: "Wednesday"
        },
        {
          task: "Complete API integration work",
          owner: "Backend Team",
          deadline: "End of March"
        }
      ],
      deadlines: [
        {
          date: "Wednesday",
          description: "Initial mockups ready for review"
        },
        {
          date: "Next Friday",
          description: "Dashboard wireframes due"
        },
        {
          date: "End of March",
          description: "API integration completion"
        }
      ]
    }

    // Initialize speaker names
    const initialSpeakerNames: Record<string, string> = {}
    mockTranscripts.forEach(transcript => {
      if (!initialSpeakerNames[transcript.speaker_id]) {
        initialSpeakerNames[transcript.speaker_id] = transcript.speaker_name
      }
    })

    setMeeting(mockMeeting)
    setTranscripts(mockTranscripts)
    setInsights(mockInsights)
    setSpeakerNames(initialSpeakerNames)
    setLoading(false)
  }, [meetingId])

  const handleSpeakerNameEdit = (speakerId: string, newName: string) => {
    setSpeakerNames(prev => ({
      ...prev,
      [speakerId]: newName
    }))
    setEditingSpeaker(null)
  }

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Meeting not found</h2>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <h1 className="text-lg font-semibold truncate max-w-md">
              {meeting.title}
            </h1>
            <div className="text-sm text-muted-foreground">
              {new Date(meeting.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Insights Panel - Sticky Top Section */}
        <div className="sticky top-20 z-10 mb-8">
          <Card className="bg-white/95 backdrop-blur-sm border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-700">Meeting Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary" className="mt-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {insights?.summary}
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="tasks" className="mt-4">
                  <div className="space-y-3">
                    {insights?.tasks.map((task, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{task.task}</p>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            {task.owner && (
                              <span className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{task.owner}</span>
                              </span>
                            )}
                            {task.deadline && (
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{task.deadline}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="deadlines" className="mt-4">
                  <div className="space-y-3">
                    {insights?.deadlines.map((deadline, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium text-gray-900">{deadline.date}</p>
                          <p className="text-sm text-gray-600">{deadline.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Full Transcript Section */}
        <Card>
          <CardHeader>
            <CardTitle>Full Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {transcripts.map((transcript) => (
                <div key={transcript.id} className="flex space-x-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-orange-400 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {(speakerNames[transcript.speaker_id] || transcript.speaker_name).charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Speaker Name & Timestamp */}
                    <div className="flex items-center space-x-3 mb-2">
                      {editingSpeaker === transcript.speaker_id ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            defaultValue={speakerNames[transcript.speaker_id] || transcript.speaker_name}
                            className="h-8 w-32"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSpeakerNameEdit(transcript.speaker_id, e.currentTarget.value)
                              } else if (e.key === 'Escape') {
                                setEditingSpeaker(null)
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => setEditingSpeaker(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingSpeaker(transcript.speaker_id)}
                          className="flex items-center space-x-1 text-sm font-medium text-gray-900 hover:text-purple-600 group"
                        >
                          <span>{speakerNames[transcript.speaker_id] || transcript.speaker_name}</span>
                          <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                      
                      {transcript.timestamp !== undefined && (
                        <span className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimestamp(transcript.timestamp)}</span>
                        </span>
                      )}
                    </div>
                    
                    {/* Transcript Text */}
                    <p className="text-gray-700 leading-relaxed">
                      {transcript.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}