import React, { useState } from 'react';
import { Download, Check, FileDown, ShieldCheck } from 'lucide-react';
import { downloadSrtFile, getSrtDownloadFilename } from '../utils/fileUtils';

interface DownloadButtonProps {
  srtContent: string;
  originalFilename: string;
  disabled?: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  srtContent,
  originalFilename,
  disabled = false,
}) => {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    if (!srtContent || disabled) return;

    const targetFilename = getSrtDownloadFilename(originalFilename);
    downloadSrtFile(srtContent, targetFilename);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const filename = getSrtDownloadFilename(originalFilename);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <button
        type="button"
        onClick={handleDownload}
        disabled={disabled || !srtContent}
        className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm shadow-xl transition-all active:scale-95 cursor-pointer ${
          downloaded
            ? 'bg-emerald-600 text-white shadow-emerald-600/30'
            : 'bg-gradient-to-r from-rose-500 via-rose-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white shadow-rose-500/25 hover:shadow-rose-500/40'
        } ${disabled || !srtContent ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      >
        {downloaded ? (
          <>
            <Check className="w-5 h-5 text-white animate-bounce" />
            <span className="font-burmese">ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ! (Saved)</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5 text-white" />
            <span className="tracking-wide">[ Download Myanmar SRT ]</span>
          </>
        )}
      </button>

      <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 self-center sm:self-auto">
        <FileDown className="w-3.5 h-3.5 text-slate-400" />
        <span className="truncate max-w-[200px]" title={filename}>
          {filename}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          UTF-8 BOM
        </span>
      </div>
    </div>
  );
};
