import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Mic, Square, Upload, ArrowLeft, Play, Pause, 
  Volume2, Settings, Users, Calendar, FileAudio,
  Zap, Brain, CheckCircle
} from 'lucide-react'

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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Prepare form data for Edge Function
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')
      formData.append('title', meetingTitle)
      formData.append('userId', user.id)

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('process-audio', {
        body: formData,
      })

      if (error) {
        throw error
      }

      if (!data.success) {
        throw new Error(data.error || 'Processing failed')
      }

      // Navigate to the real meeting notes page
      navigate(`/notes/${data.meetingId}`)
      
    } catch (error) {
      console.error('Error processing audio:', error)
      alert(`Error processing audio: ${error.message}`)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl dark:bg-gray-900/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-orange-500 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="MeetNotes AI" 
                  style={{
                    width: '20px',
                    height: '20px',
                    maxWidth: '20px',
                    maxHeight: '20px',
                    objectFit: 'contain'
                  }}
                />
              </div>
              <h1 className="text-lg font-semibold text-gradient">Record Meeting</h1>
            </div>
            
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Recording Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meeting Details */}
            <Card className="glass shadow-premium border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <span>Meeting Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Enter meeting title (e.g., Weekly Team Standup)"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="text-lg h-12 bg-white/50 border-gray-200 focus:bg-white transition-all duration-300"
                />
              </CardContent>
            </Card>

            {/* Recording Interface */}
            <Card className="glass shadow-premium border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mic className="w-5 h-5 text-orange-500" />
                  <span>Audio Recording</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-8">
                {/* Recording Status */}
                {isRecording && (
                  <div className="space-y-4">
                    <div className="text-5xl font-mono font-bold text-orange-500 animate-pulse">
                      {formatTime(recordingTime)}
                    </div>
                    
                    {/* Audio Visualizer */}
                    <div className="flex items-center justify-center space-x-1">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-gradient-to-t from-orange-500 to-purple-500 rounded-full transition-all duration-150"
                          style={{
                            height: `${Math.max(4, audioLevel * 40 + Math.random() * 20)}px`
                          }}
                        />
                      ))}
                    </div>
                    
                    <p className="text-orange-600 font-medium">
                      🔴 Recording in progress...
                    </p>
                  </div>
                )}

                {/* Recording Button */}
                <div className="flex justify-center">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      className="w-24 h-24 rounded-full btn-premium gradient-orange hover:scale-110 transition-all duration-300 shadow-premium-lg animate-pulse-glow"
                    >
                      <Mic className="w-10 h-10" />
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-300 shadow-premium-lg"
                    >
                      <Square className="w-10 h-10" />
                    </Button>
                  )}
                </div>

                <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                  {isRecording 
                    ? 'Click the square button to stop recording' 
                    : 'Click the microphone to start recording your meeting'
                  }
                </p>

                {/* Upload Alternative */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                  <p className="text-sm text-gray-500 mb-4">
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
                    className="btn-premium hover:scale-105 transition-all duration-300"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Audio File
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Process Button */}
            {audioBlob && (
              <Card className="glass shadow-premium border-0 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <FileAudio className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-700 mb-2">
                        Audio ready for processing! 🎉
                      </p>
                      <p className="text-sm text-gray-600">
                        Our AI will transcribe, identify speakers, and generate insights
                      </p>
                    </div>
                    <Button
                      onClick={processAudio}
                      disabled={processing || !meetingTitle.trim()}
                      className="w-full btn-premium gradient-purple hover:scale-105 transition-all duration-300 shadow-lg"
                      size="lg"
                    >
                      {processing ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Processing Audio...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Brain className="w-5 h-5" />
                          <span>Generate Meeting Notes</span>
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
            <Card className="glass shadow-premium border-0">
              <CardHeader>
                <CardTitle className="text-lg">AI-Powered Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="glass shadow-premium border-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-blue-500" />
                  <span>Recording Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Ensure quiet environment for best transcription quality</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Speak clearly and avoid overlapping conversations</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Use a good microphone for professional results</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Supported formats: MP3, WAV, M4A, WebM</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}