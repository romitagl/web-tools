import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { generatedGif, imageFile, pixel } from './helpers';

const fixture = (extension) => fileURLToPath(new URL(`./fixtures/colors.${extension}`, import.meta.url));

async function chooseVideo(page, extension = 'mp4') {
  await page.getByRole('button', { name: 'Video to GIF', exact: true }).click();
  await page.getByLabel('Choose video for GIF').setInputFiles(fixture(extension));
  await expect(page.getByLabel('Start time')).toBeVisible();
  await expect.poll(() => page.getByLabel('Source video preview').evaluate((video) => video.readyState)).toBeGreaterThanOrEqual(2);
}

test.beforeEach(async ({ page }) => {
  await page.route('https://github.com/sponsors/**', (route) => route.abort());
  await page.goto('/gif-maker/');
});

test('GIF maker has a tile in Most Popular Tools and in All Available Tools', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.featured-tools').getByRole('heading', { name: 'Animated GIF Maker' })).toBeVisible();
  await expect(page.locator('#tools').getByRole('heading', { name: 'Animated GIF Maker' })).toBeVisible();
  await page.getByRole('link', { name: 'Make a GIF', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Animated GIF Maker', exact: true })).toBeVisible();
});

for (const extension of ['mp4', 'webm']) {
  test(`${extension} clips encode sampled frames, range, dimensions, timing, and loop setting without uploads`, async ({ page }) => {
    await chooseVideo(page, extension);
    await page.getByLabel('Start time').fill('0.4');
    await page.getByLabel('End time').fill('1.2');
    await page.getByLabel('Frame rate').selectOption('10');
    await page.getByLabel('Maximum output dimension').selectOption('320');
    await page.getByLabel('Loop continuously').uncheck();
    const requests = [];
    page.on('request', (request) => {
      if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:4173')) requests.push(request.url());
    });
    const gif = await generatedGif(page);
    expect([gif.width, gif.height, gif.numFrames(), gif.loopCount()]).toEqual([320, 160, 8, null]);
    for (let frame = 0; frame < 8; frame++) expect(gif.frameInfo(frame).delay).toBe(10);
    const red = pixel(gif, 0, 160, 80);
    const blue = pixel(gif, 7, 160, 80);
    expect(red[0]).toBeGreaterThan(240);
    expect(red[2]).toBeLessThan(15);
    expect(blue[2]).toBeGreaterThan(240);
    expect(blue[0]).toBeLessThan(15);
    expect(requests).toEqual([]);
    await page.screenshot({ path: test.info().outputPath('video-desktop.png'), fullPage: true });
  });
}

test('video drop works; invalid ranges and corrupt files are recoverable', async ({ page }) => {
  await page.getByRole('button', { name: 'Video to GIF', exact: true }).click();
  await page.getByLabel('Choose video for GIF').setInputFiles({ name: 'bad.mp4', mimeType: 'video/mp4', buffer: Buffer.from('bad video') });
  await expect(page.getByRole('alert')).toContainText('Could not read “bad.mp4”');
  await page.getByLabel('Choose video for GIF').setInputFiles({ name: 'text.txt', mimeType: 'text/plain', buffer: Buffer.from('text') });
  await expect(page.getByRole('alert')).toContainText('Choose one video');
  const { readFile } = await import('node:fs/promises');
  const transfer = await page.evaluateHandle((base64) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))], 'dropped.webm', { type: 'video/webm' }));
    return transfer;
  }, (await readFile(fixture('webm'))).toString('base64'));
  await page.locator('.drop-zone').dispatchEvent('drop', { dataTransfer: transfer });
  await transfer.dispose();
  await expect(page.getByLabel('Start time')).toBeVisible();
  await page.getByLabel('Start time').fill('1.2');
  await page.getByLabel('End time').fill('0.5');
  await page.getByRole('button', { name: 'Create GIF', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('end after the start');
  await page.getByLabel('Start time').fill('0');
  await page.getByLabel('End time').fill('0.25');
  await page.getByLabel('Frame rate').selectOption('10');
  const gif = await generatedGif(page);
  expect(gif.numFrames()).toBe(3);
  expect(gif.frameInfo(2).delay).toBe(5);
  await page.getByLabel('End time').fill('0.5');
  await expect(page.getByRole('heading', { name: 'GIF Preview' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear Video' }).click();
  await expect(page.getByRole('button', { name: 'Create GIF', exact: true })).toBeDisabled();
});

test('WebM without duration metadata is resolved and sampled locally', async ({ page }) => {
  await page.getByRole('button', { name: 'Video to GIF', exact: true }).click();
  await page.getByLabel('Choose video for GIF').setInputFiles(
    fileURLToPath(new URL('./fixtures/colors-no-duration.webm', import.meta.url)),
  );
  await expect(page.getByLabel('Start time')).toBeVisible();
  await page.getByLabel('Start time').fill('0.9');
  await page.getByLabel('End time').fill('1.2');
  const gif = await generatedGif(page);
  expect(gif.numFrames()).toBe(3);
  expect(pixel(gif, 0, 100, 100)[2]).toBeGreaterThan(240);
});

test('video cancellation and source switching clean up workers and URLs; images still work', async ({ page }) => {
  await page.addInitScript(() => {
    window.gifResources = { urls: new Set(), workers: 0 };
    const create = URL.createObjectURL.bind(URL);
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      const url = create(blob);
      window.gifResources.urls.add(url);
      return url;
    };
    URL.revokeObjectURL = (url) => { window.gifResources.urls.delete(url); revoke(url); };
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      constructor(...args) { super(...args); window.gifResources.workers++; }
      postMessage(message, transfer) {
        if (message.type === 'frame') {
          setTimeout(() => { if (!this.stopped) super.postMessage(message, transfer); }, 150);
        } else super.postMessage(message, transfer);
      }
      terminate() {
        if (!this.stopped) { this.stopped = true; window.gifResources.workers--; }
        super.terminate();
      }
    };
  });
  await page.reload();
  await chooseVideo(page);
  await page.getByRole('button', { name: 'Create GIF', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Create GIF', exact: true })).toBeEnabled();
  await page.getByLabel('End time').fill('0.2');
  expect((await generatedGif(page)).numFrames()).toBe(2);
  await page.getByRole('button', { name: 'Create GIF', exact: true }).click();
  await page.getByRole('button', { name: 'Images to GIF', exact: true }).click();
  await expect.poll(() => page.evaluate(() => [window.gifResources.urls.size, window.gifResources.workers])).toEqual([0, 0]);
  await page.getByLabel('Choose images for GIF').setInputFiles([await imageFile(page, 'a.png', '#ff0000')]);
  expect((await generatedGif(page)).numFrames()).toBe(1);
  await page.getByRole('link', { name: 'Back to Tools' }).click();
  await expect.poll(() => page.evaluate(() => [window.gifResources.urls.size, window.gifResources.workers])).toEqual([0, 0]);
});

test('video mode remains usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await chooseVideo(page, 'webm');
  await page.getByLabel('End time').fill('0.4');
  expect((await generatedGif(page)).numFrames()).toBe(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('video-mobile.png'), fullPage: true });
});
