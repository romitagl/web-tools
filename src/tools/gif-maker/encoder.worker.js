import { GIFEncoder, quantize, applyPalette } from 'gifenc';

let encoder;
let options;

self.onmessage = ({ data }) => {
  try {
    switch (data.type) {
      case 'init':
        encoder = GIFEncoder();
        options = data.options;
        self.postMessage({ type: 'ready' });
        break;
      case 'frame': {
        const rgba = new Uint8Array(data.buffer);
        const palette = quantize(rgba, 256);
        const indexed = applyPalette(rgba, palette);
        encoder.writeFrame(indexed, options.width, options.height, {
          palette,
          delay: data.delay ?? options.delay,
          repeat: options.loop ? 0 : -1,
          dispose: 1,
        });
        self.postMessage({ type: 'frame' });
        break;
      }
      case 'finish': {
        encoder.finish();
        const bytes = encoder.bytes();
        self.postMessage({ type: 'done', bytes }, [bytes.buffer]);
        encoder = null;
        break;
      }
      default:
        throw new Error('Unknown GIF encoder operation.');
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message || 'GIF encoding failed.' });
  }
};
