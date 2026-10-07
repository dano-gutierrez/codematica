import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import campaign from "../../../../content/game/restore-the-signal.json" with { type: "json" };

for (const width of [320, 768, 1440]) {
  for (const route of ["/", ...campaign.levels.map(level => `/play/${campaign.id}/${level.id}`)]) {
    for (const scale of ["100%", "200%"]) {
      test(`@regression @design campaign ${route} adapts at ${width}px with ${scale} text`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.addInitScript(({ c, completed }) => {
          const awards: Record<string, unknown> = {};
          for (const level of c.levels.slice(0, completed)) awards[`${c.id}/${level.id}/main`] = { earnedAt: "2026-10-03T00:00:00Z", mode: "standard" };
          localStorage.setItem("codematica.game.v1", JSON.stringify({ version: 1, timezone: "UTC", awards, activityDays: [], cosmetic: "none", updatedAt: "2026-10-03T00:00:00Z" }));
        }, { c: campaign, completed: route === "/" ? 5 : campaign.levels.length });
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        const main = page.getByRole("main");
        await expect(main.getByRole("heading", { level: 1 })).toHaveCount(1);
        const action = route === "/" ? page.getByTestId("game-continue") : page.getByTestId("game-run");
        await expect(action).toBeVisible();
        const initialFont = await action.evaluate(node => parseFloat(getComputedStyle(node).fontSize));
        if (await page.getByTestId("game-code").count()) {
          expect(await page.getByTestId("game-code").evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
        }
        await page.evaluate(value => { document.documentElement.style.fontSize = value; }, scale);
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect((await new AxeBuilder({ page }).include("main").analyze()).violations).toEqual([]);
        expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(48);
        for (const button of await main.getByRole("button").all()) if (await button.isVisible()) {
          expect((await button.boundingBox())!.height, await button.getAttribute("aria-label") || await button.innerText()).toBeGreaterThanOrEqual(48);
        }
        if (route === "/") for (const level of campaign.levels) {
          const node = await page.getByTestId(`game-level-${level.order}`).boundingBox();
          const district = await page.getByRole("region", { name: `${level.district} district` }).boundingBox();
          expect(node!.y + node!.height).toBeLessThanOrEqual(district!.y + district!.height);
        }
        expect(await action.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(initialFont * (scale === "200%" ? 1.9 : 1));
        await page.screenshot({ path: test.info().outputPath(`campaign-${width}-${scale}.png`), fullPage: true });
      });
    }
  }
}

test("@regression @design returning to a challenge stays in flow at large text", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/docs/system-design/cache-invalidation?returnTo=/play/restore-the-signal/courtyard-defense");
  const back = page.getByTestId("game-return");
  await expect(back).toBeVisible();
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  expect(["static", "relative"]).toContain(await back.evaluate(node => getComputedStyle(node).position));
  const bounds = await back.boundingBox();
  const article = await page.getByRole("main").boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(article!.y);
  await back.click();
  await expect(page.getByTestId("game-play")).toBeVisible();
});
