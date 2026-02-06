# MeetNotes AI 🎙️ 🌊

> **"Transform meetings into actionable intelligence."**

A premium, dynamic SaaS application for AI-powered meeting transcription, summarization, and task management. Featuring a stunning fluid interface and enterprise-grade AI processing.

![MeetNotes AI Fluid UI](https://via.placeholder.com/800x400?text=MeetNotes+Fluid+UI)

## ✨ key Features

- **🌊 Fluid Dynamic Design**: An immersive, interactive background that reacts to your mouse interactions.
- **🎙️ Smart Recording**: Browser-based recording with real-time audio visualization.
- **🧠 Intelligent Insights**: Powered by **Gemini 1.5 Flash** to extract Tasks, Deadlines, and Summaries.
- **🗣️ Speaker Diarization**: Deepgram-powered precision to know exactly who said what.
- **🌍 Multi-Language Support**: Automatically detects and processes English, Hindi, Kannada, and more.
- **⚡ Edge Processing**: Serverless architecture for lightning-fast results.

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** (Lightning fast dev)
- **FluidBackground.tsx** (Custom Canvas/CSS animation)
- **Tailwind CSS** (Utility-first styling)
- **Lucide React** (Beautiful icons)

### Backend & AI
- **Supabase** (Auth, Postgres DB, Real-time)
- **Supabase Edge Functions** (Deno-based serverless)
- **Deepgram Nova-2** (SOTA Speech-to-Text)
- **Google Gemini 1.5 Flash** (LLM for Reasoning)

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   Copy `.env.example` to `.env` and add your keys (Supabase, Deepgram, Google AI).

3. **Run locally**
   ```bash
   npm run dev
   ```

## 🎨 The "Fluid" Theme

We moved away from generic flat designs to a **Core Orange + Fluid Black** aesthetic.
*   **Dynamic Background**: A living, breathing backdrop.
*   **Glassmorphism**: Panels float above the fluid layer.
*   **Neon Orange Accents**: High-energy call-to-actions.

## 🔒 Security

*   Data is secured via **Row Level Security (RLS)**.
*   Audio is processed in verified Edge environments.
*   No sensitive keys are exposed to the client.

## 🤝 Contributing

1. Fork it
2. Create your feature branch (`git checkout -b feature/fluid-ui`)
3. Commit your changes (`git commit -m 'Add fluid effects'`)
4. Push to the branch (`git push origin feature/fluid-ui`)
5. Create a new Pull Request

---

© 2026 MeetNotes AI. Built for the future of work.