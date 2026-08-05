import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("@regression primary discovery and catalog routes have no serious accessibility violations", async ({ page }) => {
  for (const route of ["/", "/paths", "/browse", "/practice", "/interviews", "/languages", "/login"]) {
    await test.step(route, async () => {
      await page.goto(route);
      await expect(page.getByRole("main")).toBeVisible();
      const result = await new AxeBuilder({ page }).analyze();
      expect(result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? "")), `${route} accessibility violations`).toEqual([]);
    });
  }
});
