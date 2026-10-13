import { encodeFrames } from './encoder';
import { getVideoFrameDelay, getVideoPlan } from './videoSettings';

export const VIDEO_ACCEPT = 'video/*,.mp4,.webm,.mov,.m4v,.ogv';

export function isSupportedVideo(file) {
  return file.type.startsWith('video/') || (!file.type && /\.(mp4|webm|mov|m4v|ogv|ogg)$/i.test(file.name));
}

// Subscribe before load/seek so even cached media events cannot be missed.
function waitForMedia(video, eventName, signal, action) {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout);
      video.removeEventListener(eventName, ready);
      video.removeEventListener('error', failed);
      signal?.removeEventListener('abort', aborted);
    };
    const ready = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error('The video is corrupt or uses a codec your browser cannot play.')); };
    const aborted = () => { cleanup(); reject(signal.reason || new DOMException('Cancelled', 'AbortError')); };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('The video took too long to decode. Try another video or a different browser.'));
    }, 15000);
    video.addEventListener(eventName, ready, { once: true });
    video.addEventListener('error', failed, { once: true });
    signal?.addEventListener('abort', aborted, { once: true });
    try { action?.(); } catch (error) { cleanup(); reject(error); }
  });
}

async function seekVideo(video, time, signal) {
  signal?.throwIfAborted();
  if (!video.seeking && Math.abs(video.currentTime - time) < 0.000001 && video.readyState >= 2) return;
  await waitForMedia(video, 'seeked', signal, () => { video.currentTime = time; });
  if (video.readyState < 2) await waitForMedia(video, 'loadeddata', signal);
}

async function openVideo(file, signal) {
  signal?.throwIfAborted();
  const video = document.createElement('video');
  const url = URL.createObjectURL(file);
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  const release = () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  };
  try {
    await waitForMedia(video, 'loadeddata', signal, () => { video.src = url; video.load(); });
    // Some browser-recorded WebM files omit duration metadata. Seeking to the
    // end lets the native decoder discover their duration without transcoding.
    if (!Number.isFinite(video.duration)) await seekVideo(video, 1e10, signal);
    if (!Number.isFinite(video.duration) || video.duration <= 0 || !video.videoWidth || !video.videoHeight) {
      throw new Error('The video must have a readable duration and at least one video track.');
    }
    return { video, release };
  } catch (error) {
    release();
    throw error;
  }
}

export async function readVideoInfo(file, signal) {
  const { video, release } = await openVideo(file, signal);
  try {
    return { duration: video.duration, width: video.videoWidth, height: video.videoHeight };
  } finally {
    release();
  }
}

async function* videoFrames(file, plan, signal) {
  const { video, release } = await openVideo(file, signal);
  try {
    // The detached video is paused and only seeks to requested sample times.
    // The encoder draws each frame before advancing this iterator.
    for (let index = 0; index < plan.frameCount; index++) {
      const time = plan.start + index / plan.fps;
      await seekVideo(video, time, signal);
      yield {
        image: video, width: video.videoWidth, height: video.videoHeight,
        delay: getVideoFrameDelay(plan, index),
      };
    }
  } finally {
    release();
  }
}

export async function createVideoGif(file, duration, settings, clip, callbacks = {}) {
  const plan = getVideoPlan(duration, clip);
  const output = await encodeFrames(videoFrames(file, plan, callbacks.signal), plan.frameCount, {
    ...settings, delay: Math.round(plan.delay / 10) * 10,
  }, callbacks);
  return { ...output, fps: plan.fps };
}
