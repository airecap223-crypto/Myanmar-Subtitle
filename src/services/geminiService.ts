import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Resilient multi-model pool for high-availability subtitle transcription and translation:
 * Automatically uses gemini-2.5-flash / gemini-3.8-flash with fallback on 503 high demand.
 */
export const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export const CANDIDATE_MODELS = Array.from(
  new Set([
    PRIMARY_MODEL,
    'gemini-2.5-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ])
);

/**
 * Centralized Gemini AI client configured for server-side execution.
 */
export const aiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const SRT_SYSTEM_PROMPT = `သင်သည် ဗီဒီယိုမှ စကားပြောများကို မြန်မာဘာသာသို့ ပြန်ဆိုတတ်သော ကျွမ်းကျင်သူ ဘာသာပြန်တစ်ဦးဖြစ်သည်။
အဓိက လိုအပ်ချက်များ:
- မြန်မာစကားပြောဟန် (colloquial) ကို အသုံးပြုပါ
- စာအုပ်စာပေဟန်၊ ရုံးသုံးဟန်၊ တရားဝင်ဟန် မသုံးပါနှင့်
- သူငယ်ချင်းအချင်းပြောသလို ရင်းနှီးပေါ့ပါးသော စကားဖြင့် ရေးပါ
- ခေတ်သစ်မြန်မာစကားလုံးများ၊ နေ့စဉ်သုံးစကားလုံးများ သုံးပါ
- မူရင်းအဓိပ္ပာယ်၊ စိတ်ခံစားမှု၊ အကြောင်းအရာနှင့် အချိန်သတ်မှတ်ချက်များကို တိကျစွာ ထိန်းသိမ်းပါ`;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('high demand') ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('overloaded') ||
    msg.includes('temporarily') ||
    msg.includes('500')
  );
}

/**
 * Executes a generateContent call with automatic exponential backoff retry
 * and multi-model failover when 503 High Demand / UNAVAILABLE is encountered.
 */
export async function executeSubtitleRequest(params: {
  contents: unknown;
  config: unknown;
}) {
  let lastError: unknown = null;

  for (const model of CANDIDATE_MODELS) {
    const maxRetriesPerModel = 3;

    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const response = await aiClient.models.generateContent({
          model,
          contents: params.contents as any,
          config: params.config as any,
        });

        if (response && response.text) {
          return response;
        }
      } catch (err: unknown) {
        lastError = err;
        const errMsg = err instanceof Error ? err.message : String(err);

        if (isRetryableError(err)) {
          if (attempt < maxRetriesPerModel) {
            // Exponential backoff with jitter
            const waitTime = 2000 * Math.pow(2, attempt - 1) + Math.random() * 1000;
            console.warn(
              `[geminiService] Model '${model}' experienced high traffic / 503. Retrying in ${Math.round(waitTime)}ms (Attempt ${attempt}/${maxRetriesPerModel})...`
            );
            await delay(waitTime);
            continue;
          } else {
            console.warn(
              `[geminiService] Model '${model}' retries exhausted. Switching to fallback model...`
            );
            break; // Switch to next candidate model
          }
        } else {
          if (errMsg.includes('404') || errMsg.includes('not found')) {
            break;
          }
          throw err;
        }
      }
    }
  }

  if (isRetryableError(lastError)) {
    throw new Error(
      'Gemini AI ဆာဗာတွင် လောလောဆယ် လူသုံးများနေပါသဖြင့် (Server High Demand) ခေတ္တခဏစောင့်ဆိုင်းပြီး [ပြန်လည်စမ်းသပ်မည်] ကို နှိပ်ပေးပါ။'
    );
  }

  throw lastError || new Error('AI စနစ်မှ အကြောင်းပြန်ချက် မရရှိပါ');
}

/**
 * Transcribe and translate an audio chunk into conversational Burmese with exact timestamps.
 */
export async function transcribeAndTranslateAudioChunk(params: {
  audioBase64: string;
  mimeType: string;
  chunkIndex: number;
  totalChunks: number;
  startOffsetSeconds: number;
}) {
  const {
    audioBase64,
    mimeType = 'audio/wav',
    chunkIndex = 0,
    totalChunks = 1,
    startOffsetSeconds = 0,
  } = params;

  const offsetPrompt =
    startOffsetSeconds > 0
      ? `This audio chunk begins at absolute video time ${startOffsetSeconds.toFixed(2)} seconds. Calculate all subtitle start and end timestamps relative to the global video timeline (add ${startOffsetSeconds.toFixed(2)} seconds to relative timestamps). Example: if a dialogue occurs at 2.5s within this chunk, its global timestamp should be ${(startOffsetSeconds + 2.5).toFixed(2)}s formatted as HH:MM:SS,mmm.`
      : `Start timestamps from 00:00:00,000 for this video segment.`;

  const promptText = `Analyze this audio chunk (Chunk ${chunkIndex + 1} of ${totalChunks}).
${offsetPrompt}

Tasks:
1. Detect original spoken language (e.g., Chinese, English, Korean, Japanese, Thai, Burmese, etc.).
2. Detect every spoken dialogue segment with exact start and end timestamps in HH:MM:SS,mmm format.
3. If speaker changes are noticeable, identify the speaker (e.g. "Speaker 1", "Male Lead", "Female Lead").
4. Translate each dialogue into natural, colloquial conversational Burmese (Myanmar).
5. If background music or silence has no dialogue, return an empty segments list without error.
6. Provide a brief 1-2 sentence English/Burmese summary of what was discussed in this chunk.`;

  const response = await executeSubtitleRequest({
    contents: [
      {
        inlineData: {
          mimeType,
          data: audioBase64,
        },
      },
      {
        text: promptText,
      },
    ],
    config: {
      systemInstruction: SRT_SYSTEM_PROMPT,
      temperature: 0.2, // Low temperature for high timestamp accuracy
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detected_language: {
            type: Type.STRING,
            description: 'The detected spoken language in this audio chunk',
          },
          summary: {
            type: Type.STRING,
            description: 'Brief summary of the dialogue in this segment',
          },
          segments: {
            type: Type.ARRAY,
            description: 'List of subtitle segments with timestamps and Burmese translations',
            items: {
              type: Type.OBJECT,
              properties: {
                index: { type: Type.INTEGER },
                start: {
                  type: Type.STRING,
                  description: 'Start timestamp in HH:MM:SS,mmm format',
                },
                end: {
                  type: Type.STRING,
                  description: 'End timestamp in HH:MM:SS,mmm format',
                },
                source_text: {
                  type: Type.STRING,
                  description: 'Original detected speech text',
                },
                burmese_text: {
                  type: Type.STRING,
                  description: 'Natural conversational Burmese translation',
                },
                speaker: {
                  type: Type.STRING,
                  description: 'Identified speaker label if detectable',
                },
                needs_review: {
                  type: Type.BOOLEAN,
                  description: 'True if speech was faint, muffled or ambiguous',
                },
              },
              required: ['index', 'start', 'end', 'source_text', 'burmese_text'],
            },
          },
        },
        required: ['detected_language', 'segments'],
      },
    },
  });

  const textOutput = response.text;
  if (!textOutput) {
    throw new Error('AI မှ အဖြေမထုတ်ပေးနိုင်ပါ (Empty AI response)');
  }

  return JSON.parse(textOutput);
}

/**
 * Generate 5 TikTok hooks and 5 hashtags based on the dialogue transcript
 */
export async function generateTikTokContentWithGemini(params: {
  subtitles: Array<{ burmese_text?: string; source_text?: string }>;
  summary?: string;
  detectedLanguage?: string;
}) {
  const { subtitles = [], summary = '', detectedLanguage = '' } = params;

  const dialogueTranscript = subtitles
    .slice(0, 40)
    .map(
      (s, idx) =>
        `[${idx + 1}] Original: ${s.source_text || ''} | Burmese: ${s.burmese_text || ''}`
    )
    .join('\n');

  const promptText = `Based strictly on this video dialogue transcript and summary:
Language: ${detectedLanguage}
Summary: ${summary}

Transcript:
${dialogueTranscript}

Tasks:
1. Generate exactly 5 TikTok-friendly Burmese titles based ONLY on the story/content found in this dialogue:
   - Must be engaging, conversational Burmese, suitable for TikTok short videos
   - Under 100 characters each
   - May include 1 relevant emoji
2. Categorize the 5 hooks:
   - Curiosity Hook: စူးစမ်းချင်စိတ်ကို နှိုးဆွပေးသော ခေါင်းစဉ်
   - Emotional Hook: ခံစားချက်ကို ထိခိုက်စေသော ခေါင်းစဉ်
   - Mystery Hook: လျှို့ဝှက်ဆန်းကြယ်ပြီး ဆက်ကြည့်ချင်စေသော ခေါင်းစဉ်
   - Story Hook: ဇာတ်လမ်းအနှစ်ချုပ်ကို ဆွဲဆောင်မှုရှိစေသော ခေါင်းစဉ်
   - Short Viral-Style Hook: တိုတိုတုတ်တုတ်နှင့် Viral ဖြစ်စေမည့် ခေါင်းစဉ်
3. Generate exactly 5 relevant TikTok hashtags in Myanmar and English that reflect the genre and content.
Example: #MyanmarSubtitle #ChineseDrama #DramaRecap #ဇာတ်လမ်းတို #မြန်မာစာတန်းထိုး`;

  const response = await executeSubtitleRequest({
    contents: promptText,
    config: {
      systemInstruction:
        'သင်သည် လူမှုကွန်ရက် အကြောင်းအရာ ဖန်တီးသူတစ်ဦးဖြစ်သည်။ TikTok အတွက် ဆွဲဆောင်မှုရှိသော ခေါင်းစဉ်များနှင့် hashtag များကို ဖန်တီးပေးသည်။',
      temperature: 0.5,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          titles: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Exactly 5 catchy TikTok video titles in colloquial Burmese',
          },
          tiktok_titles: {
            type: Type.OBJECT,
            properties: {
              curiosity_hook: { type: Type.STRING },
              emotional_hook: { type: Type.STRING },
              mystery_hook: { type: Type.STRING },
              story_hook: { type: Type.STRING },
              viral_hook: { type: Type.STRING },
            },
            required: [
              'curiosity_hook',
              'emotional_hook',
              'mystery_hook',
              'story_hook',
              'viral_hook',
            ],
          },
          hashtags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Exactly 5 relevant TikTok hashtags',
          },
        },
        required: ['titles', 'tiktok_titles', 'hashtags'],
      },
    },
  });

  const textOutput = response.text;
  return JSON.parse(textOutput || '{}');
}

export const SUBTITLE_MODEL = PRIMARY_MODEL;
