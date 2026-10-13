import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_SETTINGS, getFrameRect, getOutputSize, validateSettings } from '../../src/tools/gif-maker/settings.js';
import { isSupportedImage, sortImages } from '../../src/tools/gif-maker/files.js';
import { DEFAULT_VIDEO_CLIP, getVideoFrameDelay, getVideoPlan } from '../../src/tools/gif-maker/videoSettings.js';

test('filename sorting includes later batches without changing the original list', () => {
  const images = ['c.png', 'a.png', 'b.png'].map((name) => ({ file: { name } }));
  assert.deepEqual(sortImages(images).map(({ file }) => file.name), ['a.png', 'b.png', 'c.png']);
  assert.equal(images[0].file.name, 'c.png');
});

test('only local supported raster types are accepted, including files with no MIME type', () => {
  assert.ok(isSupportedImage({ type: '', name: 'photo.JPEG' }));
  assert.ok(isSupportedImage({ type: 'image/webp', name: 'photo.webp' }));
  assert.ok(!isSupportedImage({ type: 'image/svg+xml', name: 'remote.svg' }));
  assert.ok(!isSupportedImage({ type: '', name: 'notes.txt' }));
});

test('output dimensions preserve aspect ratio, avoid upscaling, and never become zero', () => {
  assert.deepEqual(getOutputSize(1600, 800, 320), { width: 320, height: 160 });
  assert.deepEqual(getOutputSize(20, 40, 800), { width: 20, height: 40 });
  assert.deepEqual(getOutputSize(1, 10000, 320), { width: 1, height: 320 });
});

test('contain letterboxes and cover centers the crop for opposite aspect ratios', () => {
  assert.deepEqual(getFrameRect(100, 200, 200, 100, 'contain'), { x: 75, y: 0, width: 50, height: 100 });
  assert.deepEqual(getFrameRect(100, 200, 200, 100, 'cover'), { x: 0, y: -150, width: 200, height: 400 });
});

test('settings normalize form values and reject invalid timing and dimensions', () => {
  assert.equal(validateSettings({ ...DEFAULT_SETTINGS, delay: '250' }).delay, 250);
  for (const delay of ['', 'abc', 0, 19, 25, 10001, Infinity]) {
    assert.throws(() => validateSettings({ ...DEFAULT_SETTINGS, delay }), /Frame delay/);
  }
  for (const maxSize of [0, 2049, NaN]) {
    assert.throws(() => validateSettings({ ...DEFAULT_SETTINGS, maxSize }), /output dimension/);
  }
});

test('video clips exclude the end boundary and avoid extra frames from floating point rounding', () => {
  assert.deepEqual(getVideoPlan(2, { start: 0.4, end: 1.2, fps: 10 }), {
    start: 0.4, end: 1.2, fps: 10, frameCount: 8, delay: 100,
  });
  assert.equal(getVideoPlan(2, { start: 1, end: 1.01, fps: 25 }).frameCount, 1);
});

test('video clips reject invalid ranges, unknown durations, and excessive frame counts', () => {
  for (const clip of [
    { start: '', end: 1, fps: 10 }, { start: 0, end: '', fps: 10 },
    { start: -1, end: 1, fps: 10 }, { start: 1, end: 1, fps: 10 },
    { start: 0, end: 3, fps: 10 },
  ]) assert.throws(() => getVideoPlan(2, clip));
  assert.throws(() => getVideoPlan(Infinity, { start: 0, end: 1, fps: 10 }), /duration/);
  assert.throws(() => getVideoPlan(100, { start: 0, end: 100, fps: 10 }), /shorter clip/);
});

test('video frame rates default to 10 and support every whole number from 1 to 50', () => {
  assert.equal(DEFAULT_VIDEO_CLIP.fps, 10);
  for (let fps = 1; fps <= 50; fps++) {
    const plan = getVideoPlan(2, { start: 0, end: 1, fps: String(fps) });
    assert.equal(plan.fps, fps);
    assert.equal(plan.frameCount, fps);
    const delays = Array.from({ length: fps }, (_, index) => getVideoFrameDelay(plan, index));
    assert.ok(delays.every((delay) => delay >= 20 && delay % 10 === 0));
    assert.equal(delays.reduce((sum, delay) => sum + delay, 0), 1000);
  }
  for (const fps of ['', 0, -1, 1.5, 51, Infinity, NaN, 'abc']) {
    assert.throws(() => getVideoPlan(2, { start: 0, end: 1, fps }), /Frame rate/);
  }
});

test('video delays preserve partial clips and the minimum GIF delay', () => {
  const plan = getVideoPlan(2, { start: 0.4, end: 1.6, fps: 3 });
  assert.deepEqual(Array.from({ length: plan.frameCount }, (_, index) => getVideoFrameDelay(plan, index)), [330, 340, 330, 200]);
  const short = getVideoPlan(2, { start: 1, end: 1.01, fps: 1 });
  assert.equal(getVideoFrameDelay(short, 0), 20);
});
