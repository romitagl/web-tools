import { test, expect } from '@playwright/test';
import { tools, toolPath } from '../../src/toolCatalog.js';

test('catalog finds tasks, combines category filters, and recovers from no results', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.catalog-card')).toHaveCount(tools.length);
  await page.getByRole('searchbox', { name: 'Search tools' }).fill('video');
  await expect(page.locator('.catalog-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Documents 2' }).click();
  await expect(page.getByRole('heading', { name: 'No tools found' })).toBeVisible();
  await page.getByRole('button', { name: 'Show all tools' }).click();
  await expect(page.locator('.catalog-card')).toHaveCount(tools.length);
  await page.getByRole('button', { name: 'QR codes 1' }).click();
  await expect(page.locator('.catalog-card')).toHaveCount(1);
  await expect(page.locator('.catalog-card')).toContainText('Generator & Scanner');
});

test('shared menu lists every route, closes on selection, and marks the active tool', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Browse tools' }).click();
  const navigation = page.getByRole('navigation', { name: 'Tool navigation' });
  for (const tool of tools) {
    await expect(navigation.getByRole('link', { name: tool.name, exact: !tool.experimental })).toHaveAttribute('href', toolPath(tool));
  }
  await navigation.getByRole('link', { name: 'PDF Compressor', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Compress PDFs Locally', exact: true })).toBeVisible();
  await expect(navigation).toHaveCount(0);
  await page.getByRole('button', { name: 'Browse tools' }).click();
  await expect(navigation.getByRole('link', { name: 'PDF Compressor', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('mobile directory and expanded menu fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Browse tools' }).click();
  await expect(page.getByRole('navigation', { name: 'Tool navigation' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
