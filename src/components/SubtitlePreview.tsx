import React, { useState } from 'react';
import {
  Copy,
  Check,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Clock,
  Sparkles,
  Play,
  FileText,
} from 'lucide-react';
import { SubtitleSegment, ValidationResult } from '../types/subtitle';
import { DownloadButton } from './DownloadButton';
import { generateSrt } from '../utils/srtParser';

interface SubtitlePreviewProps {
  segments: SubtitleSegment[];
  validation: ValidationResult | null;
  originalFilename: string;
  activeSegmentIndex?: number | null;
  onSelectSegment?: (segment: SubtitleSegment) => void;
  onOpenEditor: () => void;
}

export const SubtitlePreview: React.FC<SubtitlePreviewProps> = ({
  segments,
  validation,
  originalFilename,
  activeSegmentIndex,
  onSelectSegment,
  onOpenEditor,
}) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const srtText = generateSrt(segments);

  const handleCopyAll = async () => {
    if (!srtText) return;
    await navigator.clipboard.writeText(srtText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySegment = async (text: string, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  if (segments.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-3">
        <FileText className="w-10 h-10 text-slate-600 mx-auto" />
        <h4 className="text-sm font-semibold text-slate-300">
          မြန်မာစာတန်းထိုး (SRT) မရှိသေးပါ
        </h4>
        <p className="text-xs text-slate-500 font-burmese max-w-sm mx-auto">
          အထက်ပါ [ Analyze Video ] ခလုတ်ကို နှိပ်၍ AI ဖြင့် စကားပြောသံကို ရှာဖွေပြီး စာတန်းထိုး ဖန်တီးပါ
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl space-y-0">
      {/* Header & Controls Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Myanmar SRT Preview</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({segments.length} segments)
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-burmese">
              စာတန်းထိုးတစ်ခုချင်းစီကို နှိပ်၍ ဗီဒီယိုနှင့် တိုက်ဆိုင် စစ်ဆေးနိုင်ပါသည်
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenEditor}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-rose-400" />
            <span>[ Edit SRT ]</span>
          </button>

          <button
            type="button"
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>[ Copy All ]</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Validation Status Notification Banner */}
      {validation && (
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {validation.isValid ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1.5 font-burmese">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ✓ SRT validation completed (စစ်ဆေးမှု အောင်မြင်ပါသည်)
              </span>
            ) : (
              <span className="text-amber-400 font-medium flex items-center gap-1.5 font-burmese">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                သတိပြုရန် အချက်များ တွေ့ရှိပါသည်
              </span>
            )}

            {validation.repaired && (
              <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[11px] flex items-center gap-1">
                <Wrench className="w-3 h-3" />
                <span>Auto-repaired ({validation.stats.repairedCount})</span>
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3">
            <span>Duration: ~{validation.stats.totalDurationSeconds}s</span>
            <span>Segments: {validation.stats.totalSegments}</span>
          </div>
        </div>
      )}

      {/* Scrollable Subtitles List Area */}
      <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-800/60 p-2 sm:p-3 space-y-1">
        {segments.map(seg => {
          const isActive = activeSegmentIndex === seg.index;
          return (
            <div
              key={seg.index}
              onClick={() => onSelectSegment?.(seg)}
              className={`p-3 rounded-xl transition-all duration-150 cursor-pointer flex flex-col gap-1.5 ${
                isActive
                  ? 'bg-rose-500/15 border border-rose-500/40 shadow-md ring-1 ring-rose-500/20'
                  : 'hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              {/* Segment Index & Timing Bar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      isActive
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {seg.index}
                  </span>

                  <span className="text-xs font-mono-code text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{seg.start}</span>
                    <span className="text-slate-500">--&gt;</span>
                    <span>{seg.end}</span>
                  </span>

                  {seg.speaker && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-burmese">
                      {seg.speaker}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {seg.needs_review && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Needs Review
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={e => handleCopySegment(seg.burmese_text, seg.index, e)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Copy subtitle text"
                  >
                    {copiedIndex === seg.index ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Original Spoken Text (if detectable) */}
              {seg.source_text && (
                <div className="text-xs text-slate-400 italic font-mono pl-7">
                  {seg.source_text}
                </div>
              )}

              {/* Natural Burmese Translation Subtitle */}
              <div className="text-sm sm:text-base font-burmese text-slate-100 font-semibold pl-7 leading-relaxed">
                {seg.burmese_text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtitle Footer with Download Action */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400 font-burmese text-center sm:text-left">
          UTF-8 အထူးကုဒ်စနစ်ဖြင့် ထုတ်လုပ်ထားသောကြောင့် Premiere Pro, CapCut, DaVinci Resolve နှင့် မီဒီယာပလေယာအားလုံးတွင် စာလုံးမပျက် ပြသနိုင်ပါသည်။
        </div>

        <DownloadButton
          srtContent={srtText}
          originalFilename={originalFilename}
        />
      </div>
    </div>
  );
};
