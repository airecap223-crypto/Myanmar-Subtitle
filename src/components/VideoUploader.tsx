import React, { useRef, useState } from 'react';
import { UploadCloud, FileVideo, Film, AlertCircle, PlayCircle, Sparkles } from 'lucide-react';
import { formatFileSize } from '../utils/fileUtils';
import { VideoMetadata, SampleVideo } from '../types/video';
import { SAMPLE_VIDEOS } from '../services/sampleData';

interface VideoUploaderProps {
  currentVideo: VideoMetadata | null;
  onVideoSelected: (file: File) => void;
  onSampleSelected: (sample: SampleVideo) => void;
  onRemoveVideo?: () => void;
  disabled?: boolean;
}

const SUPPORTED_EXTENSIONS = ['.mp4', '.mov', '.webm', '.mkv', '.avi', '.m4v'];

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  currentVideo,
  onVideoSelected,
  onSampleSelected,
  onRemoveVideo,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = (file: File) => {
    setUploadError(null);
    const fileName = file.name.toLowerCase();
    const hasValidExt = SUPPORTED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    const isVideoMime = file.type.startsWith('video/') || fileName.endsWith('.mkv');

    if (!hasValidExt && !isVideoMime) {
      setUploadError('Video ဖိုင် ဖြစ်ရပါမယ် (MP4, MOV, WEBM, MKV, AVI, M4V)');
      return;
    }

    onVideoSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Drop Zone */}
      {!currentVideo ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-10 transition-all text-center ${
            isDragging
              ? 'border-[#7c5cff] bg-[#7c5cff]/10 scale-[1.01]'
              : 'border-[#2f3a55] bg-[#7c5cff]/[0.03] hover:border-[#7c5cff] hover:bg-[#7c5cff]/[0.08]'
          } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mp4,.mov,.webm,.mkv,.avi,.m4v"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />

          <div className="text-4xl mb-3 select-none">🎬</div>

          <h3 className="text-base sm:text-lg font-semibold text-[#e8ecf5] mb-1 font-burmese">
            Video ဖိုင်ကို ဒီကို ဆွဲထည့်ပါ (သို့) နှိပ်ပြီး ရွေးပါ
          </h3>

          <p className="text-xs text-[#8f9bb3] font-mono mt-1">
            MP4 · MOV · WEBM · MKV · AVI · M4V (အများဆုံး ~2GB)
          </p>
        </div>
      ) : (
        /* File info card */
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#0d1322] border border-[#252d42]">
          <div className="w-10 h-10 rounded-xl bg-[#7c5cff]/15 border border-[#7c5cff]/30 flex items-center justify-center text-xl flex-shrink-0">
            🎬
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-[#e8ecf5] truncate">
              {currentVideo.name}
            </div>
            <div className="text-xs text-[#8f9bb3] font-mono mt-0.5">
              {formatFileSize(currentVideo.size)} · {currentVideo.type || 'video/mp4'}
            </div>
          </div>
          {onRemoveVideo && !disabled && (
            <button
              type="button"
              onClick={onRemoveVideo}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#2f3a55] bg-[#1b2233] text-[#e8ecf5] hover:border-rose-500/50 hover:text-rose-300 transition-all cursor-pointer"
            >
              ✕ ဖျက်ရန်
            </button>
          )}
        </div>
      )}

      {uploadError && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm flex items-start gap-2.5 font-burmese">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Quick Sample Presets */}
      {!currentVideo && (
        <div className="rounded-xl bg-[#0d1322]/80 border border-[#252d42] p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8f9bb3]">
              <Sparkles className="w-3.5 h-3.5 text-[#22d3ee]" />
              <span className="font-burmese text-slate-200">နမူနာ ဗီဒီယိုဖြင့် ချက်ချင်း စမ်းသပ်ကြည့်ရန်:</span>
            </div>
            <span className="text-[11px] text-[#8f9bb3] font-mono">One-click Demo</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SAMPLE_VIDEOS.map(sample => (
              <button
                key={sample.id}
                type="button"
                disabled={disabled}
                onClick={() => onSampleSelected(sample)}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-[#151b2b] hover:bg-[#1b2233] border border-[#252d42] hover:border-[#7c5cff]/50 text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-md bg-[#0d1322] flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                  {sample.thumbnail}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-[#b9a7ff] truncate">
                    {sample.title}
                  </div>
                  <div className="text-[11px] text-[#8f9bb3] flex items-center gap-2 mt-0.5">
                    <span>{sample.category}</span>
                    <span>•</span>
                    <span>{sample.durationText}</span>
                  </div>
                </div>
                <PlayCircle className="w-4 h-4 text-[#8f9bb3] group-hover:text-[#22d3ee] flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
