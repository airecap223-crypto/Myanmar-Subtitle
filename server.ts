import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  SUBTITLE_MODEL,
  transcribeAndTranslateAudioChunk,
  generateTikTokContentWithGemini,
} from './src/services/geminiService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Support large audio/video payloads (100MB)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

/**
 * Endpoint to analyze an audio chunk using the configured Gemini Flash model
 */
app.post('/api/analyze-chunk', async (req: Request, res: Response) => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/wav',
      chunkIndex = 0,
      totalChunks = 1,
      startOffsetSeconds = 0,
    } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'အသံဖိုင်ဒေတာ မပါရှိပါ (Missing audio data)' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API Key မရှိသေးပါ။ Settings > Secrets တွင် GEMINI_API_KEY ကို ဖြည့်စွက်ပေးပါ။',
      });
    }

    const parsedData = await transcribeAndTranslateAudioChunk({
      audioBase64,
      mimeType,
      chunkIndex,
      totalChunks,
      startOffsetSeconds,
    });

    return res.json({
      success: true,
      chunkIndex,
      modelUsed: SUBTITLE_MODEL,
      data: parsedData,
    });
  } catch (error: unknown) {
    console.error('Error analyzing audio chunk:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('503') || message.includes('high demand') || message.includes('UNAVAILABLE')) {
      return res.status(503).json({
        error: 'Gemini AI ဆာဗာတွင် လောလောဆယ် လူသုံးများနေပါသည် (Server High Demand)။ ခေတ္တခဏစောင့်ဆိုင်းပြီး ပြန်လည်စမ်းသပ်ပေးပါ။',
      });
    }
    return res.status(500).json({
      error: `ဗီဒီယို အသံပိုင်းခွဲခြမ်းစိတ်ဖြာရာတွင် အမှားဖြစ်ပေါ်ပါသည်: ${message}`,
    });
  }
});

/**
 * Endpoint to generate 5 TikTok titles and 5 hashtags based strictly on dialogue/subtitles
 */
app.post('/api/generate-tiktok-content', async (req: Request, res: Response) => {
  try {
    const { subtitles = [], summary = '', detectedLanguage = '' } = req.body;

    if (!Array.isArray(subtitles) || subtitles.length === 0) {
      return res.status(400).json({ error: 'စာတန်းထိုး အချက်အလက် မရှိပါ' });
    }

    const result = await generateTikTokContentWithGemini({
      subtitles,
      summary,
      detectedLanguage,
    });

    return res.json({
      success: true,
      modelUsed: SUBTITLE_MODEL,
      data: result,
    });
  } catch (error: unknown) {
    console.error('Error generating TikTok content:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('503') || message.includes('high demand') || message.includes('UNAVAILABLE')) {
      return res.status(503).json({
        error: 'Gemini AI ဆာဗာတွင် လောလောဆယ် လူသုံးများနေပါသည် (Server High Demand)။ ခေတ္တခဏစောင့်ဆိုင်းပြီး ပြန်လည်စမ်းသပ်ပေးပါ။',
      });
    }
    return res.status(500).json({
      error: `TikTok ခေါင်းစဉ်နှင့် Hashtags ဖန်တီးရာတွင် အမှားဖြစ်ပေါ်ပါသည်: ${message}`,
    });
  }
});

// Health check endpoint displaying active model
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    model: SUBTITLE_MODEL,
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Set up Vite middleware for development or static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[Myanmar AI Subtitle Studio] Server listening on http://0.0.0.0:${PORT} (Configured Model: ${SUBTITLE_MODEL})`
    );
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
