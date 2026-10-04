import { SubtitleSegment, ValidationIssue, ValidationResult } from '../types/subtitle';
import { formatMsToSrtTimestamp, parseSrtTimestampToMs } from './srtParser';

// Regex for strictly valid SRT timestamp: 00:00:00,000
const TIMESTAMP_REGEX = /^\d{2}:\d{2}:\d{2}[,\.]\d{3}$/;

// Regex to detect Chinese characters (Hanzi)
const CHINESE_CHAR_REGEX = /[\u4e00-\u9fa5]/;

// Regex to detect pure English sentence with no Burmese Unicode
const BURMESE_CHAR_REGEX = /[\u1000-\u109F\uAA60-\uAA7F\uA9E0-\uA9FF]/;

/**
 * Validates and repairs subtitle segments according to professional standards.
 */
export function validateAndRepairSubtitles(
  segments: SubtitleSegment[]
): { segments: SubtitleSegment[]; validation: ValidationResult } {
  const issues: ValidationIssue[] = [];
  let repairedCount = 0;
  let warningsCount = 0;

  if (!segments || segments.length === 0) {
    return {
      segments: [],
      validation: {
        isValid: false,
        repaired: false,
        issues: [{ type: 'error', message: 'No subtitles found to validate' }],
        stats: {
          totalSegments: 0,
          totalDurationSeconds: 0,
          warningsCount: 1,
          repairedCount: 0,
        },
      },
    };
  }

  // Work on a deep clone
  const working: SubtitleSegment[] = segments.map((s, i) => ({
    ...s,
    index: i + 1,
    start: s.start.trim().replace('.', ','),
    end: s.end.trim().replace('.', ','),
    startMs: parseSrtTimestampToMs(s.start),
    endMs: parseSrtTimestampToMs(s.end),
  }));

  // Sort by startMs strictly
  working.sort((a, b) => (a.startMs ?? 0) - (b.startMs ?? 0));

  const validSegments: SubtitleSegment[] = [];

  for (let i = 0; i < working.length; i++) {
    const seg = working[i];
    const prevSeg = validSegments[validSegments.length - 1];

    // Check 1: Empty text
    if (!seg.burmese_text || !seg.burmese_text.trim()) {
      issues.push({
        type: 'warning',
        segmentIndex: i + 1,
        message: `Segment #${i + 1} has empty subtitle text.`,
      });
      warningsCount++;
      continue; // Skip completely empty
    }

    // Check 2: Timestamp format
    let validStart = TIMESTAMP_REGEX.test(seg.start);
    let validEnd = TIMESTAMP_REGEX.test(seg.end);

    if (!validStart || !validEnd) {
      // Attempt repair
      if (seg.startMs !== undefined && seg.endMs !== undefined && seg.endMs > seg.startMs) {
        seg.start = formatMsToSrtTimestamp(seg.startMs);
        seg.end = formatMsToSrtTimestamp(seg.endMs);
        issues.push({
          type: 'repaired',
          segmentIndex: i + 1,
          message: `Repaired malformed timestamp format on segment #${i + 1}`,
        });
        repairedCount++;
      } else {
        issues.push({
          type: 'error',
          segmentIndex: i + 1,
          message: `Invalid timestamp format on segment #${i + 1} (${seg.start} --> ${seg.end})`,
        });
        warningsCount++;
      }
    }

    // Check 3: Start time < End time
    let sMs = seg.startMs ?? parseSrtTimestampToMs(seg.start);
    let eMs = seg.endMs ?? parseSrtTimestampToMs(seg.end);

    if (sMs >= eMs) {
      // Auto repair: ensure at least 1200ms duration
      eMs = sMs + 1500;
      seg.end = formatMsToSrtTimestamp(eMs);
      seg.endMs = eMs;
      issues.push({
        type: 'repaired',
        segmentIndex: i + 1,
        message: `End time was earlier or equal to start time on #${i + 1}. Adjusted to +1.5s.`,
      });
      repairedCount++;
    }

    // Check 4: Overlapping with previous segment
    if (prevSeg) {
      const prevEndMs = prevSeg.endMs ?? parseSrtTimestampToMs(prevSeg.end);
      if (sMs < prevEndMs) {
        // Slight overlap resolution: clamp previous end to start time or slightly before
        if (sMs > (prevSeg.startMs ?? 0) + 400) {
          prevSeg.endMs = sMs - 50;
          prevSeg.end = formatMsToSrtTimestamp(prevSeg.endMs);
          issues.push({
            type: 'repaired',
            segmentIndex: i + 1,
            message: `Resolved overlapping timestamp between segment #${prevSeg.index} and #${i + 1}.`,
          });
          repairedCount++;
        }
      }
    }

    // Check 5: Accidental Chinese text leak
    if (CHINESE_CHAR_REGEX.test(seg.burmese_text)) {
      issues.push({
        type: 'warning',
        segmentIndex: i + 1,
        message: `Segment #${i + 1} contains untranslated Chinese characters. Review recommended.`,
      });
      warningsCount++;
      seg.needs_review = true;
    }

    // Check 6: Check if Burmese text contains Myanmar script characters
    const hasBurmese = BURMESE_CHAR_REGEX.test(seg.burmese_text);
    if (!hasBurmese && seg.burmese_text.length > 5) {
      issues.push({
        type: 'warning',
        segmentIndex: i + 1,
        message: `Segment #${i + 1} may lack Myanmar script text.`,
      });
      warningsCount++;
    }

    // Sequential index assignment
    seg.index = validSegments.length + 1;
    validSegments.push(seg);
  }

  // Calculate total duration
  const lastSeg = validSegments[validSegments.length - 1];
  const totalDurationSeconds = lastSeg && lastSeg.endMs ? Math.round(lastSeg.endMs / 1000) : 0;

  const isValid = issues.filter(i => i.type === 'error').length === 0;

  return {
    segments: validSegments,
    validation: {
      isValid,
      repaired: repairedCount > 0,
      issues,
      stats: {
        totalSegments: validSegments.length,
        totalDurationSeconds,
        warningsCount,
        repairedCount,
      },
    },
  };
}
