import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  ["library", "/browse"],
  ["paths", "/paths"],
  ["path detail", "/paths/system-design-fundamentals"],
  ["languages", "/languages"],
  ["login", "/login"],
  ["reader", "/docs/system-design/cache-invalidation"],
  ["diagram", "/diagrams/system-design/cache-aside"],
  ["cloze", "/practice/programming/runtime-boundary-cloze"],
  ["flashcard", "/practice/system-design/cache-product-contract"],
  ["lab", "/practice/ml-systems/ai-triad-guided-lab"],
] as const;

for (const scale of ["100%", "200%"]) {
  test(`@regression @design skip navigation stays hidden until keyboard focus with ${scale} text`, async ({ page, browserName }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/learn");
    await page.evaluate(value => { document.documentElement.style.fontSize = value; }, scale);
    const skip = page.getByRole("link", { name: "Skip to content" });
    const hidden = (await skip.boundingBox())!;
    expect(hidden.y + hidden.height).toBeLessThanOrEqual(0);
    // Safari's default macOS keyboard navigation includes links with Option-Tab.
    await page.keyboard.press(browserName === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab");
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: testInfo.outputPath(`skip-focus-${scale}.png`) });
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("app-content");
    const returned = (await skip.boundingBox())!;
    expect(returned.y + returned.height).toBeLessThanOrEqual(0);
  });
}

for (const width of [320, 768, 1440]) {
  for (const [name, route] of routes) {
    test(`@regression @design ${name} reflows at ${width}px with enlarged text`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveCount(1);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const violations = (await new AxeBuilder({ page }).include("main").analyze()).violations;
      expect(violations).toEqual([]);
      await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: test.info().outputPath(`${name.replaceAll(" ", "-")}-${width}-large-text.png`), fullPage: true });
    });
  }
}

test("@regression @design reader disclosures and practice feedback remain usable by keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/system-design/cache-invalidation");
  const outline = page.getByTestId("document-outline");
  await outline.getByText("On this page", { exact: true }).press("Enter");
  await expect(outline.getByRole("navigation", { name: "Article outline" })).toBeVisible();
  await outline.getByRole("link").first().click();
  await expect(page).toHaveURL(/#/);
  await page.goto("/practice/programming/runtime-boundary-cloze");
  await page.getByTestId("cloze-answer-input").fill("schema");
  await page.getByRole("button", { name: "Check answer" }).press("Enter");
  await expect(page.getByTestId("cloze-feedback")).toHaveAttribute("role", "status");
  await page.getByTestId("cloze-answer-input").fill("another answer");
  await expect(page.getByTestId("cloze-feedback")).toHaveCount(0);
});

test("@regression @design login uses consistent labels and recovery navigation", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("main").getByRole("link", { name: "Home", exact: true })).toHaveAttribute("href", "/");
  await page.getByTestId("login-mode").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your account");
  await expect(page.getByTestId("login-password")).toHaveAttribute("autocomplete", "new-password");
  await expect(page.getByTestId("login-submit")).toBeDisabled();
  await page.getByTestId("login-mode").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome back");
  await page.goto("/missing-design-audit-route");
  await expect(page.getByRole("main").getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
});
