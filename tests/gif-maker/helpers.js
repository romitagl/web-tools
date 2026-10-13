import { expect } from '@playwright/test';
import { GifReader } from 'omggif';

export async function imageFile(page, name, color, width = 40, height = 20, mimeType = 'image/png') {
  const base64 = await page.evaluate(({ color, width, height, mimeType }) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
    return canvas.toDataURL(mimeType).split(',')[1];
  }, { color, width, height, mimeType });
  return { name, mimeType, buffer: Buffer.from(base64, 'base64') };
}

export async function generatedGif(page) {
  await page.getByRole('button', { name: 'Create GIF', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'GIF Preview' })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download GIF' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('animation.gif');
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return new GifReader(Buffer.concat(chunks));
}

export function pixel(reader, frame, x, y) {
  const pixels = new Uint8Array(reader.width * reader.height * 4);
  reader.decodeAndBlitFrameRGBA(frame, pixels);
  const start = (y * reader.width + x) * 4;
  return Array.from(pixels.slice(start, start + 4));
}
