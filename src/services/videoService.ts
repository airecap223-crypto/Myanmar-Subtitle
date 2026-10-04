/**
 * Video Processing Service
 * Provides helpers for video metadata extraction, duration detection,
 * and media format verification.
 */

import { VideoMetadata } from '../types/video';

export async function getVideoMetadata(file: File): Promise<VideoMetadata> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;

    video.onloadedmetadata = () => {
      resolve({
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.onerror = () => {
      resolve({
        name: file.name,
        size: file.size,
        type: file.type,
        url,
      });
    };
  });
}
