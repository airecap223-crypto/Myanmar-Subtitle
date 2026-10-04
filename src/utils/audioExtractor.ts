/**
 * Client-side audio extractor using Web Audio API.
 * Extracts dialogue audio from video files (MP4, MOV, WebM, MKV)
 * into a lightweight 16kHz mono WAV format.
 */

export interface ExtractedAudioChunk {
  chunkIndex: number;
  totalChunks: number;
  startOffsetSeconds: number;
  durationSeconds: number;
  base64Audio: string;
  mimeType: string;
}

export interface ExtractionResult {
  durationSeconds: number;
  sampleRate: number;
  numberOfChannels: number;
  chunks: ExtractedAudioChunk[];
  fullBase64Wav?: string;
}

/**
 * Extracts and downsamples audio from video file to 16kHz mono WAV chunks
 */
export async function extractAudioFromVideo(
  videoFile: File,
  onProgress?: (percent: number, message: string) => void,
  chunkDurationSeconds: number = 75 // 75s per chunk for robust long video handling
): Promise<ExtractionResult> {
  onProgress?.(10, 'ဗီဒီယိုဖိုင်မှ အသံဖိုင်ကို စစ်ဆေးနေပါသည်...');

  const arrayBuffer = await videoFile.arrayBuffer();
  onProgress?.(25, 'အသံလှိုင်းများကို ခွဲခြမ်းစိတ်ဖြာနေပါသည်...');

  // Use AudioContext to decode video's audio track
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  } catch (err) {
    await audioCtx.close();
    throw new Error('ဗီဒီယိုဖိုင်မှ အသံကို ဖတ်ရှု၍မရပါ။ အသံမပါသော ဗီဒီယို ဖြစ်နိုင်ပါသည် သို့မဟုတ် Codec မထောက်ပံ့ပါ။');
  } finally {
    if (audioCtx.state !== 'closed') {
      await audioCtx.close();
    }
  }

  const durationSeconds = audioBuffer.duration;
  if (durationSeconds <= 0) {
    throw new Error('ဗီဒီယိုတွင် အသံဖိုင်ကြာချိန် မရှိပါ။');
  }

  onProgress?.(45, `အသံကြာချိန်: ${Math.round(durationSeconds)} စက္ကန့်...`);

  // Target 16000Hz mono for Gemini transcription & dialogue analysis
  const targetSampleRate = 16000;

  // Decide if chunking is needed (if duration > chunkDurationSeconds + 15)
  const isMultiChunk = durationSeconds > chunkDurationSeconds + 15;
  const totalChunks = isMultiChunk ? Math.ceil(durationSeconds / chunkDurationSeconds) : 1;
  const chunks: ExtractedAudioChunk[] = [];

  for (let c = 0; c < totalChunks; c++) {
    const chunkStartSec = c * chunkDurationSeconds;
    const chunkEndSec = Math.min((c + 1) * chunkDurationSeconds, durationSeconds);
    const chunkLenSec = chunkEndSec - chunkStartSec;

    onProgress?.(
      50 + Math.round((c / totalChunks) * 40),
      totalChunks > 1
        ? `အပိုင်း (${c + 1}/${totalChunks}) အသံကို ပြင်ဆင်နေပါသည်...`
        : 'အသံဖိုင်ကို အဆင့်မြှင့်တင်နေပါသည်...'
    );

    const chunkWavBlob = await renderAudioSliceToWav(
      audioBuffer,
      chunkStartSec,
      chunkEndSec,
      targetSampleRate
    );

    const base64Audio = await blobToBase64(chunkWavBlob);

    chunks.push({
      chunkIndex: c,
      totalChunks,
      startOffsetSeconds: chunkStartSec,
      durationSeconds: chunkLenSec,
      base64Audio,
      mimeType: 'audio/wav',
    });
  }

  onProgress?.(95, 'အသံဖိုင် ခွဲထုတ်မှု အောင်မြင်ပါသည်။');

  return {
    durationSeconds,
    sampleRate: targetSampleRate,
    numberOfChannels: 1,
    chunks,
    fullBase64Wav: chunks.length === 1 ? chunks[0].base64Audio : undefined,
  };
}

/**
 * Resamples an audio buffer slice to 16kHz mono and encodes as 16-bit PCM WAV
 */
async function renderAudioSliceToWav(
  sourceBuffer: AudioBuffer,
  startSec: number,
  endSec: number,
  targetSampleRate: number
): Promise<Blob> {
  const duration = Math.max(0.1, endSec - startSec);
  const targetLength = Math.ceil(duration * targetSampleRate);

  const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = sourceBuffer;
  source.connect(offlineCtx.destination);

  // Play from startSec
  source.start(0, startSec, duration);
  const renderedBuffer = await offlineCtx.startRendering();

  // Convert rendered mono float32 channel to 16-bit PCM WAV
  const channelData = renderedBuffer.getChannelData(0);
  return encode16BitPcmWav(channelData, targetSampleRate);
}

/**
 * Encodes Float32 audio samples into standard WAV binary with 44-byte RIFF header
 */
function encode16BitPcmWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length minus RIFF identifier and length
  view.setUint32(4, 36 + samples.length * 2, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // channel count (1 = mono)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * 1 * 2)
  view.setUint32(28, sampleRate * 2, true);
  // block align (1 * 2)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, samples.length * 2, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
