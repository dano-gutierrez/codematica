import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  ["discovery", "/learn"],
  ["passive review", "/paths/advanced-nextjs-16/flashcards"],
  ["interview catalog", "/interviews"],
  ["company", "/interviews/amazon"],
  ["real world collection", "/interviews/real-world"],
  ["algorithm", "/interviews/amazon/two-sum-product-pair"],
  ["web exercise", "/interviews/real-world/mondrian-composition-generator"],
] as const;

for (const width of [390, 834, 1024]) {
  for (const [name, route] of routes) {
    test(`@regression @design ${name} supports ${width}px and large text`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      const main = page.getByRole("main");
      await expect(main.getByRole("heading", { level: 1 })).toHaveCount(1);
      await page.evaluate(() => document.fonts.ready);
      for (const scale of ["100%", "200%"]) {
        await page.evaluate(value => { document.documentElement.style.fontSize = value; }, scale);
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect((await new AxeBuilder({ page }).include("main").analyze()).violations).toEqual([]);
      }
      await page.screenshot({ path: test.info().outputPath(`${name.replaceAll(" ", "-")}-${width}.png`), fullPage: true });
    });
  }
}

test("@regression @design discovery clears search and restores the input focus", async ({ page }) => {
  await page.goto("/learn");
  await page.getByTestId("home-global-search").fill("Number Of Islands");
  await expect(page.getByTestId("home-discovery-results")).toContainText("Number Of Islands");
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.getByTestId("home-global-search")).toBeFocused();
  await expect(page.getByRole("link", { name: "View all languages" })).toBeVisible();
  await page.getByRole("link", { name: "View all languages" }).click();
  await expect(page.getByTestId("language-catalog")).toBeVisible();
});

test("@regression @design algorithm controls select language and restart the walkthrough", async ({ page }) => {
  await page.goto("/interviews/amazon/two-sum-product-pair");
  const session = page.getByTestId("interview-question-session");
  await page.getByTestId("interview-solution-language").click();
  await page.getByRole("option", { name: "Java", exact: true }).click();
  await session.getByRole("button", { name: "Next", exact: true }).click();
  await session.getByRole("button", { name: "Next", exact: true }).click();
  await session.getByRole("button", { name: "Show full explanation" }).click();
  await expect(page.getByTestId("interview-code")).toContainText("int[]");
  const scroller = page.getByRole("group", { name: "Java code" });
  await scroller.focus();
  await expect(scroller).toBeFocused();
  await session.getByRole("button", { name: "Restart" }).click();
  await expect(page.getByTestId("interview-step-position")).toContainText("Step 1");
});

test("@regression @design web exercise discloses its rubric with keyboard access and keeps recipe controls reachable", async ({ page }) => {
  await page.goto("/interviews/real-world/mondrian-composition-generator");
  const guide = page.getByText("What to demonstrate", { exact: true });
  const intent = page.getByText(/Agree on priorities, turn the ambiguous visual request/);
  await expect(intent).toBeHidden();
  await guide.focus();
  await guide.press("Enter");
  await expect(intent).toBeVisible();
  await guide.press("Enter");
  await expect(intent).toBeHidden();
  await expect(guide).toBeFocused();
  const flags = page.getByText("Red flags and why they matter", { exact: true });
  await flags.click();
  await expect(page.getByText("Hardcodes one painting", { exact: true })).toBeVisible();
  await flags.click();
  await expect(page.getByText("Hardcodes one painting", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.getByTestId("web-recipe-position")).toContainText("Step 2");
  await page.getByRole("button", { name: "Previous step", exact: true }).click();
  await expect(page.getByTestId("web-recipe-position")).toContainText("Step 1");
});

test("@regression @design local progress notice never covers the learning content", async ({ page }) => {
  await page.goto("/docs/system-design/cache-invalidation");
  const prompt = page.getByTestId("save-progress-prompt");
  await expect(prompt).toBeVisible();
  await expect(prompt).toContainText("Progress saved on this device");
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  const main = await page.getByRole("main").elementHandle();
  // Read both bounds in one layout snapshot while diagrams and enlarged text reflow.
  await expect.poll(() => prompt.evaluate((banner, content) => {
    return banner.getBoundingClientRect().top - content!.getBoundingClientRect().bottom;
  }, main)).toBeGreaterThanOrEqual(0);
  await prompt.getByRole("button", { name: "Dismiss save progress prompt" }).click();
  await expect(prompt).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
