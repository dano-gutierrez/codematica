import { expect, test } from "@playwright/test";

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
