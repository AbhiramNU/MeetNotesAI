# MeetNotes AI 🎙️

A premium SaaS web application for AI-powered meeting transcription, summarization, and task management. Built with modern technologies and designed for professional productivity.

## ✨ Features

- **Smart Recording**: Record meetings directly in browser or upload audio files
- **AI Transcription**: Automatic speech-to-text with speaker diarization
- **Intelligent Insights**: AI-generated summaries, tasks, and deadlines
- **Speaker Management**: Rename and manage speakers inline
- **Clean UI**: Premium design with purple/orange accents on black/white base
- **Real-time Processing**: Fast audio processing with immediate results

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **Lucide Icons** for iconography
- **React Router** for navigation

### Backend & Services
- **Supabase** for authentication and database
- **PostgreSQL** for data storage
- **Supabase Edge Functions** for AI processing
- **Deepgram API** for speech-to-text
- **Gemini 2.5 Flash** for AI insights

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Deepgram API key (for production)
- Google AI API key (for production)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd meetnotes-ai
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

## 📱 App Structure

### Pages
- **Auth Page**: Login/signup with email authentication
- **Dashboard**: Meeting list with search and filtering
- **Recording Page**: Audio recording and file upload
- **Notes Page**: AI insights panel + full transcript

### Key Components
- **Insights Panel**: Sticky top section with Summary/Tasks/Deadlines tabs
- **Transcript View**: Full conversation with editable speaker names
- **Recording Controls**: Browser-based audio recording
- **Speaker Management**: Inline editing of speaker names

## 🎨 Design System

### Colors
- **Base**: Black text on white background (with dark mode)
- **Purple**: Primary accent for highlights and active states
- **Orange**: CTA buttons, recording states, alerts
- **Gray**: Borders, muted text, backgrounds

### Typography
- Clean, readable fonts
- Proper hierarchy with consistent spacing
- High contrast for accessibility

## 🗄️ Database Schema

```sql
-- Meetings table
meetings (
  id uuid primary key,
  user_id uuid references auth.users,
  title text not null,
  summary text,
  created_at timestamp,
  updated_at timestamp
)

-- Transcripts table  
transcripts (
  id uuid primary key,
  meeting_id uuid references meetings,
  speaker_id text,
  speaker_name text,
  text text not null,
  order_index integer,
  timestamp integer
)

-- Tasks table
tasks (
  id uuid primary key,
  meeting_id uuid references meetings,
  task text not null,
  deadline text,
  owner text,
  completed boolean default false
)

-- Speakers table
speakers (
  id uuid primary key,
  meeting_id uuid references meetings,
  default_name text,
  custom_name text
)
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure
```
src/
├── components/ui/     # Reusable UI components
├── pages/            # Main application pages
├── hooks/            # Custom React hooks
├── lib/              # Utilities and configurations
├── stores/           # State management
├── types/            # TypeScript type definitions
└── styles/           # Global styles
```

## 🚀 Deployment

### Supabase Setup
1. Create new Supabase project
2. Set up authentication (email + OAuth)
3. Create database tables using provided schema
4. Deploy Edge Functions for AI processing
5. Configure RLS policies

### Production Build
```bash
npm run build
```

Deploy the `dist` folder to your preferred hosting platform (Vercel, Netlify, etc.).

## 🔐 Security Features

- Row Level Security (RLS) enabled
- JWT token validation
- No client-side API secrets
- Audio files deleted after processing
- Rate limiting on API endpoints

## 📈 Performance

- Lazy loading for optimal bundle size
- Skeleton UI for loading states
- Debounced search requests
- Cached transcript data
- Optimized re-renders

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Tailwind CSS](https://tailwindcss.com/) for styling system
- [Supabase](https://supabase.com/) for backend infrastructure
- [Deepgram](https://deepgram.com/) for speech recognition
- [Google AI](https://ai.google.dev/) for intelligent insights

---

Built with ❤️ for productive meetings and better collaboration.