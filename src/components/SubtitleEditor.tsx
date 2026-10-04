import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Code2, List, AlertCircle, Check } from 'lucide-react';
import { SubtitleSegment } from '../types/subtitle';
import { generateSrt, parseSrt } from '../utils/srtParser';
import { validateAndRepairSubtitles } from '../utils/srtValidator';

interface SubtitleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  segments: SubtitleSegment[];
  onSave: (updatedSegments: SubtitleSegment[]) => void;
}

export const SubtitleEditor: React.FC<SubtitleEditorProps> = ({
  isOpen,
  onClose,
  segments,
  onSave,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'visual' | 'raw'>('visual');
  const [localSegments, setLocalSegments] = useState<SubtitleSegment[]>(() =>
    segments.map(s => ({ ...s }))
  );
  const [rawText, setRawText] = useState<string>(() => generateSrt(segments));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdateSegment = (
    index: number,
    field: keyof SubtitleSegment,
    value: string
  ) => {
    setLocalSegments(prev =>
      prev.map((seg, i) => (i === index ? { ...seg, [field]: value } : seg))
    );
  };

  const handleAddSegment = () => {
    const lastSeg = localSegments[localSegments.length - 1];
    const newStart = lastSeg ? lastSeg.end : '00:00:00,000';
    const newEnd = '00:00:05,000';

    const newSeg: SubtitleSegment = {
      index: localSegments.length + 1,
      start: newStart,
      end: newEnd,
      source_text: '',
      burmese_text: 'စာတန်းထိုး အသစ်ထည့်ရန်...',
    };

    setLocalSegments(prev => [...prev, newSeg]);
  };

  const handleDeleteSegment = (index: number) => {
    setLocalSegments(prev =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, index: i + 1 }))
    );
  };

  const handleSwitchMode = (newMode: 'visual' | 'raw') => {
    if (newMode === 'raw') {
      // Sync visual to raw
      setRawText(generateSrt(localSegments));
    } else {
      // Parse raw to visual
      try {
        const parsed = parseSrt(rawText);
        setLocalSegments(parsed);
        setErrorMsg(null);
      } catch (err) {
        setErrorMsg('SRT ဖိုင်ပုံစံ မှားယွင်းနေပါသည်။ စစ်ဆေးပေးပါ။');
        return;
      }
    }
    setMode(newMode);
  };

  const handleSave = () => {
    setErrorMsg(null);
    let finalSegments: SubtitleSegment[] = [];

    if (mode === 'raw') {
      try {
        finalSegments = parseSrt(rawText);
      } catch (err) {
        setErrorMsg('SRT စာသား မှားယွင်းနေပါသည်။ ပြန်လည်စစ်ဆေးပါ။');
        return;
      }
    } else {
      finalSegments = localSegments;
    }

    if (finalSegments.length === 0) {
      setErrorMsg('အနည်းဆုံး စာတန်းထိုး ၁ ခု ရှိရပါမည်။');
      return;
    }

    // Validate and repair
    const { segments: validated } = validateAndRepairSubtitles(finalSegments);
    onSave(validated);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Edit Myanmar Subtitles</span>
              <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-burmese">
                စာတန်းထိုး ပြင်ဆင်ရန်
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-burmese mt-0.5">
              အချိန် (Timestamp) နှင့် မြန်မာစာတန်းထိုး စကားလုံးများကို ပြင်ဆင်နိုင်ပါသည်
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => handleSwitchMode('visual')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  mode === 'visual'
                    ? 'bg-rose-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('raw')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  mode === 'raw'
                    ? 'bg-rose-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Raw SRT</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-burmese">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'visual' ? (
            <div className="space-y-3">
              {localSegments.map((seg, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      #{idx + 1}
                    </span>

                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                      <input
                        type="text"
                        value={seg.start}
                        onChange={e => handleUpdateSegment(idx, 'start', e.target.value)}
                        placeholder="00:00:00,000"
                        className="w-full px-2.5 py-1 text-xs font-mono rounded bg-slate-900 border border-slate-700 text-slate-200 focus:border-rose-500 focus:outline-none"
                      />
                      <span className="text-slate-500 text-xs font-mono">→</span>
                      <input
                        type="text"
                        value={seg.end}
                        onChange={e => handleUpdateSegment(idx, 'end', e.target.value)}
                        placeholder="00:00:00,000"
                        className="w-full px-2.5 py-1 text-xs font-mono rounded bg-slate-900 border border-slate-700 text-slate-200 focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSegment(idx)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete segment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {seg.source_text && (
                    <div className="text-xs text-slate-400 italic bg-slate-900/50 px-2.5 py-1 rounded border border-slate-800/50">
                      Original: {seg.source_text}
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-burmese">
                      မြန်မာစာတန်းထိုး (Burmese Text):
                    </label>
                    <textarea
                      rows={2}
                      value={seg.burmese_text}
                      onChange={e =>
                        handleUpdateSegment(idx, 'burmese_text', e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm font-burmese rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-rose-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddSegment}
                className="w-full py-2.5 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="font-burmese">စာတန်းထိုး နောက်တစ်ခု ထပ်ထည့်မည်</span>
              </button>
            </div>
          ) : (
            <div className="h-full space-y-2">
              <label className="text-xs text-slate-400 font-mono">
                Direct SRT File Content (UTF-8):
              </label>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                rows={16}
                className="w-full h-[400px] p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono-code text-xs sm:text-sm focus:border-rose-500 focus:outline-none leading-relaxed resize-none"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/25 active:scale-95 cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>သိမ်းဆည်းပြီးပါပြီ!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>သိမ်းဆည်းမည် (Save Changes)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
