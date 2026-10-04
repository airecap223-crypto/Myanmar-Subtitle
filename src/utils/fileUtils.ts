/**
 * Utility functions for file handling, formatting, and downloads.
 */

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getFilenameWithoutExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return filename;
  return filename.substring(0, lastDotIndex);
}

export function getSrtDownloadFilename(originalFilename: string): string {
  const baseName = getFilenameWithoutExtension(originalFilename);
  // Sanitize for file system safety
  const safeBase = baseName.replace(/[^a-zA-Z0-9_\-\u1000-\u109F]/g, '_');
  return `${safeBase || 'subtitle'}_mm.srt`;
}

/**
 * Downloads a string as a UTF-8 encoded .srt file with BOM
 * (\uFEFF prefix guarantees proper Unicode rendering in Premiere, CapCut, DaVinci, VLC)
 */
export function downloadSrtFile(srtContent: string, filename: string): void {
  // UTF-8 BOM
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const encoder = new TextEncoder();
  const encodedText = encoder.encode(srtContent);

  const combinedBlob = new Blob([bom, encodedText], {
    type: 'text/plain;charset=utf-8',
  });

  const url = URL.createObjectURL(combinedBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 200);
}
