import { expect, test } from "@playwright/test";

test("@smoke approved brand assets load and the logo returns home", async ({ page, request }) => {
  await page.goto("/learn");
  const home = page.getByRole("link", { name: "Codematica home" }).filter({ visible: true });
  await expect(home).toBeVisible();
  await expect(home.getByTestId("brand-mark")).toBeVisible();
  await expect(home.getByTestId("brand-wordmark")).toBeVisible();
  for (const id of ["brand-mark", "brand-wordmark"]) {
    expect(await home.getByTestId(id).evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  }
  const icons = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="apple-touch-icon"]')).map(link => link.href));
  expect(icons.some(url => url.includes("favicon.ico"))).toBe(true);
  expect(icons.some(url => url.includes("icon-32.png"))).toBe(true);
  expect(icons.some(url => url.includes("apple-icon"))).toBe(true);
  for (const url of icons) {
    const response = await request.get(url);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toMatch(/^image\//);
    expect((await response.body()).length).toBeGreaterThan(100);
  }
  await home.click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
