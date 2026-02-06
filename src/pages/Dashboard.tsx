import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Meeting } from '@/types'
import {
  Mic, Plus, Search, LogOut, Clock,
  TrendingUp, Users, FileText,
  Grid, List
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { FluidBackground } from '@/components/ui/FluidBackground'

export default function Dashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const navigate = useNavigate()

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMeetings(data || [])
    } catch (error) {
      console.error('Error fetching meetings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Mock stats for premium look
  const stats = [
    { label: 'Total Meetings', value: '24', icon: FileText, change: '+12%' },
    { label: 'Hours Saved', value: '156', icon: Clock, change: '+23%' },
    { label: 'Team Members', value: '8', icon: Users, change: '+2' },
    { label: 'Insights Generated', value: '89', icon: TrendingUp, change: '+34%' },
  ]

  return (
    <div className="min-h-screen relative bg-black">
      <FluidBackground />

      {/* Ultra-Premium Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 group cursor-pointer">
                {/* Logo with Orange Gradient */}
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-white via-orange-300 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/50 transition-all duration-500">
                  <Mic className="h-5 w-5 text-orange-950" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">MeetNotes<span className="text-orange-400">.ai</span></h1>
                  <p className="text-xs text-zinc-400 font-medium tracking-wide uppercase">Enterprise Intelligence</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/record')}
                className="btn-primary-gradient px-6 h-10 rounded-full shadow-lg shadow-orange-500/20 animate-pulse-glow"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Meeting
              </Button>

              <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-sm font-medium text-white ring-2 ring-transparent hover:ring-orange-500/50 transition-all cursor-pointer">
                  JS
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Welcome Section */}
        <div className="mb-12 fade-in-up">
          <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Dashboard
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Your intelligence hub. Manage recordings, transcripts, and natural insights in one place.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 fade-in-up delay-100">
          {stats.map((stat, index) => (
            <div key={stat.label} className="glass-panel rounded-2xl p-6 hover:bg-white/5 transition-colors duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 group-hover:border-orange-500/30 transition-colors">
                  <stat.icon className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  {stat.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-white mb-1 tracking-tight">
                {stat.value}
              </p>
              <p className="text-sm text-zinc-500 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 fade-in-up delay-200">
          {/* Search */}
          <div className="relative flex-1 group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-white rounded-xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-orange-400 transition-colors" />
              <Input
                placeholder="Search meetings, transcripts, or insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-[#0c0c0e] border-white/10 text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-orange-500/20 rounded-xl transition-all"
              />
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center bg-[#0c0c0e] p-1 rounded-xl border border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`rounded-lg h-10 px-3 ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={`rounded-lg h-10 px-3 ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Meetings Grid/List */}
        <div className="fade-in-up delay-300">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-t-2 border-orange-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-r-2 border-orange-400/50 rounded-full animate-spin-slow"></div>
              </div>
              <p className="mt-6 text-zinc-500 animate-pulse">Syncing intelligence...</p>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="text-center py-24 glass-panel rounded-3xl border-dashed border-white/10">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 animate-float-slow">
                <Mic className="h-8 w-8 text-zinc-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? 'No results found' : 'Ready to record'}
              </h3>
              <p className="text-zinc-500 mb-8 max-w-sm mx-auto">
                {searchQuery
                  ? 'Adjust your search terms to find what you need.'
                  : 'Start your first session to generate AI transcripts and insights.'
                }
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => navigate('/record')}
                  className="btn-primary-gradient px-8 py-6 rounded-full text-lg shadow-xl shadow-orange-900/20"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  Start Recording
                </Button>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
            }>
              {filteredMeetings.map((meeting, i) => (
                <Link key={meeting.id} to={`/notes/${meeting.id}`}>
                  <div
                    className="glass-panel rounded-2xl p-6 group cursor-pointer glass-card-hover relative overflow-hidden"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {/* Hover Glow Effect: Orange to White */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-600/20 to-white/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>

                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                          <FileText className="w-6 h-6 text-orange-400" />
                        </div>
                        <span className="text-xs font-mono text-zinc-500 group-hover:text-orange-300 transition-colors">
                          {formatDistanceToNow(new Date(meeting.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-zinc-200 group-hover:text-white mb-2 line-clamp-1 transition-colors">
                        {meeting.title}
                      </h3>

                      <p className="text-sm text-zinc-500 line-clamp-2 mb-6 h-10 group-hover:text-zinc-400 transition-colors">
                        {meeting.summary || "No summary generated yet..."}
                      </p>

                      <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map(n => (
                            <div key={n} className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-[#1a1a1c] ring-1 ring-white/10 flex items-center justify-center text-[8px] text-zinc-400">
                              {['JD', 'AS', 'MK'][n - 1]}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center text-xs text-orange-400 font-medium opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                          View Insights <TrendingUp className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}