export const DEFAULT_SETTINGS = {
  delay: 500,
  maxSize: 800,
  fit: 'contain',
  background: '#ffffff',
  loop: true,
};

export function validateSettings(settings) {
  const delay = Number(settings.delay);
  const maxSize = Number(settings.maxSize);
  if (!Number.isInteger(delay) || delay < 20 || delay > 10000 || delay % 10 !== 0) {
    throw new Error('Frame delay must be 20–10,000 milliseconds, in steps of 10.');
  }
  if (!Number.isInteger(maxSize) || maxSize < 1 || maxSize > 2048) {
    throw new Error('The maximum output dimension must be between 1 and 2,048 pixels.');
  }
  if (!['contain', 'cover'].includes(settings.fit) || !/^#[\da-f]{6}$/i.test(settings.background)) {
    throw new Error('Choose a valid image fit and background color.');
  }
  return { ...settings, delay, maxSize, loop: Boolean(settings.loop) };
}

// The first sorted image defines the aspect ratio; never enlarge the output.
export function getOutputSize(width, height, maxSize) {
  const scale = Math.min(1, maxSize / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function getFrameRect(sourceWidth, sourceHeight, width, height, fit) {
  const ratios = [width / sourceWidth, height / sourceHeight];
  const scale = fit === 'cover' ? Math.max(...ratios) : Math.min(...ratios);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  return { x: (width - drawWidth) / 2, y: (height - drawHeight) / 2, width: drawWidth, height: drawHeight };
}
