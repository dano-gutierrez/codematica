import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("@regression Japanese hub meets core keyboard, contrast, resize, and reduced-motion checks", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/languages/japanese");

  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).include("main").analyze();
  expect(accessibility.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.evaluate(() => document.documentElement.style.fontSize = "200%");
  await expect(page.getByTestId("japanese-study-tools")).toBeVisible();
  const overflow = await page.evaluate(() => ({
    amount: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    offenders: [...document.querySelectorAll("body *")].flatMap((element) => {
      const rectangle = element.getBoundingClientRect();
      return rectangle.right > document.documentElement.clientWidth + 1 ? [`${element.tagName}.${element.className}`] : [];
    }).slice(0, 10),
  }));
  expect(overflow.offenders, `visual overflow was ${overflow.amount}px`).toEqual([]);

  const transitionDuration = await page.getByTestId("japanese-path-link").evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(Number.parseFloat(transitionDuration)).toBeLessThanOrEqual(0.00001);
});
