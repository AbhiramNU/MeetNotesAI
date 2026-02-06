import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Mic, Square, Upload, ArrowLeft,
  Settings, Users, Calendar, FileAudio,
  Zap, Brain, CheckCircle
} from 'lucide-react'
import { FluidBackground } from '@/components/ui/FluidBackground'

export default function RecordingPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [processing, setProcessing] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      streamRef.current = stream

      // Set up audio visualization
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer and audio level monitoring
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)

        // Update audio level for visualization
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average / 255)
        }
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setAudioLevel(0)

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('audio/')) {
      setAudioBlob(file)
      if (!meetingTitle) {
        setMeetingTitle(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const processAudio = async () => {
    if (!audioBlob || !meetingTitle.trim()) {
      alert('Please provide a meeting title and audio recording')
      return
    }

    setProcessing(true)

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Auth error:', userError)
        throw new Error(`Authentication error: ${userError.message}`)
      }

      if (!user) {
        throw new Error('User not authenticated. Please sign in again.')
      }

      console.log('User authenticated:', user.id)

      // Prepare form data for Edge Function
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')
      formData.append('title', meetingTitle)
      formData.append('userId', user.id)

      console.log('Calling Edge Function with:', {
        audioSize: audioBlob.size,
        title: meetingTitle,
        userId: user.id
      })

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('process-audio', {
        body: formData,
      })

      console.log('Edge Function response:', { data, error })

      if (error) {
        console.error('Edge Function error:', error)
        throw new Error(`Edge Function error: ${error.message}`)
      }

      if (!data?.success) {
        console.error('Processing failed:', data)
        throw new Error(data?.error || 'Processing failed')
      }

      console.log('Success! Meeting ID:', data.meetingId)

      // Navigate to the real meeting notes page
      navigate(`/notes/${data.meetingId}`)

    } catch (error) {
      console.error('Error processing audio:', error)
      alert(`Error processing audio: ${(error as Error).message}`)
    } finally {
      setProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const features = [
    { icon: Brain, title: 'AI Transcription', desc: 'Advanced speech-to-text with 99% accuracy' },
    { icon: Users, title: 'Speaker Detection', desc: 'Automatically identify different speakers' },
    { icon: Zap, title: 'Real-time Processing', desc: 'Get insights while you record' },
    { icon: CheckCircle, title: 'Smart Summaries', desc: 'AI-generated meeting summaries' },
  ]

  return (
    <div className="min-h-screen relative bg-black text-foreground">
      <FluidBackground />

      {/* Premium Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="flex items-center space-x-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full px-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Mic className="h-5 w-5 text-orange-950" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">Record Meeting</h1>
            </div>

            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Recording Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meeting Details */}
            <Card className="glass-panel border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-white">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <span>Meeting Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Enter meeting title (e.g., Weekly Team Standup)"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="text-lg h-14 bg-black/40 border-white/10 text-white placeholder:text-zinc-500 focus:border-orange-500/50 focus:ring-orange-500/20 transition-all rounded-xl"
                />
              </CardContent>
            </Card>

            {/* Recording Interface */}
            <Card className="glass-panel border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-white">
                  <Mic className="w-5 h-5 text-orange-500" />
                  <span>Audio Recording</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-12 py-8">
                {/* Recording Status */}
                {isRecording && (
                  <div className="space-y-6">
                    <div className="text-6xl font-mono font-bold text-white animate-pulse tracking-widest">
                      {formatTime(recordingTime)}
                    </div>

                    {/* Audio Visualizer */}
                    <div className="flex items-center justify-center space-x-1.5 h-16">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-gradient-to-t from-orange-600 to-orange-300 rounded-full transition-all duration-75"
                          style={{
                            height: `${Math.max(8, audioLevel * 60 + Math.random() * 30)}px`,
                            opacity: 0.8 + Math.random() * 0.2
                          }}
                        />
                      ))}
                    </div>

                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-medium animate-pulse">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      Recording in progress...
                    </div>
                  </div>
                )}

                {/* Recording Button */}
                <div className="flex justify-center relative">
                  {!isRecording ? (
                    <div className="relative group">
                      <div className="absolute inset-0 bg-orange-500/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                      <Button
                        onClick={startRecording}
                        className="relative w-32 h-32 rounded-full btn-primary-gradient hover:scale-105 transition-all duration-300 shadow-2xl flex items-center justify-center"
                      >
                        <Mic className="w-12 h-12 text-orange-950" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                      <Button
                        onClick={stopRecording}
                        className="relative w-32 h-32 rounded-full bg-zinc-900 border-2 border-red-500/50 hover:bg-zinc-800 hover:border-red-500 hover:scale-105 transition-all duration-300 shadow-2xl flex items-center justify-center group"
                      >
                        <Square className="w-10 h-10 text-red-500 fill-current" />
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-zinc-400 text-lg">
                  {isRecording
                    ? 'Click the square to stop recording'
                    : 'Tap the microphone to start'
                  }
                </p>

                {/* Upload Alternative */}
                <div className="border-t border-white/5 pt-8">
                  <p className="text-sm text-zinc-500 mb-6">
                    Or upload an existing audio file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="h-12 px-8 border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl transition-all"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Audio File
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Process Button - UPDATED to Orange Theme */}
            {audioBlob && (
              <Card className="glass-panel border border-orange-500/30 bg-orange-950/10">
                <CardContent className="pt-8 pb-8">
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-orange-900/20 rounded-full flex items-center justify-center mx-auto border border-orange-500/20">
                      <FileAudio className="w-10 h-10 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Audio Ready!
                      </h3>
                      <p className="text-zinc-400">
                        Convert this recording into actionable intelligence.
                      </p>
                    </div>
                    <Button
                      onClick={processAudio}
                      disabled={processing || !meetingTitle.trim()}
                      className="w-full h-14 text-lg btn-primary-gradient shadow-2xl shadow-orange-900/20"
                    >
                      {processing ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 border-2 border-orange-950/30 border-t-orange-950 rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Brain className="w-5 h-5" />
                          <span>Generate Notes & Insights</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Features Sidebar */}
          <div className="space-y-6">
            <Card className="glass-panel border-0">
              <CardHeader>
                <CardTitle className="text-lg text-white">AI Capabilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                    <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/10">
                      <feature.icon className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-zinc-200">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-zinc-500 mt-1">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="glass-panel border-0 bg-blue-900/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2 text-white">
                  <Settings className="w-5 h-5 text-blue-400" />
                  <span>Pro Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-zinc-400">Speak clearly for 99% accuracy in transcription.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-zinc-400">The AI automatically detects speakers.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-zinc-400">You can upload MP3, WAV, or M4A files directly.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}