import React from 'react';
import { Film, Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-[#252d42] bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7c5cff] to-[#22d3ee] flex items-center justify-center font-bold text-xl text-[#0b0f19] shadow-[0_8px_24px_rgba(124,92,255,0.35)] select-none">
            မ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#e8ecf5] font-burmese">
                မြန်မာ SRT ဖန်တီးစနစ်
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-[#7c5cff]/15 text-[#b9a7ff] border border-[#7c5cff]/30 uppercase tracking-wider font-mono">
                Studio
              </span>
            </div>
            <p className="text-xs text-[#8f9bb3] font-sans tracking-wide">
              Video → Burmese SRT → TikTok Content
            </p>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-[#8f9bb3]">
          <div className="flex items-center gap-1.5 bg-[#0d1322] border border-[#252d42] px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">Gemini 2.5 Flash</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#0d1322] border border-[#252d42] px-2.5 py-1 rounded-lg">
            <Zap className="w-3.5 h-3.5 text-[#22d3ee]" />
            <span className="text-slate-200">Auto-Retry Failover</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#0d1322] border border-[#252d42] px-2.5 py-1 rounded-lg hidden md:flex">
            <Sparkles className="w-3.5 h-3.5 text-[#b9a7ff]" />
            <span className="font-burmese text-slate-200">သဘာဝစကားပြော</span>
          </div>
        </div>
      </div>
    </header>
  );
};

