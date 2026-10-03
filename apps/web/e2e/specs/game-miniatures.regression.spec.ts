import { test, expect } from "@playwright/test";
import campaign from "../../../../content/game/restore-the-signal.json" with { type: "json" };

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((c) => {
    const awards = Object.fromEntries(
      c.levels.map((l) => [
        `${c.id}/${l.id}/main`,
        { earnedAt: "2026-09-29T12:00:00Z", mode: "standard" },
      ]),
    );
    localStorage.setItem(
      "codematica.game.v1",
      JSON.stringify({
        version: 1,
        timezone: "UTC",
        awards,
        activityDays: [],
        cosmetic: "antenna",
        updatedAt: "2026-09-29T12:00:00Z",
      }),
    );
  }, campaign);
});
for (const level of campaign.levels) {
  test(`@regression miniature crew renders in level ${level.order} at phone width`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(`/play/${campaign.id}/${level.id}`);
    const scene = page.getByTestId("game-scene");
    await expect(scene).toHaveAttribute("data-ready", "true");
    const width = await scene.evaluate((el) => el.clientWidth);
    await expect(scene).toHaveAttribute("data-render-width", String(width));
    await expect(scene).toHaveAccessibleName(
      /Patch and three miniature zombies/,
    );
    const ready = await scene.evaluate((el) => {
      const canvas = el.firstElementChild as HTMLCanvasElement;
      return { width: canvas.width, height: canvas.height };
    });
    expect(ready.width).toBeGreaterThanOrEqual(width);
    expect(ready.height).toBeGreaterThan(0);
    await info.attach(`level-${level.order}-miniatures`, {
      body: await scene.screenshot(),
      contentType: "image/png",
    });
  });
}
test("@regression reduced-motion miniatures redraw on resize and keep their pose", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto(`/play/${campaign.id}/${campaign.levels[0].id}`);
  const scene = page.getByTestId("game-scene");
  await expect(scene).toHaveAttribute("data-ready", "true");
  const before = await scene.screenshot();
  await page.clock.runFor(1300);
  expect((await scene.screenshot()).equals(before)).toBe(true);
  await page.setViewportSize({ width: 900, height: 900 });
  const width = await scene.evaluate((el) => el.clientWidth);
  await expect(scene).toHaveAttribute("data-render-width", String(width));
  const resized = await scene.screenshot();
  expect(resized.equals(before)).toBe(false);
  await page.clock.runFor(1300);
  expect((await scene.screenshot()).equals(resized)).toBe(true);
});
