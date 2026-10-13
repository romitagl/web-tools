import { decodeImage, renderFrame } from './frames';
import { getOutputSize, validateSettings } from './settings';

/** Decode only the image currently being encoded; close it on error or cancellation. */
async function* imageFrames(files, signal) {
  for (const file of files) {
    const image = await decodeImage(file, signal);
    try {
      yield { image, width: image.width, height: image.height };
    } finally {
      image.close();
    }
  }
}

/** Existing image API; source-specific decoding is separate from encoding. */
export async function createGif(files, settings, callbacks = {}) {
  if (!files.length) throw new Error('Select at least one image.');
  if (typeof createImageBitmap === 'undefined') {
    throw new Error('Your browser does not support local image decoding. Please use an up-to-date browser.');
  }
  return encodeFrames(imageFrames(files, callbacks.signal), files.length, settings, callbacks);
}

/** Shared browser-only pipeline accepting an async iterable of drawable frames. */
export async function encodeFrames(source, frameCount, settings, { signal, onProgress = () => {} } = {}) {
  const options = validateSettings(settings);
  signal?.throwIfAborted();
  if (typeof Worker === 'undefined') {
    throw new Error('Your browser does not support local GIF creation. Please use an up-to-date browser.');
  }

  const worker = new Worker(new URL('./encoder.worker.js', import.meta.url), { type: 'module' });
  const canvas = document.createElement('canvas');
  let pending;
  let failure;

  const fail = (error) => {
    failure = error;
    pending?.reject(error);
    pending = null;
  };
  const abort = () => {
    worker.terminate();
    fail(signal.reason || new DOMException('Cancelled', 'AbortError'));
  };
  worker.onmessage = ({ data }) => {
    if (data.type === 'error') {
      fail(new Error(data.message));
    } else {
      pending?.resolve(data);
      pending = null;
    }
  };
  worker.onerror = (event) => {
    event.preventDefault();
    fail(new Error(event.message || 'The GIF encoder could not start. Please try again.'));
  };
  worker.onmessageerror = () => fail(new Error('The GIF encoder returned unreadable data.'));
  signal?.addEventListener('abort', abort, { once: true });

  const request = (message, transfer = []) => {
    signal?.throwIfAborted();
    if (failure) return Promise.reject(failure);
    return new Promise((resolve, reject) => {
      pending = { resolve, reject };
      worker.postMessage(message, transfer);
    });
  };

  try {
    let dimensions;
    let context;
    let encoded = 0;
    for await (const frame of source) {
      signal?.throwIfAborted();
      if (!dimensions) {
        dimensions = getOutputSize(frame.width, frame.height, options.maxSize);
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Your browser could not create an image canvas.');
        await request({ type: 'init', options: { ...options, ...dimensions } });
      }
      const rgba = renderFrame(context, frame.image, dimensions.width, dimensions.height, options, frame.width, frame.height);
      await request({ type: 'frame', buffer: rgba.buffer, delay: frame.delay }, [rgba.buffer]);
      encoded++;
      onProgress({ current: encoded, total: frameCount });
    }
    if (!encoded) throw new Error('No frames could be decoded.');
    const { bytes } = await request({ type: 'finish' });
    return { blob: new Blob([bytes], { type: 'image/gif' }), ...dimensions, frames: encoded };
  } finally {
    signal?.removeEventListener('abort', abort);
    worker.terminate();
    canvas.width = canvas.height = 0;
  }
}
