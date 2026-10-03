import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("@regression @notebook-catalog Japanese notebook previews toggle romaji and retain the choice across pages and reload", async ({ page }) => {
  await page.goto("/languages/japanese/notebooks");
  const card = page.getByTestId("notebook-curated-languages-japanese-hiragana-h-m-writing-notebook-v1");
  const toggle = page.getByRole("switch", { name: "Show romaji" });
  await expect(card).toContainText("はひ");
  await expect(card).not.toContainText("H And M");
  await expect(card.getByText("ha · hi", { exact: true })).toBeVisible();
  await expect(page.getByText("konnichiwa", { exact: true })).toBeVisible();
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await expect(card.getByText("ha · hi", { exact: true })).not.toBeVisible();
  await expect(card).toContainText("はひ");
  await card.click();
  await expect(page.getByTestId("writing-notebook-viewport")).toBeVisible();
  await page.getByTestId("notebooks-back").click();
  await expect(page).toHaveURL(/\/languages\/japanese\/notebooks$/);
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await page.getByTestId("notebook-custom-text").fill("あい");
  await page.getByTestId("notebook-create").click();
  await expect(page.getByTestId("writing-notebook-viewport")).toBeVisible();
  await page.getByTestId("notebooks-back").click();
  const saved = page.getByTestId("notebook-saved-custom-3042-3044-v1");
  await expect(saved).toContainText("あい");
  await expect(saved.getByText("a i", { exact: true })).not.toBeVisible();
  await toggle.click();
  await expect(saved.getByText("a i", { exact: true })).toBeVisible();
  await expect(card.getByText("ha · hi", { exact: true })).toBeVisible();
});

test("@regression @notebook-catalog Japanese notebook cards stay usable with and without romaji on phone and iPad layouts", async ({ page }) => {
  await page.goto("/languages/japanese/notebooks");
  const card = page.getByTestId("notebook-curated-languages-japanese-hiragana-h-m-writing-notebook-v1");
  const toggle = page.getByTestId("notebook-romaji-toggle");
  for (const [width, height] of [[320, 844], [834, 1194], [1194, 834], [507, 1000]]) {
    await page.setViewportSize({ width, height });
    await card.scrollIntoViewIfNeeded();
    const before = (await card.boundingBox())!;
    expect(before.x).toBeGreaterThanOrEqual(0);
    expect(before.x + before.width).toBeLessThanOrEqual(width);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await toggle.click();
    const after = (await card.boundingBox())!;
    expect(after.height).toBe(before.height);
    await expect(card).toContainText("はひ");
    await toggle.click();
    await card.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/notebook-catalog-${test.info().project.name}-${width}.png`, fullPage: true });
  }
  const violations = (await new AxeBuilder({ page }).analyze()).violations.filter(v => v.impact === "serious" || v.impact === "critical");
  expect(violations).toEqual([]);
});
