import React, { useState } from 'react';
import { Hash, Copy, Check } from 'lucide-react';

interface HashtagsProps {
  hashtags: string[];
}

export const Hashtags: React.FC<HashtagsProps> = ({ hashtags }) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!hashtags || hashtags.length === 0) return null;

  const allHashtagsString = hashtags.join(' ');

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(allHashtagsString);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySingle = async (tag: string, index: number) => {
    await navigator.clipboard.writeText(tag);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <Hash className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>TikTok & Facebook Hashtags (၅ ခု)</span>
            </h3>
            <p className="text-xs text-slate-400 font-burmese mt-0.5">
              ဗီဒီယိုနှင့် အံဝင်ခွင်ကျဖြစ်သော မြန်မာနှင့် အင်္ဂလိပ် Hashtags များ
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyAll}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
            copiedAll
              ? 'bg-emerald-600 text-white shadow-emerald-600/30'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
          }`}
        >
          {copiedAll ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Copied All! (အားလုံးကူးပြီးပါပြီ)</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>[ Copy All Hashtags ]</span>
            </>
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {hashtags.slice(0, 5).map((tag, idx) => {
          const isCopied = copiedIndex === idx;
          const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleCopySingle(cleanTag, idx)}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-burmese font-semibold border transition-all active:scale-95 cursor-pointer ${
                isCopied
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-950/80 hover:bg-slate-800 border-slate-700/80 hover:border-indigo-500/60 text-slate-200 hover:text-white'
              }`}
            >
              <Hash className="w-3 h-3 text-indigo-400 group-hover:text-indigo-300" />
              <span className="text-sm">{cleanTag}</span>
              {isCopied ? (
                <Check className="w-3 h-3 text-emerald-400 ml-1" />
              ) : (
                <Copy className="w-3 h-3 text-slate-500 group-hover:text-slate-300 ml-1 opacity-60 group-hover:opacity-100" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
