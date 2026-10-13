import { getFrameRect } from './settings';

export async function decodeImage(file, signal) {
  signal?.throwIfAborted();
  let image;
  try {
    // Decode local raster files only, with browser support for EXIF orientation.
    image = await createImageBitmap(file);
  } catch {
    signal?.throwIfAborted();
    throw new Error(`Could not read “${file.name}”. Use a valid PNG, JPEG, WebP, or BMP image.`);
  }
  if (signal?.aborted) {
    image.close();
    signal.throwIfAborted();
  }
  return image;
}

export function renderFrame(context, image, width, height, settings, sourceWidth = image.width, sourceHeight = image.height) {
  const rect = getFrameRect(sourceWidth, sourceHeight, width, height, settings.fit);
  context.fillStyle = settings.background;
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  return context.getImageData(0, 0, width, height).data;
}
