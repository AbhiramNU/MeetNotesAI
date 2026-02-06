# 📘 MeetNotes AI - Project Testbook & Viva Guide

## 📑 Table of Contents
1. [Executive Summary](#executive-summary)
2. [Architecture & Workflow](#architecture--workflow)
3. [Tech Stack Defense](#tech-stack-defense)
4. [Key Features Deep Dive](#key-features-deep-dive)
5. [Common Viva Questions](#common-viva-questions)
6. [Challenges & Solutions](#challenges--solutions)
7. [Deployment Guide](#deployment-guide)

---

## 1. Executive Summary

**Project Name**: MeetNotes AI
**Tagline**: "Transform meetings into actionable intelligence."
**Core Problem**: Professionals spend hours re-listening to recordings or forgetting action items from meetings. Manual note-taking distracts from participation.
**Solution**: An AI-powered web app that records, transcribes, and extracts structured insights (summaries, tasks, deadlines) from meetings automatically.

### Key Differentiators:
*   **"Dynamic Fluid" UI**: A premium, interactive interface that feels alive.
*   **Edge AI**: Uses serverless edge functions for low-latency processing.
*   **Speaker Diarization**: Knows *who* said *what*.

---

## 2. Architecture & Workflow

### High-Level Flow:
1.  **Frontend (React)**: Captures audio via MediaRecorder API.
2.  **Upload**: Audio Blob sent to **Supabase Edge Function** (`process-audio`).
3.  **Transcription**: Edge Function sends audio to **Deepgram API** (Nova-2 model) -> Returns JSON transcript.
4.  **Intelligence**: Transcript sent to **Gemini 1.5 Flash** -> Returns JSON with Summary & Tasks.
5.  **Storage**:
    *   Meeting Metadata -> `meetings` table (PostgreSQL)
    *   Transcript Segments -> `transcripts` table
    *   Action Items -> `tasks` table
6.  **Display**: Frontend fetches data via Supabase Client and renders it in real-time.

---

## 3. Tech Stack Defense (Viva Prep)

**Q: Why React + Vite?**
*   **A**: React 18 allows for concurrent rendering (smooth UI). Vite uses ES modules for instant dev server start, unlike Webpack which bundles everything first. It's significantly faster for development.

**Q: Why Supabase instead of Firebase?**
*   **A**: Supabase is open-source and based on **PostgreSQL**, a standard relational database. This allows complex queries (SQL) that are harder in Firebase's NoSQL structure. Plus, Row Level Security (RLS) is built directly into the database.

**Q: Why Deepgram?**
*   **A**: Deepgram is purpose-built for audio. It's faster and cheaper than OpenAI's Whisper API for this use case, and offers better diarization (speaker detection).

**Q: Why Gemini 1.5 Flash?**
*   **A**: "Flash" models are optimized for speed and cost-efficiency, perfect for summarizing long text (transcripts) quickly without the latency of larger models.

**Q: Why Tailwind CSS?**
*   **A**: Utility-first CSS allows for rapid UI development and keeps bundle sizes small (unused styles are purged). It makes implementing the custom dynamic animations easier via `tailwind.config.js`.

---

## 4. Key Features Deep Dive

### 🌊 Dynamic Background (Fluid Effect)
*   **Implementation**: A custom React component (`FluidBackground.tsx`) that tracks mouse coordinates (`clientX`, `clientY`).
*   **Technique**: Uses a CSS radial-gradient that follows the mouse position using inline styles.
*   **Why**: Creates an immersive, premium feel that distinguishes the app from generic tools.

### 🎙️ Audio Processing Pipeline
*   **Blob Handling**: We record audio chunks into a `Blob` (Binary Large Object).
*   **FormData**: We send this blob as `multipart/form-data` to the backend, imitating a standard file upload.
*   **Sanitization**: We implemented a Regex cleaner to strip Markdown formatting from Gemini's JSON response to prevent parsing errors.

---

## 5. Common Viva Questions

**Q: How do you handle large audio files?**
*   **A**: We stream the audio to the backend. In a production environment, we would upload to storage (S3/Supabase Storage) first and generate a signed URL, but for this demo, we send distinct blobs to the Edge Function (limited to 6MB-10MB usually).

**Q: What involves "Diarization"?**
*   **A**: Diarization is the process of partitioning an input audio stream into homogeneous segments according to user identity. Ideally, it answers "who spoke when".

**Q: How is the data secured?**
*   **A**: We use RLS (Row Level Security). Users can only `SELECT` or `INSERT` rows where `user_id` matches their authenticated ID.

**Q: What happens if the AI fails?**
*   **A**: We implemented error handling. It alerts the user but doesn't crash the app. The database transaction is atomic where possible.

---

## 6. Challenges & Solutions

**Challenge 1: JSON Parsing from AI**
*   *Problem*: Gemini often returns valid JSON wrapped in Markdown code blocks (```json ... ```), causing `JSON.parse` to crash.
*   *Solution*: Implemented a backend sanitizer `content.replace(/```json\n?|\n?```/g, '')` before parsing.

**Challenge 2: Input Visibility**
*   *Problem*: White text on white glass background was invisible.
*   *Solution*: Switched to a dark semi-transparent background (`bg-black/40`) for inputs to ensure contrast on all themes.

**Challenge 3: Audio State Management**
*   *Problem*: Visualizer needed real-time frequency data.
*   *Solution*: Used `AudioContext` and `AnalyserNode` to sample audio frequency data 60 times a second for the visualizer animation.

---

## 7. Deployment Guide

### Deployment to Vercel
1.  **Push to GitHub**:
    ```bash
    git add .
    git commit -m "Ready for deployment"
    git push origin main
    ```
2.  **Import in Vercel**:
    *   Go to [Vercel Dashboard](https://vercel.com/dashboard).
    *   Click "Add New..." -> "Project".
    *   Select your GitHub repository.
3.  **Configure Environment Variables**:
    *   Copy everything from `.env` to Vercel's Environment Variables section.
    *   **CRITICAL**: Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set.
4.  **Deploy**: Click "Deploy".

### Edge Functions
*   Run `supabase functions deploy process-audio` (requires Supabase CLI) to update the backend logic.
