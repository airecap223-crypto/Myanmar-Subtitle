import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  Download,
  Copy,
  Check,
  Film,
  Zap,
  Clock,
  Eye,
  FileText,
  Languages,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Header } from './components/Header';
import { VideoUploader } from './components/VideoUploader';
import { VideoPreview } from './components/VideoPreview';
import { ProcessingStatus } from './components/ProcessingStatus';

import { VideoMetadata, SampleVideo } from './types/video';
import {
  SubtitleSegment,
  ProcessingState,
  AnalysisResponseData,
  ValidationResult,
  TikTokTitles,
} from './types/subtitle';
import { processVideoToMyanmarSrt } from './services/subtitleService';
import { validateAndRepairSubtitles } from './utils/srtValidator';
import { generateSrt, parseSrt } from './utils/srtParser';

interface ToastState {
  show: boolean;
  message: string;
  type: 'ok' | 'err';
}

export default function App() {
  // Video State
  const [currentVideo, setCurrentVideo] = useState<VideoMetadata | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Processing State
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Results State
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);
  const [srtOutputText, setSrtOutputText] = useState<string>('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [titlesList, setTitlesList] = useState<string[]>([]);
  const [tiktokTitles, setTiktokTitles] = useState<TikTokTitles | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);

  // Active Tab: 'srt' or 'tiktok'
  const [activeTab, setActiveTab] = useState<'srt' | 'tiktok'>('srt');

  // Video Ref for timeline jumping
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Toast State
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'ok',
  });
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'ok' | 'err' = 'ok') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3200);
  };

  // Sync srtOutputText whenever subtitles array changes
  useEffect(() => {
    if (subtitles.length > 0) {
      const generated = generateSrt(subtitles);
      setSrtOutputText(generated);
    }
  }, [subtitles]);

  // Handle Video Selection
  const handleVideoSelected = (file: File) => {
    const videoUrl = URL.createObjectURL(file);
    setCurrentVideo({
      name: file.name,
      size: file.size,
      type: file.type || 'video/mp4',
      url: videoUrl,
    });
    setVideoFile(file);

    // Reset processing state
    setProcessingState('uploaded');
    setProgressPercent(0);
    setProgressMessage('Video ဖိုင် ထည့်သွင်းပြီးပါပြီ။ [ 🚀 မြန်မာ SRT ဖန်တီးပါ ] ကို နှိပ်ပါ');
    setErrorMessage(null);
    setSubtitles([]);
    setSrtOutputText('');
    setTitlesList([]);
    setTiktokTitles(null);
    setHashtags([]);
  };

  // Handle Sample Video Selection
  const handleSampleSelected = (sample: SampleVideo) => {
    setCurrentVideo({
      name: `${sample.id}.mp4`,
      size: 4.8 * 1024 * 1024,
      type: 'video/mp4',
      url: sample.url,
      duration: 25,
    });
    setVideoFile(null); // Sample Demo
    setErrorMessage(null);

    if (sample.sampleSubtitles) {
      setProcessingState('uploaded');
      setProgressMessage('နမူနာဗီဒီယို ပြင်ဆင်ပြီးပါပြီ။ [ 🚀 မြန်မာ SRT ဖန်တီးပါ ] ကို နှိပ်ပါ');

      const { segments: validated, validation: valRes } = validateAndRepairSubtitles(
        sample.sampleSubtitles.segments
      );
      setSubtitles(validated);
      setValidation(valRes);
      setTiktokTitles(sample.sampleSubtitles.tiktok_titles);
      setTitlesList([
        sample.sampleSubtitles.tiktok_titles.curiosity_hook,
        sample.sampleSubtitles.tiktok_titles.emotional_hook,
        sample.sampleSubtitles.tiktok_titles.mystery_hook,
        sample.sampleSubtitles.tiktok_titles.story_hook,
        sample.sampleSubtitles.tiktok_titles.viral_hook,
      ]);
      setHashtags(sample.sampleSubtitles.hashtags);
    }
  };

  // Reset Everything
  const handleReset = () => {
    setCurrentVideo(null);
    setVideoFile(null);
    setProcessingState('idle');
    setProgressPercent(0);
    setProgressMessage('');
    setErrorMessage(null);
    setSubtitles([]);
    setSrtOutputText('');
    setValidation(null);
    setTitlesList([]);
    setTiktokTitles(null);
    setHashtags([]);
    setActiveSegmentIndex(null);
    showToast('အသစ်ပြန်လည် စတင်ပါပြီ');
  };

  // Main Action: Process Video to Myanmar SRT
  const handleProcessVideo = async () => {
    if (!currentVideo) {
      showToast('Video ဖိုင် ရွေးချယ်ပေးပါ', 'err');
      return;
    }

    setErrorMessage(null);

    if (videoFile) {
      setProcessingState('extracting_audio');
      setProgressPercent(10);
      setProgressMessage('📤 Video ဖိုင်မှ စကားပြောသံကို ခွဲထုတ်နေသည်...');

      try {
        const result = await processVideoToMyanmarSrt(
          videoFile,
          (state, percent, msg) => {
            setProcessingState(state);
            setProgressPercent(percent);
            setProgressMessage(msg);
          }
        );

        setSubtitles(result.segments);
        setValidation(result.validation);
        setTiktokTitles(result.tiktok_titles);
        setTitlesList(result.titles && result.titles.length > 0 ? result.titles : [
          result.tiktok_titles.curiosity_hook,
          result.tiktok_titles.emotional_hook,
          result.tiktok_titles.mystery_hook,
          result.tiktok_titles.story_hook,
          result.tiktok_titles.viral_hook,
        ]);
        setHashtags(result.hashtags);
        setProcessingState('completed');
        setProgressPercent(100);
        setProgressMessage('🎉 အားလုံး ပြီးပါပြီ!');
        showToast('မြန်မာ SRT ဖန်တီးပြီးပါပြီ ✓', 'ok');
      } catch (err: unknown) {
        console.error('Error during subtitle generation:', err);
        const msg = err instanceof Error ? err.message : 'အမည်မသိ အမှားဖြစ်ပေါ်ပါသည်';
        setProcessingState('error');
        setErrorMessage(msg);
        showToast(`Error: ${msg}`, 'err');
      }
    } else {
      // Demo Preset Simulation
      setProcessingState('analyzing');
      setProgressPercent(35);
      setProgressMessage('🧠 မြန်မာဘာသာ SRT ဖန်တီးနေသည် (ခဏစောင့်ပါ)...');

      setTimeout(() => {
        setProgressPercent(75);
        setProgressMessage('✅ SRT ဖန်တီးပြီးပါပြီ။ TikTok အကြောင်းအရာ ဖန်တီးနေသည်...');
      }, 700);

      setTimeout(() => {
        setProcessingState('completed');
        setProgressPercent(100);
        setProgressMessage('🎉 အားလုံး ပြီးပါပြီ!');
        showToast('မြန်မာ SRT ဖန်တီးပြီးပါပြီ ✓', 'ok');
      }, 1400);
    }
  };

  // Textarea Change Handler (allows direct live editing of raw SRT)
  const handleSrtTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setSrtOutputText(newText);
    try {
      const parsed = parseSrt(newText);
      if (parsed.length > 0) {
        const { segments: validated, validation: valRes } = validateAndRepairSubtitles(parsed);
        setSubtitles(validated);
        setValidation(valRes);
      }
    } catch {
      // Allow user to freely edit without breaking typing flow
    }
  };

  // Download SRT with UTF-8 BOM
  const handleDownloadSrt = () => {
    if (!srtOutputText.trim()) {
      showToast('SRT စာသား မရှိပါ', 'err');
      return;
    }
    const blob = new Blob(['\ufeff' + srtOutputText], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const baseName = currentVideo?.name ? currentVideo.name.replace(/\.[^.]+$/, '') : 'subtitle';
    a.download = `${baseName}.myanmar.srt`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('SRT ဖိုင် ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ ✓', 'ok');
  };

  // Copy Helpers
  const copyText = (text: string, successMsg = 'ကူးယူပြီးပါပြီ ✓') => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => showToast(successMsg, 'ok'),
      () => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast(successMsg, 'ok');
      }
    );
  };

  const handleCopySrt = () => {
    if (!srtOutputText.trim()) return showToast('SRT စာသား မရှိပါ', 'err');
    copyText(srtOutputText, 'SRT ကူးယူပြီးပါပြီ ✓');
  };

  const handleCopyAllTitles = () => {
    if (!titlesList.length) return showToast('ခေါင်းစဉ် မရှိပါ', 'err');
    copyText(titlesList.join('\n'), 'ခေါင်းစဉ်အားလုံး ကူးယူပြီးပါပြီ ✓');
  };

  const handleCopyAllTags = () => {
    if (!hashtags.length) return showToast('Hashtag မရှိပါ', 'err');
    copyText(hashtags.join(' '), 'Hashtag အားလုံး ကူးယူပြီးပါပြီ ✓');
  };

  // Seek Video to Subtitle Segment
  const handleSelectSegment = (seg: SubtitleSegment) => {
    setActiveSegmentIndex(seg.index);
    if (videoElementRef.current && seg.startMs !== undefined) {
      videoElementRef.current.currentTime = seg.startMs / 1000;
      if (videoElementRef.current.paused) {
        videoElementRef.current.play().catch(() => {});
      }
    }
  };

  const isBusy =
    processingState !== 'idle' &&
    processingState !== 'uploaded' &&
    processingState !== 'completed' &&
    processingState !== 'error';

  const hasResults = subtitles.length > 0 || (titlesList.length > 0 && processingState === 'completed');

  return (
    <div className="min-h-screen text-[#e8ecf5] flex flex-col font-sans">
      {/* Header */}
      <Header />

      {/* Main Container */}
      <main className="max-w-[1180px] w-full mx-auto px-4 sm:px-6 py-7 space-y-6 flex-1">
        {/* Step 0: Google AI Studio Connection Banner */}
        <div className="bg-gradient-to-r from-[#151b2b] via-[#1b2233] to-[#151b2b] border border-[#252d42] rounded-[18px] p-4 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.28)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-[#7c5cff]/15 text-[#b9a7ff] border border-[#7c5cff]/30 text-xs font-bold font-mono grid place-items-center flex-shrink-0">
              0
            </span>
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Google AI Studio API အသင့်ချိတ်ဆက်ထားသည်</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Ready
                </span>
              </div>
              <p className="text-xs text-[#8f9bb3] font-burmese mt-0.5">
                Gemini 2.5 Flash နှင့် အလိုအလျောက် Auto-Retry (Exponential Backoff) စနစ်ဖြင့် ဆာဗာအလုပ်ရှုပ်ချိန်တွင် အရန်မော်ဒယ်သို့ အဆင်ပြေစွာ ပြောင်းလဲပေးပါသည်
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-[#0d1322] border border-[#252d42] text-[#8f9bb3] font-mono">
              Server-Side API Key Active
            </span>
          </div>
        </div>

        {/* Step 1: Video Upload Card */}
        <div className="bg-gradient-to-b from-[#151b2b] to-[#1b2233] border border-[#252d42] rounded-[18px] p-5 sm:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.28)] space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2.5 text-white">
            <span className="w-6 h-6 rounded-lg bg-[#7c5cff]/15 text-[#b9a7ff] border border-[#7c5cff]/30 text-xs font-bold font-mono grid place-items-center">
              1
            </span>
            <span>Video ဖိုင် Upload တင်ပါ</span>
          </h2>

          {/* Upload Drop Zone & Info */}
          <VideoUploader
            currentVideo={currentVideo}
            onVideoSelected={handleVideoSelected}
            onSampleSelected={handleSampleSelected}
            onRemoveVideo={handleReset}
            disabled={isBusy}
          />

          {/* Video Preview Player */}
          {currentVideo && (
            <div className="mt-4">
              <video
                ref={videoElementRef}
                src={currentVideo.url}
                controls
                className="w-full max-h-[360px] rounded-xl bg-black border border-[#252d42] object-contain shadow-lg"
              />
            </div>
          )}

          {/* Processing Status & Progress Bar */}
          <ProcessingStatus
            state={processingState}
            percent={progressPercent}
            message={progressMessage}
            error={errorMessage}
            onRetry={handleProcessVideo}
          />

          {/* Action Toolbar */}
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <button
              type="button"
              onClick={handleProcessVideo}
              disabled={!currentVideo || isBusy}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#7c5cff] via-[#6366f1] to-[#22d3ee] shadow-[0_8px_24px_rgba(124,92,255,0.35)] hover:shadow-[0_10px_30px_rgba(124,92,255,0.5)] active:scale-95 transition-all disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>🚀</span>
              <span className="font-burmese">မြန်မာ SRT ဖန်တီးပါ</span>
            </button>

            {currentVideo && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isBusy}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm text-[#e8ecf5] bg-[#1b2233] border border-[#2f3a55] hover:border-[#7c5cff] transition-all cursor-pointer disabled:opacity-45"
              >
                <RotateCcw className="w-4 h-4 text-[#8f9bb3]" />
                <span className="font-burmese">↺ အသစ်ပြန်စ</span>
              </button>
            )}
          </div>
        </div>

        {/* Step 2: Result Card with Tabs */}
        {hasResults && (
          <div className="bg-gradient-to-b from-[#151b2b] to-[#1b2233] border border-[#252d42] rounded-[18px] p-5 sm:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.28)] space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 flex-wrap border-b border-[#252d42] pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('srt')}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'srt'
                    ? 'bg-[#7c5cff]/15 border border-[#7c5cff] text-[#cbbcff]'
                    : 'bg-transparent border border-[#2f3a55] text-[#8f9bb3] hover:text-[#e8ecf5]'
                }`}
              >
                <span>📄</span>
                <span className="font-burmese">မြန်မာ SRT</span>
                {subtitles.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#7c5cff]/20 text-[#b9a7ff] font-mono">
                    {subtitles.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tiktok')}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'tiktok'
                    ? 'bg-[#7c5cff]/15 border border-[#7c5cff] text-[#cbbcff]'
                    : 'bg-transparent border border-[#2f3a55] text-[#8f9bb3] hover:text-[#e8ecf5]'
                }`}
              >
                <span>🎵</span>
                <span className="font-burmese">TikTok ခေါင်းစဉ် & Hashtag</span>
                {titlesList.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#22d3ee]/20 text-[#9fe9f7] font-mono">
                    {titlesList.length + hashtags.length}
                  </span>
                )}
              </button>
            </div>

            {/* Panel 1: SRT Output */}
            {activeTab === 'srt' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-[#8f9bb3]">
                  <span className="font-burmese">
                    လိုအပ်ရင် စာသားကို တိုက်ရိုက် ပြင်နိုင်ပါတယ် (သို့မဟုတ် အောက်တွင် အချိန်ကိုက် စစ်ဆေးပါ)
                  </span>
                  {validation && (
                    <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Validated Timestamps: {subtitles.length} segments
                    </span>
                  )}
                </div>

                {/* Editable Textarea */}
                <textarea
                  id="srtOutput"
                  value={srtOutputText}
                  onChange={handleSrtTextareaChange}
                  spellCheck={false}
                  placeholder="SRT ဖိုင် ဒီမှာ ပေါ်လာပါမယ်..."
                  className="w-full min-h-[340px] max-h-[500px] resize-y bg-[#0a0e1a] border border-[#252d42] rounded-xl p-4 text-[#d5def0] font-mono text-xs sm:text-sm leading-relaxed outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff]/30 transition-all font-burmese"
                />

                {/* SRT Toolbar */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleDownloadSrt}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#7c5cff] to-[#5b8cff] shadow-[0_8px_24px_rgba(124,92,255,0.35)] hover:shadow-[0_10px_30px_rgba(124,92,255,0.5)] active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span className="font-burmese">⬇ SRT ဖိုင် Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySrt}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-[#e8ecf5] bg-[#1b2233] border border-[#2f3a55] hover:border-[#7c5cff] transition-all cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-[#8f9bb3]" />
                    <span className="font-burmese">📋 Copy SRT</span>
                  </button>
                </div>

                {/* Clickable Subtitle Segments Timeline Viewer */}
                {subtitles.length > 0 && (
                  <div className="mt-5 border-t border-[#252d42] pt-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#8f9bb3]">
                      <span className="font-semibold text-white flex items-center gap-1.5 font-burmese">
                        <Clock className="w-3.5 h-3.5 text-[#22d3ee]" />
                        အချိန်ကိုက် စာတန်းထိုး တန်းစီဇယား (နှိပ်၍ ဗီဒီယိုနှင့် တိုက်ဆိုင် စစ်ဆေးပါ)
                      </span>
                    </div>

                    <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
                      {subtitles.map((seg, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectSegment(seg)}
                          className={`p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all flex items-start gap-3 ${
                            activeSegmentIndex === seg.index
                              ? 'bg-[#7c5cff]/15 border-[#7c5cff] text-white shadow-md'
                              : 'bg-[#0d1322] border-[#252d42] text-[#d5def0] hover:border-[#2f3a55] hover:bg-[#151b2b]'
                          }`}
                        >
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#1b2233] text-[#b9a7ff] border border-[#7c5cff]/30 flex-shrink-0">
                            #{seg.index}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-[11px] text-[#8f9bb3]">
                              {seg.start} ➔ {seg.end}
                            </div>
                            <div className="font-burmese font-medium mt-1 text-[#e8ecf5]">
                              {seg.burmese_text}
                            </div>
                            {seg.source_text && (
                              <div className="text-[11px] text-[#8f9bb3] mt-0.5 truncate">
                                မူရင်း: {seg.source_text}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              copyText(seg.burmese_text, 'စာကြောင်း ကူးယူပြီးပါပြီ');
                            }}
                            className="p-1 rounded text-[#8f9bb3] hover:text-white transition-colors"
                            title="Copy line"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Panel 2: TikTok Titles & Hashtags */}
            {activeTab === 'tiktok' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {titlesList.length === 0 && hashtags.length === 0 ? (
                  <div className="text-center py-10 text-[#8f9bb3] text-sm font-burmese">
                    <div className="text-3xl mb-2 opacity-50">🎵</div>
                    SRT ဖန်တီးပြီးရင် TikTok ခေါင်းစဉ်နဲ့ Hashtag တွေ ဒီမှာ ပေါ်လာပါမယ်
                  </div>
                ) : (
                  <>
                    {/* Section: 5 TikTok Titles */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2 text-white">
                          <span className="w-6 h-6 rounded-lg bg-[#7c5cff]/15 text-[#b9a7ff] border border-[#7c5cff]/30 text-xs font-bold font-mono grid place-items-center">
                            4
                          </span>
                          <span className="font-burmese">TikTok ခေါင်းစဉ် ၅ ခု</span>
                        </h3>
                        <button
                          type="button"
                          onClick={handleCopyAllTitles}
                          className="text-xs px-3 py-1.5 rounded-lg border border-[#2f3a55] bg-[#1b2233] text-[#e8ecf5] hover:border-[#7c5cff] transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Copy className="w-3 h-3 text-[#8f9bb3]" />
                          <span>📋 အားလုံး Copy</span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        {titlesList.map((title, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 bg-[#0d1322] border border-[#252d42] rounded-xl p-3.5 hover:border-[#2f3a55] transition-all group"
                          >
                            <div className="font-mono text-xs font-bold text-[#b9a7ff] bg-[#7c5cff]/15 border border-[#7c5cff]/30 w-6 h-6 rounded-lg grid place-items-center flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <div className="flex-1 text-sm font-burmese text-[#e8ecf5] break-words">
                              {title}
                            </div>
                            <button
                              type="button"
                              onClick={() => copyText(title, 'ခေါင်းစဉ် ကူးယူပြီးပါပြီ ✓')}
                              className="px-2.5 py-1 rounded-lg border border-[#2f3a55] bg-[#151b2b] hover:border-[#7c5cff] text-[#8f9bb3] hover:text-white text-xs transition-all cursor-pointer flex-shrink-0"
                              title="Copy title"
                            >
                              📋
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section: 5 Hashtags */}
                    <div className="space-y-3 pt-3 border-t border-[#252d42]">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2 text-white">
                          <span className="w-6 h-6 rounded-lg bg-[#22d3ee]/15 text-[#22d3ee] border border-[#22d3ee]/30 text-xs font-bold font-mono grid place-items-center">
                            5
                          </span>
                          <span className="font-burmese">Hashtag ၅ ခု</span>
                        </h3>
                        <button
                          type="button"
                          onClick={handleCopyAllTags}
                          className="text-xs px-3 py-1.5 rounded-lg border border-[#2f3a55] bg-[#1b2233] text-[#e8ecf5] hover:border-[#22d3ee] transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Copy className="w-3 h-3 text-[#8f9bb3]" />
                          <span>📋 အားလုံး Copy</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {hashtags.map((tag, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => copyText(tag, 'Hashtag ကူးယူပြီးပါပြီ ✓')}
                            className="inline-flex items-center gap-2 bg-[#22d3ee]/[0.09] border border-[#22d3ee]/30 text-[#9fe9f7] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-[#22d3ee]/[0.18] hover:-translate-y-0.5 transition-all cursor-pointer"
                          >
                            <span>{tag}</span>
                            <span className="text-[10px] opacity-60">📋</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Animated Toast */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl border text-sm font-medium shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300 z-50 flex items-center gap-2.5 font-burmese ${
          toast.show ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'
        } ${
          toast.type === 'err'
            ? 'bg-[#1b2233] border-rose-500/50 text-rose-200'
            : 'bg-[#1b2233] border-emerald-500/50 text-emerald-200'
        }`}
      >
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
