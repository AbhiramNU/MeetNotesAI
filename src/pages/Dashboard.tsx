import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Meeting } from '@/types'
import { 
  Mic, Plus, Search, LogOut, Calendar, Clock, 
  TrendingUp, Users, FileText, Settings,
  Filter, Grid, List, MoreVertical
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl dark:bg-gray-900/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-4">
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
                <div>
                  <h1 className="text-xl font-bold text-gradient">MeetNotes AI</h1>
                  <p className="text-xs text-gray-500 -mt-1">Smart Meetings</p>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => navigate('/record')}
                className="btn-premium gradient-orange hover:scale-105 transition-all duration-300 shadow-lg"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Meeting
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button 
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Here's what's happening with your meetings today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={stat.label} className="glass shadow-premium border-0 hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-sm text-green-600 font-medium">
                      {stat.change} from last month
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/50 border-gray-200 focus:bg-white transition-all duration-300"
            />
          </div>
          
          {/* View Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="btn-premium"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="btn-premium"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="btn-premium">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Meetings Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mic className="h-12 w-12 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No meetings found' : 'No meetings yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              {searchQuery 
                ? 'Try adjusting your search terms or create a new meeting' 
                : 'Start by recording your first meeting and unlock the power of AI-driven insights'
              }
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => navigate('/record')}
                className="btn-premium gradient-purple hover:scale-105 transition-all duration-300 shadow-lg"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Record First Meeting
              </Button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {filteredMeetings.map((meeting) => (
              <Link key={meeting.id} to={`/notes/${meeting.id}`}>
                <Card className="glass shadow-premium border-0 hover:scale-105 hover:shadow-premium-lg transition-all duration-300 cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-purple-600 transition-colors">
                          {meeting.title}
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-4 text-sm mt-2">
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(meeting.created_at).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDistanceToNow(new Date(meeting.created_at), { addSuffix: true })}</span>
                          </span>
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  {meeting.summary && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                        {meeting.summary}
                      </p>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex space-x-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            AI Summary
                          </span>
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                            Tasks
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          45 min
                        </span>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}