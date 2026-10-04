import {
  AnalysisResponseData,
  ProcessingState,
  SubtitleSegment,
  TikTokTitles,
} from '../types/subtitle';
import { extractAudioFromVideo } from '../utils/audioExtractor';
import { generateSrt } from '../utils/srtParser';
import { validateAndRepairSubtitles } from '../utils/srtValidator';

export interface ProgressCallback {
  (state: ProcessingState, percent: number, message: string): void;
}

export async function processVideoToMyanmarSrt(
  videoFile: File,
  onProgress?: ProgressCallback
): Promise<AnalysisResponseData> {
  // Step 1: Audio Extraction
  onProgress?.('extracting_audio', 15, 'ဗီဒီယိုဖိုင်မှ စကားပြောအသံကို ခွဲထုတ်နေပါသည်...');

  const extraction = await extractAudioFromVideo(
    videoFile,
    (pct, msg) => {
      onProgress?.('extracting_audio', Math.round(15 + (pct * 0.25)), msg);
    },
    70 // 70s per chunk
  );

  const chunks = extraction.chunks;
  const allRawSegments: SubtitleSegment[] = [];
  let detectedLanguage = 'Undetected';
  let overallSummary = '';

  // Step 2: Analyze Chunks with Gemini AI
  onProgress?.('analyzing', 45, 'Gemini AI ဖြင့် စကားပြောသံနှင့် အချိန်သတ်မှတ်ချက်များကို ရှာဖွေနေပါသည်...');

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkProgressBase = 45 + Math.round((i / chunks.length) * 35);

    onProgress?.(
      'transcribing',
      chunkProgressBase,
      chunks.length > 1
        ? `အပိုင်း (${i + 1}/${chunks.length}) ရှိ စကားပြောသံကို မှတ်သားနေပါသည်...`
        : 'မူရင်းစကားပြောသံနှင့် ဇာတ်ကောင်များကို စစ်ဆေးနေပါသည်...'
    );

    let chunkData: any = null;
    let lastChunkError: string | null = null;
    const maxChunkRetries = 3;

    for (let retry = 0; retry <= maxChunkRetries; retry++) {
      try {
        if (retry > 0) {
          onProgress?.(
            'transcribing',
            chunkProgressBase,
            `ဆာဗာတွင် လူသုံးများနေပါသဖြင့် အလိုအလျောက် ပြန်လည်ကြိုးစားနေပါသည် (${retry}/${maxChunkRetries})...`
          );
          await new Promise(resolve => setTimeout(resolve, 2000 * retry));
        }

        const response = await fetch('/api/analyze-chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: chunk.base64Audio,
            mimeType: chunk.mimeType,
            chunkIndex: chunk.chunkIndex,
            totalChunks: chunk.totalChunks,
            startOffsetSeconds: chunk.startOffsetSeconds,
          }),
        });

        if (!response.ok) {
          const errorJson = await response.json().catch(() => ({}));
          const errStr = errorJson.error || `Status: ${response.status}`;
          // Check for 503 or high demand
          if (response.status === 503 || errStr.includes('503') || errStr.includes('high demand') || errStr.includes('UNAVAILABLE')) {
            lastChunkError = 'Gemini AI ဆာဗာတွင် လောလောဆယ် လူသုံးများနေပါသည် (Server High Demand)။ ခေတ္တစောင့်ဆိုင်းပြီး ပြန်လည်စမ်းသပ်ပေးပါ။';
            if (retry < maxChunkRetries) continue;
          }
          throw new Error(errStr);
        }

        const resJson = await response.json();
        if (!resJson.success || !resJson.data) {
          throw new Error(resJson.error || 'AI ခွဲခြမ်းစိတ်ဖြာမှု မအောင်မြင်ပါ');
        }

        chunkData = resJson.data;
        break; // Successfully got chunk data
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
          lastChunkError = 'Gemini AI ဆာဗာတွင် လောလောဆယ် လူသုံးများနေပါသည် (Server High Demand)။ ခေတ္တစောင့်ဆိုင်းပြီး ပြန်လည်စမ်းသပ်ပေးပါ။';
          if (retry < maxChunkRetries) continue;
        }
        lastChunkError = msg;
        if (retry >= maxChunkRetries) {
          throw new Error(lastChunkError);
        }
      }
    }

    if (!chunkData) {
      throw new Error(lastChunkError || `အပိုင်း #${i + 1} ကို ခွဲခြမ်းစိတ်ဖြာရာတွင် အမှားဖြစ်ပေါ်ပါသည်`);
    }
    if (chunkData.detected_language && detectedLanguage === 'Undetected') {
      detectedLanguage = chunkData.detected_language;
    }
    if (chunkData.summary) {
      overallSummary += (overallSummary ? ' ' : '') + chunkData.summary;
    }

    if (Array.isArray(chunkData.segments)) {
      for (const seg of chunkData.segments) {
        allRawSegments.push(seg);
      }
    }
  }

  // Step 3: Translating & Structuring Subtitles
  onProgress?.('translating', 82, 'သဘာဝကျသော မြန်မာစကားပြော စာတန်းထိုးအဖြစ် ပြောင်းလဲနေပါသည်...');

  // Step 4: Generating and Validating SRT
  onProgress?.('validating_srt', 88, 'SRT အချိန်သတ်မှတ်ချက်နှင့် နံပါတ်စဉ်များကို အလိုအလျောက် စစ်ဆေးပြင်ဆင်နေပါသည်...');

  const { segments: validatedSegments, validation } = validateAndRepairSubtitles(allRawSegments);
  const finalSrtContent = generateSrt(validatedSegments);

  // Step 5: Generating TikTok Titles and Hashtags
  onProgress?.('generating_srt', 93, 'TikTok ခေါင်းစဉ် (Hooks) ၅ မျိုးနှင့် Hashtags များကို ထုတ်ယူနေပါသည်...');

  let tiktokTitles: TikTokTitles = {
    curiosity_hook: 'သူမရဲ့ လျှို့ဝှက်ချက်ကို သိသွားတဲ့အချိန်…',
    emotional_hook: 'ဒီစကားကြားတော့ ရင်ထဲ တကယ် မခံစားနိုင်တော့ဘူး…',
    mystery_hook: 'တကယ်တမ်း နောက်ကွယ်မှာ ဘာတွေ ဖြစ်ခဲ့တာလဲ?',
    story_hook: 'မထင်မှတ်ထားတဲ့ အလှည့်အပြောင်းတစ်ခု ပေါ်ပေါက်လာချိန်!',
    viral_hook: 'ဒီတစ်ခါတော့ သူလုံးဝ မလွတ်တော့ဘူး!',
  };

  let hashtags: string[] = [
    '#MyanmarSubtitle',
    '#ChineseDrama',
    '#DramaRecap',
    '#ဇာတ်လမ်းတို',
    '#မြန်မာစာတန်းထိုး',
  ];

  let titlesList: string[] = [
    'သူမရဲ့ လျှို့ဝှက်ချက်ကို သိသွားတဲ့အချိန်…',
    'ဒီစကားကြားတော့ ရင်ထဲ တကယ် မခံစားနိုင်တော့ဘူး…',
    'တကယ်တမ်း နောက်ကွယ်မှာ ဘာတွေ ဖြစ်ခဲ့တာလဲ?',
    'မထင်မှတ်ထားတဲ့ အလှည့်အပြောင်းတစ်ခု ပေါ်ပေါက်လာချိန်!',
    'ဒီတစ်ခါတော့ သူလုံးဝ မလွတ်တော့ဘူး!',
  ];

  try {
    const tiktokRes = await fetch('/api/generate-tiktok-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subtitles: validatedSegments,
        summary: overallSummary,
        detectedLanguage,
      }),
    });

    if (tiktokRes.ok) {
      const tiktokData = await tiktokRes.json();
      if (Array.isArray(tiktokData.data?.titles) && tiktokData.data.titles.length > 0) {
        titlesList = tiktokData.data.titles.slice(0, 5);
      }
      if (tiktokData.data?.tiktok_titles) {
        tiktokTitles = tiktokData.data.tiktok_titles;
      }
      if (Array.isArray(tiktokData.data?.hashtags) && tiktokData.data.hashtags.length > 0) {
        hashtags = tiktokData.data.hashtags.slice(0, 5);
      }
    }
  } catch (err) {
    console.warn('Non-fatal error generating TikTok titles:', err);
  }

  onProgress?.('completed', 100, '✓ အောင်မြင်စွာ ပြီးဆုံးပါပြီ');

  return {
    detected_language: detectedLanguage,
    summary: overallSummary,
    segments: validatedSegments,
    tiktok_titles: tiktokTitles,
    titles: titlesList,
    hashtags,
    srt_content: finalSrtContent,
    validation,
  };
}
