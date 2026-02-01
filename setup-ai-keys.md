# AI API Keys Setup

## Step 1: Get Deepgram API Key

1. Go to [deepgram.com](https://deepgram.com)
2. Sign up for a free account
3. Go to **API Keys** in your dashboard
4. Copy your API key (starts with something like `sk_...`)

## Step 2: Get Google AI API Key

1. Go to [ai.google.dev](https://ai.google.dev)
2. Click "Get API key in Google AI Studio"
3. Create a new API key
4. Copy your API key

## Step 3: Add Keys to Supabase

1. Go to your Supabase project: https://supabase.com/dashboard/project/kujyydxysabfkhdqcyzi
2. Go to **Settings → Edge Functions**
3. Add these environment variables:

```
DEEPGRAM_API_KEY=your_deepgram_key_here
GOOGLE_AI_API_KEY=your_google_ai_key_here
```

## Step 4: Deploy Edge Function

After adding the keys, we'll deploy the Edge Function using Supabase CLI.

## Step 5: Test Real AI Processing

Once deployed, your app will:
- ✅ Send audio to Deepgram for transcription
- ✅ Use Gemini AI for intelligent insights
- ✅ Save real data to your database
- ✅ Show actual meeting analysis

---

**Get your API keys and let me know when you have them!** 🚀