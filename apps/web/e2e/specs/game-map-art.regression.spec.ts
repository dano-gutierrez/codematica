import { expect, test } from "@playwright/test";

for (const kind of ["heading", "caption"] as const) {
  test(`@regression @map-art future scenery ${kind} follows enlarged browser text`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 860 });
    await page.goto("/");
    const panel = page.getByTestId("game-map-panel-summit-0");
    const locator = kind === "heading"
      ? panel.getByRole("heading", { name: "The quiet summit" })
      : panel.getByText("Trail space for levels 37–50", { exact: true });
    await locator.scrollIntoViewIfNeeded();
    const size = await locator.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize));
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    await locator.scrollIntoViewIfNeeded();
    await expect.poll(() => locator.evaluate(element =>
      Number.parseFloat(getComputedStyle(element).fontSize))).toBeCloseTo(size * 2);
    await expect(locator).toBeVisible();
    await expect(panel.getByRole("button", { name: "Return to current level" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await page.screenshot({ path: testInfo.outputPath(`future-${kind}-200.png`) });
  });
}

for (const scale of ["100%", "200%"]) {
  test(`@regression @map-art playable panel labels stay apart at 320px with ${scale} text`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/");
    await expect(page.getByTestId("game-level-1")).toBeInViewport();
    await page.evaluate(value => { document.documentElement.style.fontSize = value; }, scale);
    const panel = page.getByRole("region", { name: "garden district" });
    const bounds = (await panel.boundingBox())!;
    const heading = await panel.getByRole("heading", { name: "The garden outpost" }).evaluate(node => {
      const { y, height } = node.parentElement!.getBoundingClientRect();
      return { y, height };
    });
    let previousBottom = heading.y + heading.height;
    for (const order of [4, 3, 2, 1]) {
      const row = await panel.getByTestId(`game-level-${order}`).evaluate(node => {
        const { x, y, width, height } = node.parentElement!.getBoundingClientRect();
        return { x, y, width, height };
      });
      expect(row.y).toBeGreaterThanOrEqual(previousBottom + 8);
      expect(row.x).toBeGreaterThanOrEqual(bounds.x);
      expect(row.x + row.width).toBeLessThanOrEqual(bounds.x + bounds.width);
      expect(row.y + row.height).toBeLessThanOrEqual(bounds.y + bounds.height);
      previousBottom = row.y + row.height;
    }
    await panel.screenshot({ path: testInfo.outputPath(`garden-${scale}.png`) });
  });
}

test("@regression @map-art continuous map reserves fifty positions, preserves seams after centering, and keeps list controls accessible", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("game-level-1")).toBeInViewport();
  const map = page.getByTestId("game-map-landscape");
  await expect(map).toHaveAttribute("data-capacity", "50");
  await expect(page.getByTestId("game-level-13")).toHaveCount(0);
  for (const panel of [
    "city-2",
    "city-1",
    "city-0",
    "highlands-2",
    "woodland-0",
    "summit-0",
  ]) {
    const section = page.getByTestId(`game-map-panel-${panel}`);
    await section.scrollIntoViewIfNeeded();
    const scenery = page.getByTestId(`game-scenery-${panel}`);
    await expect(
      page.getByTestId(`game-parallax-${panel}-foliage`),
    ).toHaveCount(1);
    // overflow:hidden permits scrollIntoView to scroll *inside* a district and expose blank strips.
    await expect.poll(() => section.evaluate((el) => el.scrollTop)).toBe(0);
    await expect
      .poll(async () => {
        const parent = await section.boundingBox(),
          child = await scenery.boundingBox();
        return Math.abs(parent!.y - child!.y);
      })
      .toBeLessThan(1);
    for (const layer of ["mist", "motes", "foliage"])
      await expect(
        page.getByTestId(`game-parallax-${panel}-${layer}`),
      ).toHaveCSS("pointer-events", "none");
  }
  await page
    .getByRole("button", { name: /Return to current level/ })
    .first()
    .click();
  await expect(page.getByTestId("game-level-1")).toBeInViewport();
  await page.getByTestId("game-map-view").click();
  await expect(page.getByTestId("game-map-panel-summit-0")).toHaveCount(0);
  const first = page.getByTestId("game-level-1"),
    last = page.getByTestId("game-level-12");
  expect((await first.boundingBox())!.y).toBeLessThan(
    (await last.boundingBox())!.y,
  );
  await first.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/courtyard-defense/);
});

test("@regression @map-art map layers use different local speeds and freeze when reduced motion changes", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("game-level-1")).toBeInViewport();
  const panel = page.getByTestId("game-map-panel-city-1");
  await panel.scrollIntoViewIfNeeded();
  const host = page.getByTestId("game-scenery-city-1");
  await expect(page.getByTestId("game-parallax-city-1-mist")).toHaveCount(1);
  await expect
    .poll(() =>
      host.evaluate(
        (el) =>
          new Set(
            ["mist", "motes", "foliage"].map((layer) =>
              el.style.getPropertyValue(`--${layer}-offset`),
            ),
          ).size,
      ),
    )
    .toBe(3);
  const before = await host.getAttribute("style");
  await page.evaluate(() => window.scrollBy(0, 80));
  await expect.poll(() => host.getAttribute("style")).not.toBe(before);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const layer of ["mist", "motes", "foliage"])
    await expect(page.getByTestId(`game-parallax-city-1-${layer}`)).toHaveCSS(
      "transform",
      "none",
    );
  await expect
    .poll(() =>
      host.evaluate((el) => el.style.getPropertyValue("--foliage-offset")),
    )
    .toBe("0px");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    )
    .toBe(0);
});
