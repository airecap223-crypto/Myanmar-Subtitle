import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Video, FileText, CheckCircle, Clock } from 'lucide-react';
import { VideoMetadata } from '../types/video';
import { SubtitleSegment } from '../types/subtitle';
import { formatFileSize, formatDuration } from '../utils/fileUtils';

interface VideoPreviewProps {
  video: VideoMetadata;
  subtitles?: SubtitleSegment[];
  activeSegmentIndex?: number | null;
  onTimeUpdate?: (currentTimeSeconds: number) => void;
  onSelectSegment?: (index: number) => void;
  videoRefOut?: React.RefObject<HTMLVideoElement | null>;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  video,
  subtitles = [],
  activeSegmentIndex = null,
  onTimeUpdate,
  onSelectSegment,
  videoRefOut,
}) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const activeVideoRef = videoRefOut || internalVideoRef;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 0);
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');

  const togglePlay = () => {
    if (!activeVideoRef.current) return;
    if (activeVideoRef.current.paused) {
      activeVideoRef.current.play();
      setIsPlaying(true);
    } else {
      activeVideoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!activeVideoRef.current) return;
    activeVideoRef.current.muted = !activeVideoRef.current.muted;
    setIsMuted(activeVideoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (!activeVideoRef.current) return;
    const cur = activeVideoRef.current.currentTime;
    setCurrentTime(cur);
    onTimeUpdate?.(cur);

    // Find active subtitle at currentTime
    const curMs = cur * 1000;
    const matched = subtitles.find(s => {
      const sMs = s.startMs ?? 0;
      const eMs = s.endMs ?? 0;
      return curMs >= sMs && curMs <= eMs;
    });

    if (matched) {
      setCurrentSubtitleText(matched.burmese_text);
      if (onSelectSegment && matched.index !== activeSegmentIndex) {
        onSelectSegment(matched.index);
      }
    } else {
      setCurrentSubtitleText('');
    }
  };

  const handleLoadedMetadata = () => {
    if (activeVideoRef.current) {
      setDuration(activeVideoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (activeVideoRef.current) {
      activeVideoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const toggleFullscreen = () => {
    if (activeVideoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        activeVideoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl shadow-black/40">
      {/* File Info Bar */}
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Video className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-100 truncate max-w-xs sm:max-w-md">
              {video.name}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{formatFileSize(video.size)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatDuration(duration || 0)}
              </span>
              {subtitles.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">
                    {subtitles.length} Subtitles
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Ready for Analysis</span>
          </span>
        </div>
      </div>

      {/* Video Display & Subtitle Overlay Area */}
      <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden">
        <video
          ref={activeVideoRef}
          src={video.url}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          playsInline
        />

        {/* Live Subtitle Overlay on Video */}
        {currentSubtitleText && (
          <div className="absolute bottom-14 left-0 right-0 px-4 flex justify-center pointer-events-none transition-all duration-150">
            <div className="max-w-[85%] bg-black/85 text-white font-burmese text-center px-4 py-2 rounded-lg text-sm sm:text-base md:text-lg font-semibold tracking-wide backdrop-blur-sm border border-white/10 shadow-2xl animate-fade-in">
              {currentSubtitleText}
            </div>
          </div>
        )}

        {/* Big Center Play Button Overlay on Hover */}
        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-500/50 backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 cursor-pointer"
          >
            <Play className="w-7 h-7 ml-1" />
          </button>
        )}

        {/* Video Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          {/* Progress Slider */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:h-2 transition-all"
          />

          <div className="flex items-center justify-between text-xs text-white px-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="hover:text-rose-400 transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="hover:text-rose-400 transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="font-mono text-[11px] text-slate-300">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {subtitles.length > 0 && (
                <span className="text-[11px] text-rose-300 font-burmese bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                  Live စာတန်းထိုး ON
                </span>
              )}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
