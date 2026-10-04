import { SubtitleSegment } from '../types/subtitle';

/**
 * Converts milliseconds to SRT timestamp format: HH:MM:SS,mmm
 */
export function formatMsToSrtTimestamp(ms: number): string {
  if (isNaN(ms) || ms < 0) ms = 0;

  const totalSeconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor(ms % 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds
    .toString()
    .padStart(3, '0')}`;
}

/**
 * Converts an SRT timestamp (HH:MM:SS,mmm or HH:MM:SS.mmm) to milliseconds
 */
export function parseSrtTimestampToMs(timestamp: string): number {
  if (!timestamp) return 0;
  // Normalize comma or dot
  const clean = timestamp.trim().replace('.', ',');
  const parts = clean.split(':');
  if (parts.length < 3) return 0;

  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  const secParts = parts[2].split(',');
  const seconds = parseInt(secParts[0], 10) || 0;
  const milliseconds = parseInt(secParts[1], 10) || 0;

  return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
}

/**
 * Generates valid standard SRT string from SubtitleSegment array
 */
export function generateSrt(segments: SubtitleSegment[]): string {
  return segments
    .filter(seg => seg.burmese_text && seg.burmese_text.trim().length > 0)
    .map((seg, idx) => {
      const num = idx + 1;
      const start = seg.start.trim();
      const end = seg.end.trim();
      const text = seg.burmese_text.trim();
      return `${num}\n${start} --> ${end}\n${text}`;
    })
    .join('\n\n') + '\n';
}

/**
 * Parses raw SRT string into SubtitleSegment objects
 */
export function parseSrt(srtContent: string): SubtitleSegment[] {
  if (!srtContent || !srtContent.trim()) return [];

  // Normalize line endings
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.trim().split(/\n\s*\n/);

  const segments: SubtitleSegment[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const lines = blocks[i].trim().split('\n');
    if (lines.length < 2) continue;

    // Line 0: optional index or timestamp line
    let timeLineIndex = 0;
    let indexVal = i + 1;

    if (lines[0].includes('-->')) {
      timeLineIndex = 0;
    } else {
      const parsedIndex = parseInt(lines[0].trim(), 10);
      if (!isNaN(parsedIndex)) {
        indexVal = parsedIndex;
      }
      timeLineIndex = 1;
    }

    if (!lines[timeLineIndex] || !lines[timeLineIndex].includes('-->')) {
      continue;
    }

    const timeParts = lines[timeLineIndex].split('-->');
    if (timeParts.length < 2) continue;

    const start = timeParts[0].trim();
    const end = timeParts[1].trim();

    // The rest is the subtitle text
    const textLines = lines.slice(timeLineIndex + 1);
    const burmese_text = textLines.join('\n').trim();

    const startMs = parseSrtTimestampToMs(start);
    const endMs = parseSrtTimestampToMs(end);

    segments.push({
      index: indexVal,
      start,
      end,
      startMs,
      endMs,
      source_text: '',
      burmese_text,
    });
  }

  return segments;
}
