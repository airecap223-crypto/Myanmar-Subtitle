export interface VideoMetadata {
  name: string;
  size: number;
  type: string;
  url: string;
  duration?: number;
  width?: number;
  height?: number;
  hasAudioTrack?: boolean;
}

export interface SampleVideo {
  id: string;
  title: string;
  description: string;
  category: string;
  durationText: string;
  url: string;
  thumbnail: string;
  sampleSubtitles?: {
    detected_language: string;
    summary: string;
    segments: Array<{
      index: number;
      start: string;
      end: string;
      source_text: string;
      burmese_text: string;
      speaker?: string;
    }>;
    tiktok_titles: {
      curiosity_hook: string;
      emotional_hook: string;
      mystery_hook: string;
      story_hook: string;
      viral_hook: string;
    };
    hashtags: string[];
  };
}
