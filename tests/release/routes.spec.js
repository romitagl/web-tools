import { test, expect } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { buildPublicUrl, getSeoData } from '../../src/seoData.js';

const routes = [
  ['/', 'Essential Web Tools'],
  ['/gif-maker/', 'Animated GIF Maker'],
  ['/pdf-merger/', 'Merge PDFs & Images Instantly'],
  ['/pdf-compressor/', 'Compress PDFs Locally'],
  ['/qr-code-tool/', 'QR Code Generator & Scanner'],
  ['/cidr-calculator/', 'CIDR Subnet Calculator'],
  ['/code-formatter/', 'Code Formatter & Beautifier'],
  ['/base64-encoder-decoder/', 'Base64 Encoder/Decoder'],
  ['/video-speed-controller/', 'Video Speed Controller'],
  ['/website-scraper/', 'Website Scraper & Archiver'],
];

test.beforeEach(async ({ page }) => {
  await page.route('https://github.com/sponsors/**', (route) => route.abort());
});

for (const [route, heading] of routes) {
  test(`release route ${route} serves its static shell and loads without script or asset errors`, async ({ page, request }) => {
    const response = await request.get(route);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain(`<link rel="canonical" href="${buildPublicUrl(route)}" />`);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.url().startsWith('http://127.0.0.1:4173') && response.status() >= 400) {
        errors.push(`${response.status()} ${response.url()}`);
      }
    });
    await page.goto(route);
    await expect(page.getByRole('heading', { name: heading, exact: true, level: 1 })).toBeVisible();
    await expect(page).toHaveTitle(getSeoData(route).title);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
}

async function samplePdf(name, width, pages = 1) {
  const pdf = await PDFDocument.create();
  for (let index = 0; index < pages; index++) {
    pdf.addPage([width, 200]).drawText(`Release test page ${index + 1}`, { x: 20, y: 100, size: 14 });
  }
  return { name, mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) };
}

async function downloadBytes(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

test('PDF merger still combines PDFs in filename order', async ({ page }) => {
  await page.goto('/pdf-merger/');
  await page.locator('input[type=file]').setInputFiles([
    await samplePdf('b.pdf', 300), await samplePdf('a.pdf', 200, 2),
  ]);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Merge PDFs', exact: true }).last().click();
  const pdf = await PDFDocument.load(await downloadBytes(await downloadPromise));
  expect(pdf.getPages().map((page) => page.getWidth())).toEqual([200, 200, 300]);
});

test('PDF compressor loads its bundled worker and produces a readable PDF', async ({ page }) => {
  await page.goto('/pdf-compressor/');
  await page.locator('input[type=file]').setInputFiles(await samplePdf('source.pdf', 300, 2));
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Compress PDF', exact: true }).click();
  const pdf = await PDFDocument.load(await downloadBytes(await downloadPromise));
  expect(pdf.getPageCount()).toBe(2);
});

test('QR code, Base64, CIDR, and code formatting remain functional', async ({ page }) => {
  await page.goto('/qr-code-tool/');
  await page.getByLabel('URL:', { exact: true }).fill('https://example.com');
  await page.getByRole('button', { name: 'Generate QR Code', exact: true }).last().click();
  await expect(page.getByRole('img', { name: 'Generated QR Code' })).toBeVisible();

  await page.goto('/base64-encoder-decoder/');
  await page.getByPlaceholder('Enter text to encode to Base64...').fill('Release test');
  await expect(page.locator('.text-output')).toHaveValue('UmVsZWFzZSB0ZXN0');
  await page.getByRole('button', { name: 'Decode from Base64', exact: true }).click();
  await page.getByPlaceholder('Enter Base64 to decode...').fill('UmVsZWFzZSB0ZXN0');
  await expect(page.locator('.text-output')).toHaveValue('Release test');

  await page.goto('/cidr-calculator/');
  await page.getByLabel('IP Address', { exact: true }).fill('192.168.1.10');
  await page.getByLabel('CIDR Prefix', { exact: true }).fill('24');
  await page.getByRole('button', { name: 'Calculate', exact: true }).click();
  await expect(page.locator('.result-grid')).toContainText('192.168.1.0');
  await expect(page.locator('.result-grid')).toContainText('192.168.1.255');

  await page.goto('/code-formatter/');
  await page.getByLabel('Language:', { exact: true }).selectOption('json');
  await page.locator('.code-input').fill('{"release":true}');
  await page.getByRole('button', { name: 'Format Code', exact: true }).click();
  await expect(page.locator('.code-output-container')).toContainText('"release": true');
});
