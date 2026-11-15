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

test('desktop sidebar lists every route and marks the active tool', async ({ page }) => {
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Tool navigation' });
  for (const tool of tools) {
    await expect(navigation.getByRole('link', { name: tool.name, exact: !tool.experimental })).toHaveAttribute('href', toolPath(tool));
  }
  await navigation.getByRole('link', { name: 'PDF Compressor', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Compress PDFs Locally', exact: true })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'PDF Compressor', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('mobile directory and expanded menu fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('navigation', { name: 'Tool navigation' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('mobile navigation closes on a route change and supports Escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const navigation = page.getByRole('navigation', { name: 'Tool navigation' });
  await navigation.getByRole('link', { name: 'PDF Compressor', exact: true }).click();
  await expect(navigation).not.toBeVisible();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(navigation.getByRole('link', { name: 'PDF Compressor', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Escape');
  await expect(navigation).not.toBeVisible();
});
