import { test, expect } from '@playwright/test';
import { imageFile, generatedGif, pixel } from './helpers';

function bmpFile() {
  // A 1×1, 24-bit yellow BMP with a padded pixel row.
  const buffer = Buffer.alloc(58);
  buffer.write('BM');
  buffer.writeUInt32LE(58, 2);
  buffer.writeUInt32LE(54, 10);
  buffer.writeUInt32LE(40, 14);
  buffer.writeInt32LE(1, 18);
  buffer.writeInt32LE(1, 22);
  buffer.writeUInt16LE(1, 26);
  buffer.writeUInt16LE(24, 28);
  buffer.writeUInt32LE(4, 34);
  buffer[55] = buffer[56] = 255;
  return { name: 'd.bmp', mimeType: 'image/bmp', buffer };
}

test.beforeEach(async ({ page }) => {
  // Keep the shared sponsor iframe from adding unrelated network traffic.
  await page.route('https://github.com/sponsors/**', (route) => route.abort());
  await page.goto('/gif-maker/');
});

test('picker batches sort frames; output preserves timing, size, colors, and loop without uploads', async ({ page }) => {
  const blue = await imageFile(page, 'b.png', '#0000ff', 160, 320);
  const red = await imageFile(page, 'a.png', '#ff0000', 640, 320);
  await page.getByLabel('Choose images for GIF').setInputFiles([blue]);
  await page.getByLabel('Choose images for GIF').setInputFiles([red]);
  await expect(page.locator('.gif-image-list .file-name')).toHaveText(['a.png', 'b.png']);
  await page.getByLabel('Frame delay').fill('250');
  await page.getByLabel('Maximum output dimension').selectOption('320');
  await page.getByLabel('Background color').fill('#000000');
  const remoteRequests = [];
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:4173')) {
      remoteRequests.push(request.url());
    }
  });
  const gif = await generatedGif(page);
  expect([gif.width, gif.height, gif.numFrames(), gif.loopCount()]).toEqual([320, 160, 2, 0]);
  expect(gif.frameInfo(0).delay).toBe(25);
  expect(gif.frameInfo(1).delay).toBe(25);
  expect(pixel(gif, 0, 160, 80)).toEqual([255, 0, 0, 255]);
  expect(pixel(gif, 1, 160, 80)).toEqual([0, 0, 255, 255]);
  expect(pixel(gif, 1, 0, 0)).toEqual([0, 0, 0, 255]);
  expect(remoteRequests).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('desktop.png'), fullPage: true });
});

test('one transparent image works, uses its background, and can play once', async ({ page }) => {
  await page.getByLabel('Choose images for GIF').setInputFiles([
    await imageFile(page, 'transparent.png', 'rgba(0,0,0,0)'),
  ]);
  await page.getByLabel('Background color').fill('#ff0000');
  await page.getByLabel('Loop continuously').uncheck();
  const gif = await generatedGif(page);
  expect([gif.width, gif.height, gif.numFrames(), gif.loopCount()]).toEqual([40, 20, 1, null]);
  expect(pixel(gif, 0, 0, 0)).toEqual([255, 0, 0, 255]);
});

test('drop supports mixed batches and rejects unsupported files', async ({ page }) => {
  const png = await imageFile(page, 'b.png', '#ff0000');
  const jpg = await imageFile(page, 'a.jpg', '#0000ff', 40, 20, 'image/jpeg');
  const webp = await imageFile(page, 'c.webp', '#00ff00', 40, 20, 'image/webp');
  const transfer = await page.evaluateHandle((files) => {
    const transfer = new DataTransfer();
    for (const file of files) {
      transfer.items.add(new File([Uint8Array.from(atob(file.base64), (char) => char.charCodeAt(0))], file.name, { type: file.type }));
    }
    transfer.items.add(new File(['text'], 'notes.txt', { type: 'text/plain' }));
    return transfer;
  }, [png, jpg, webp, bmpFile()].map((file) => ({ name: file.name, type: file.mimeType, base64: file.buffer.toString('base64') })));
  await page.locator('.drop-zone').dispatchEvent('drop', { dataTransfer: transfer });
  await transfer.dispose();
  await expect(page.getByRole('alert')).toContainText('1 unsupported file');
  await expect(page.locator('.gif-image-list .file-name')).toHaveText(['a.jpg', 'b.png', 'c.webp', 'd.bmp']);
  const gif = await generatedGif(page);
  expect(gif.numFrames()).toBe(4);
  expect(pixel(gif, 3, 20, 10)).toEqual([255, 255, 0, 255]);
});

test('crop mode fills frames; changing settings and removing images invalidate the preview', async ({ page }) => {
  await page.getByLabel('Choose images for GIF').setInputFiles([
    await imageFile(page, 'a.png', '#ff0000'),
    await imageFile(page, 'b.png', '#0000ff', 20, 40),
  ]);
  await page.getByLabel('Images with different proportions').selectOption('cover');
  expect(pixel(await generatedGif(page), 1, 0, 0)).toEqual([0, 0, 255, 255]);
  await page.getByLabel('Frame delay').fill('300');
  await expect(page.getByRole('heading', { name: 'GIF Preview' })).toHaveCount(0);
  await generatedGif(page);
  await page.getByRole('button', { name: 'Remove b.png' }).click();
  await expect(page.getByRole('heading', { name: 'GIF Preview' })).toHaveCount(0);
  expect((await generatedGif(page)).numFrames()).toBe(1);
  await page.getByRole('button', { name: 'Clear All' }).click();
  await expect(page.getByRole('button', { name: 'Create GIF', exact: true })).toBeDisabled();
});

test('invalid settings and corrupt images show recoverable errors', async ({ page }) => {
  await page.getByLabel('Choose images for GIF').setInputFiles([
    { name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('not an image') },
  ]);
  await page.getByLabel('Frame delay').fill('');
  await page.getByRole('button', { name: 'Create GIF', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Frame delay');
  await page.getByLabel('Frame delay').fill('500');
  await page.getByRole('button', { name: 'Create GIF', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not read “broken.png”');
  await expect(page.getByRole('button', { name: 'Create GIF', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Clear All' }).click();
  await page.getByLabel('Choose images for GIF').setInputFiles([await imageFile(page, 'good.png', '#ff0000')]);
  expect((await generatedGif(page)).numFrames()).toBe(1);
});

test('cancel and navigation terminate jobs and release object URLs', async ({ page }) => {
  await page.addInitScript(() => {
    window.gifResources = { urls: new Set(), workers: 0 };
    const create = URL.createObjectURL.bind(URL);
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      const url = create(blob);
      window.gifResources.urls.add(url);
      return url;
    };
    URL.revokeObjectURL = (url) => {
      window.gifResources.urls.delete(url);
      revoke(url);
    };
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      constructor(...args) { super(...args); window.gifResources.workers++; }
      terminate() {
        if (!this.stopped) { window.gifResources.workers--; this.stopped = true; }
        super.terminate();
      }
    };
    const decode = window.createImageBitmap.bind(window);
    window.createImageBitmap = async (...args) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return decode(...args);
    };
  });
  await page.reload();
  await page.getByLabel('Choose images for GIF').setInputFiles([await imageFile(page, 'a.png', '#ff0000')]);
  await page.getByRole('button', { name: 'Create GIF', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Create GIF', exact: true })).toBeEnabled();
  await generatedGif(page);
  await page.getByRole('link', { name: 'Back to Tools' }).click();
  await expect.poll(() => page.evaluate(() => [window.gifResources.urls.size, window.gifResources.workers])).toEqual([0, 0]);
  await page.getByRole('link', { name: 'Create GIF', exact: true }).click();
  await page.getByLabel('Choose images for GIF').setInputFiles([await imageFile(page, 'b.png', '#ff0000')]);
  await page.getByRole('button', { name: 'Create GIF', exact: true }).click();
  await page.getByRole('link', { name: 'Back to Tools' }).click();
  await expect.poll(() => page.evaluate(() => [window.gifResources.urls.size, window.gifResources.workers])).toEqual([0, 0]);
});

test('mobile layout has no horizontal overflow with long filenames', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByLabel('Choose images for GIF').setInputFiles([
    await imageFile(page, `${'long-filename-'.repeat(12)}.png`, '#ff0000'),
  ]);
  await generatedGif(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('mobile.png'), fullPage: true });
});
