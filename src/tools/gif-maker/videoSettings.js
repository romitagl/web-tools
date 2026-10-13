export const VIDEO_FRAME_RATES = [5, 10, 20, 25];
export const MAX_VIDEO_FRAMES = 600;
export const DEFAULT_VIDEO_CLIP = { start: 0, end: '', fps: 10 };

export function getVideoPlan(duration, clip) {
  const start = Number(clip.start);
  const end = Number(clip.end);
  const fps = Number(clip.fps);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error('The video must have a readable duration.');
  }
  if (clip.start === '' || clip.end === '' || !Number.isFinite(start) || !Number.isFinite(end)
    || start < 0 || end <= start || end > duration + 0.000001) {
    throw new Error('Choose a start and end time within the video, with the end after the start.');
  }
  if (!VIDEO_FRAME_RATES.includes(fps)) throw new Error('Choose a supported frame rate.');
  const frameCount = Math.ceil((end - start) * fps - 0.0000001);
  if (frameCount > MAX_VIDEO_FRAMES) {
    throw new Error(`Choose a shorter clip or a lower frame rate (maximum ${MAX_VIDEO_FRAMES} frames).`);
  }
  return { start, end, fps, frameCount, delay: 1000 / fps };
}
