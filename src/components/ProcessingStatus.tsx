import React from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileCheck2,
  Languages,
  Film,
  AudioWaveform,
} from 'lucide-react';
import { ProcessingState } from '../types/subtitle';

interface ProcessingStatusProps {
  state: ProcessingState;
  percent: number;
  message: string;
  error?: string | null;
  onRetry?: () => void;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  state,
  percent,
  message,
  error,
  onRetry,
}) => {
  if (state === 'idle') return null;

  const getStepIcon = () => {
    switch (state) {
      case 'extracting_audio':
        return <AudioWaveform className="w-5 h-5 text-indigo-400 animate-pulse" />;
      case 'analyzing':
      case 'transcribing':
        return <Film className="w-5 h-5 text-purple-400 animate-pulse" />;
      case 'translating':
        return <Languages className="w-5 h-5 text-rose-400 animate-pulse" />;
      case 'generating_srt':
      case 'validating_srt':
        return <FileCheck2 className="w-5 h-5 text-amber-400 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      default:
        return <Loader2 className="w-5 h-5 text-rose-400 animate-spin" />;
    }
  };

  const getStatusBadge = () => {
    switch (state) {
      case 'extracting_audio':
        return 'အသံဖိုင် စစ်ဆေးခြင်း (Extracting Audio)';
      case 'analyzing':
        return 'ဗီဒီယို စစ်ဆေးခြင်း (Analyzing Video)';
      case 'transcribing':
        return 'စကားပြောသံ မှတ်သားခြင်း (Transcribing Speech)';
      case 'translating':
        return 'မြန်မာဘာသာသို့ ပြောင်းလဲခြင်း (Translating to Myanmar)';
      case 'generating_srt':
        return 'SRT ဖိုင် တည်ဆောက်ခြင်း (Generating SRT)';
      case 'validating_srt':
        return 'SRT စစ်ဆေးပြင်ဆင်ခြင်း (Validating SRT)';
      case 'completed':
        return '✓ လုပ်ဆောင်ချက် အောင်မြင်ပါသည် (Completed)';
      case 'error':
        return 'လုပ်ဆောင်ချက် မအောင်မြင်ပါ (Error)';
      default:
        return 'လုပ်ဆောင်နေပါသည်...';
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-sm space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/60 shadow-inner">
            {getStepIcon()}
          </div>
          <div>
            <div className="text-xs font-semibold text-rose-400 tracking-wide uppercase font-mono">
              {getStatusBadge()}
            </div>
            <div className="text-sm font-medium text-slate-200 font-burmese mt-0.5">
              {message}
            </div>
          </div>
        </div>

        {state !== 'error' && state !== 'completed' && (
          <div className="text-right">
            <span className="text-lg font-bold font-mono text-white">{percent}%</span>
          </div>
        )}
      </div>

      {/* Animated Gradient Progress Bar */}
      {state !== 'error' && state !== 'completed' && (
        <div className="space-y-2">
          <div className="w-full bg-[#0d1322] rounded-full h-2 overflow-hidden border border-[#252d42]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7c5cff] to-[#22d3ee] transition-all duration-300 relative shadow-[0_0_12px_rgba(124,92,255,0.5)]"
              style={{ width: `${Math.max(4, Math.min(100, percent))}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8f9bb3]">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-[#7c5cff]/30 border-t-[#7c5cff] animate-spin flex-shrink-0" />
            <span className="font-burmese">{message || 'စတင်ရန် အသင့်...'}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {state === 'error' && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-sm space-y-2 font-burmese">
          <p>{error || 'တစ်ခုခု မှားယွင်းနေပါသည်။ ကျေးဇူးပြု၍ ပြန်လည် ကြိုးစားကြည့်ပါ။'}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              ပြန်လည်စမ်းသပ်မည် (Retry)
            </button>
          )}
        </div>
      )}

      {/* Completed Success State */}
      {state === 'completed' && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between font-burmese">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            SRT ဖိုင် အချိန်ကိုက် တည်ဆောက်ပြီးပါပြီ။ အောက်တွင် စစ်ဆေး၍ ဒေါင်းလုဒ်ဆွဲနိုင်ပါသည်။
          </span>
        </div>
      )}
    </div>
  );
};
