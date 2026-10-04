import React, { useState } from 'react';
import { Sparkles, Copy, Check, Flame, Heart, HelpCircle, BookOpen, Zap } from 'lucide-react';
import { TikTokTitles as TikTokTitlesType } from '../types/subtitle';

interface TikTokTitlesProps {
  titles: TikTokTitlesType | null;
}

interface HookItem {
  id: keyof TikTokTitlesType;
  label: string;
  labelBurmese: string;
  description: string;
  icon: React.ReactNode;
  tagColor: string;
}

const HOOK_DEFINITIONS: HookItem[] = [
  {
    id: 'curiosity_hook',
    label: '1. Curiosity Hook',
    labelBurmese: 'စူးစမ်းချင်စိတ် နှိုးဆွခေါင်းစဉ်',
    description: 'ပရိတ်သတ်ကို ဘာဆက်ဖြစ်မလဲ သိချင်သွားစေမည့် ခေါင်းစဉ်',
    icon: <HelpCircle className="w-4 h-4 text-amber-400" />,
    tagColor: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  },
  {
    id: 'emotional_hook',
    label: '2. Emotional Hook',
    labelBurmese: 'ခံစားချက် ထိခိုက်စေမည့် ခေါင်းစဉ်',
    description: 'ရင်ထဲထိစေပြီး စိတ်ခံစားချက်ကို ဆွဲဆောင်သည့် စကားလုံးများ',
    icon: <Heart className="w-4 h-4 text-rose-400" />,
    tagColor: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  },
  {
    id: 'mystery_hook',
    label: '3. Mystery Hook',
    labelBurmese: 'လျှို့ဝှက်ဆန်းကြယ် ခေါင်းစဉ်',
    description: 'လျှို့ဝှက်ချက်များနှင့် အဖြေရှာချင်အောင် ပြုလုပ်ပေးသည့် ပုံစံ',
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    tagColor: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  },
  {
    id: 'story_hook',
    label: '4. Story Hook',
    labelBurmese: 'ဇာတ်လမ်း အနှစ်ချုပ်ခေါင်းစဉ်',
    description: 'ဇာတ်လမ်းအလှည့်အပြောင်းကို စိတ်ဝင်စားဖွယ် ဖော်ပြထားသည့် ခေါင်းစဉ်',
    icon: <BookOpen className="w-4 h-4 text-blue-400" />,
    tagColor: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  },
  {
    id: 'viral_hook',
    label: '5. Short Viral-Style Hook',
    labelBurmese: 'တိုတိုတုတ်တုတ် Viral ခေါင်းစဉ်',
    description: 'ချက်ချင်း စွဲဆောင်နိုင်သည့် TikTok & Facebook အကြိုက် ခေါင်းစဉ်တို',
    icon: <Zap className="w-4 h-4 text-emerald-400" />,
    tagColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  },
];

export const TikTokTitles: React.FC<TikTokTitlesProps> = ({ titles }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!titles) return null;

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>5 TikTok Titles (ခေါင်းစဉ် ၅ မျိုး)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                AI Generated
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-burmese mt-0.5">
              ဗီဒီယိုဇာတ်လမ်းပါ အကြောင်းအရာအပေါ် အခြေခံ၍ စတိုင် ၅ မျိုးဖြင့် ရေးဖွဲ့ပေးထားပါသည်
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {HOOK_DEFINITIONS.map(item => {
          const titleText = titles[item.id] || '';
          const isCopied = copiedId === item.id;

          return (
            <div
              key={item.id}
              className="p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${item.tagColor}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  <span className="text-xs text-slate-400 font-burmese">
                    ({item.labelBurmese})
                  </span>
                </div>

                <div className="text-sm sm:text-base font-burmese font-bold text-white tracking-wide leading-relaxed pt-1">
                  “{titleText}”
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(titleText, item.id)}
                className={`self-start sm:self-center inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${
                  isCopied
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700/80 hover:border-rose-500'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copied! (ကူးပြီးပါပြီ)</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>[ Copy ]</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
