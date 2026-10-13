export const MIN_VIDEO_FPS = 1;
export const MAX_VIDEO_FPS = 50;
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
  if (!Number.isInteger(fps) || fps < MIN_VIDEO_FPS || fps > MAX_VIDEO_FPS) {
    throw new Error(`Frame rate must be a whole number between ${MIN_VIDEO_FPS} and ${MAX_VIDEO_FPS} frames per second.`);
  }
  const frameCount = Math.ceil((end - start) * fps - 0.0000001);
  if (frameCount > MAX_VIDEO_FRAMES) {
    throw new Error(`Choose a shorter clip or a lower frame rate (maximum ${MAX_VIDEO_FRAMES} frames).`);
  }
  return { start, end, fps, frameCount, delay: 1000 / fps };
}

export function getVideoFrameDelay(plan, index) {
  // GIF stores centiseconds. Round cumulative boundaries so rates like 3 or
  // 24 FPS preserve clip timing rather than accumulating rounding per frame.
  const start = Math.round(index / plan.fps * 100);
  const end = Math.round(Math.min((index + 1) / plan.fps, plan.end - plan.start) * 100);
  return Math.max(20, (end - start) * 10);
}
