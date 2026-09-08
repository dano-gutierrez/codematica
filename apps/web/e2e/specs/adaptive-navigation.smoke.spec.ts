import { expect, test } from "@playwright/test";

test("@smoke persistent navigation switches sections and keeps compact menus accessible", async ({ page }) => {
  await page.goto("/");
  const compact = page.viewportSize()!.width < 768;
  const navigation = page.getByRole("navigation", { name: compact ? "Mobile navigation" : "Primary navigation", exact: true });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Home", exact: true })).toHaveAttribute("aria-current", "page");
  await navigation.getByRole("link", { name: "Practice", exact: true }).click();
  await expect(page.getByTestId("practice-catalog")).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Practice", exact: true })).toHaveAttribute("aria-current", "page");
  if (compact) {
    await page.getByTestId("mobile-nav-more").click();
    const sheet = page.getByRole("dialog", { name: "Explore Codematica" });
    await expect(sheet).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).not.toBeVisible();
    await expect(page.getByTestId("mobile-nav-more")).toBeFocused();
    await page.getByTestId("mobile-nav-more").click();
    await sheet.getByRole("link", { name: "Languages", exact: true }).click();
    await expect(sheet).not.toBeVisible();
  } else {
    await navigation.getByRole("link", { name: "Languages", exact: true }).click();
  }
  await expect(page.getByTestId("language-catalog")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
