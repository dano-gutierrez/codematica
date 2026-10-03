import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1240, height: 800 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(resolve('assets/brand/preview.html')).href);
  await page.waitForFunction(() => Array.from(document.images).every(image => image.complete && image.naturalWidth > 0));
  await page.screenshot({ path: 'assets/brand/preview.png', fullPage: true });
} finally {
  await browser.close();
}
