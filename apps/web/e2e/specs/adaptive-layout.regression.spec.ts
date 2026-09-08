import { expect, test } from "@playwright/test";

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`@regression catalogs fit a ${width}px viewport without page overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/paths", "/browse", "/practice", "/interviews", "/languages", "/languages/japanese", "/login"]) {
      await test.step(route, async () => {
        await page.goto(route);
        await expect(page.getByRole("main")).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${route} at ${width}px`).toBe(true);
      });
    }
  });
}
