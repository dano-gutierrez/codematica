import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const route of ["/", "/learn", "/paths", "/browse", "/practice", "/interviews", "/languages", "/login"]) {
  test(`@regression ${route} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("main")).toBeVisible();
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? "")), `${route} accessibility violations`).toEqual([]);
  });
}
