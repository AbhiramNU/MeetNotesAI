export interface Meeting {
  id: string
  user_id: string
  title: string
  summary?: string
  created_at: string
  updated_at: string
}

export interface Transcript {
  id: string
  meeting_id: string
  speaker_id: string
  speaker_name: string
  text: string
  order_index: number
  timestamp?: number
}

export interface Task {
  id: string
  meeting_id: string
  task: string
  deadline?: string
  owner?: string
  completed: boolean
}

export interface Speaker {
  id: string
  meeting_id: string
  default_name: string
  custom_name?: string
}

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

export interface AIInsights {
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
  tags?: string[]
}