import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import campaign from "../../../../content/game/restore-the-signal.json" with { type: "json" };
test("@regression game map and editors retain contrast, touch targets and responsive width", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((c) => {
    const awards: Record<string, unknown> = {};
    for (const l of c.levels.slice(0, 4))
      awards[`${c.id}/${l.id}/main`] = {
        earnedAt: new Date().toISOString(),
        mode: "standard",
      };
    localStorage.setItem(
      "codematica.game.v1",
      JSON.stringify({
        version: 1,
        timezone: "UTC",
        awards,
        activityDays: [],
        cosmetic: "none",
        updatedAt: new Date().toISOString(),
      }),
    );
  }, campaign);
  for (const [width, route] of [
    [390, "/"],
    [900, "/play/restore-the-signal/courtyard-defense"],
    [390, "/play/restore-the-signal/first-outpost"],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    await expect(page.getByRole("main")).toBeVisible();
    const results = await new AxeBuilder({ page }).include("main").analyze();
    expect(
      results.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? ""),
      ),
      route,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    for (const button of await page
      .getByRole("main")
      .getByRole("button")
      .all()) {
      if ((await button.isVisible()) && (await button.isEnabled())) {
        const box = await button.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    }
  }
});
