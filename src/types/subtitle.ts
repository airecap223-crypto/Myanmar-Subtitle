export interface SubtitleSegment {
  index: number;
  start: string; // "00:00:01,200"
  end: string;   // "00:00:04,500"
  startMs?: number;
  endMs?: number;
  source_text: string;
  burmese_text: string;
  speaker?: string;
  needs_review?: boolean;
}

export interface TikTokTitles {
  curiosity_hook: string;
  emotional_hook: string;
  mystery_hook: string;
  story_hook: string;
  viral_hook: string;
}

export interface ValidationIssue {
  type: 'warning' | 'error' | 'repaired';
  message: string;
  segmentIndex?: number;
}

export interface ValidationResult {
  isValid: boolean;
  repaired: boolean;
  issues: ValidationIssue[];
  stats: {
    totalSegments: number;
    totalDurationSeconds: number;
    warningsCount: number;
    repairedCount: number;
  };
}

export type ProcessingState =
  | 'idle'
  | 'uploading'
  | 'uploaded'
  | 'extracting_audio'
  | 'analyzing'
  | 'transcribing'
  | 'translating'
  | 'generating_srt'
  | 'validating_srt'
  | 'completed'
  | 'error';

export interface AnalysisResponseData {
  detected_language: string;
  summary: string;
  segments: SubtitleSegment[];
  tiktok_titles: TikTokTitles;
  titles?: string[];
  hashtags: string[];
  srt_content: string;
  validation: ValidationResult;
}
