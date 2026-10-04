/* global window -- These globals run inside Playwright browser callbacks. */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";
const url = process.argv[2] ?? "http://127.0.0.1:3174";
const output = "assets/game/previews/continuous-map";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    recordVideo: {
      dir: "test-results/map-art",
      size: { width: 412, height: 915 },
    },
  });
  const page = await context.newPage();
  await page.goto(url);
  await page.getByTestId("game-level-1").waitFor();
  const ready = async () => {
    // Include neighbors visible at either viewport edge, not just the target panel.
    for (const scenery of await page.getByTestId(/^game-scenery-/).all())
      await scenery.evaluate(async (element) => {
        const r = element.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        await Promise.all(
          [...element.children].map(async (child) => {
            const url = window
              .getComputedStyle(child)
              .backgroundImage.match(/url\("?(.*?)"?\)/)?.[1];
            if (url) {
              const image = new window.Image();
              image.src = url;
              await image.decode();
            }
          }),
        );
      });
  };
  for (const [panel, name] of [
    ["city-2", "phone"],
    ["city-1", "canal"],
    ["highlands-2", "join"],
    ["summit-0", "summit"],
  ]) {
    await page.getByTestId(`game-map-panel-${panel}`).scrollIntoViewIfNeeded();
    await page.getByTestId(`game-parallax-${panel}-mist`).waitFor();
    await ready();
    await page.screenshot({ path: `${output}/final-${name}.png` });
  }
  await page.getByTestId("game-map-panel-city-1").scrollIntoViewIfNeeded();
  await page.getByTestId("game-parallax-city-1-mist").waitFor();
  await ready();
  await page.evaluate(async () => {
    const start = window.scrollY;
    for (let frame = 0; frame < 90; frame++) {
      window.scrollTo(0, start + Math.sin((frame / 90) * Math.PI * 2) * 240);
      await new Promise(window.requestAnimationFrame);
    }
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.screenshot({ path: `${output}/final-reduced.png` });
  const video = page.video();
  await context.close();
  await video.saveAs("test-results/map-art/parallax.webm");
  const wide = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await wide.goto(url);
  await wide.getByTestId("game-level-1").waitFor();
  // Load all panels for the contact sheet without changing normal runtime culling.
  for (const panel of await wide.getByTestId(/^game-map-panel-/).all()) {
    await panel.scrollIntoViewIfNeeded();
    const id = await panel.getAttribute("data-testid");
    await wide
      .getByTestId(`game-parallax-${id.replace("game-map-panel-", "")}-mist`)
      .waitFor();
  }
  await wide.getByTestId("game-map-view").click();
  await wide.getByTestId("game-map-view").click();
  // Capture the full terrain from exported tiles, alongside actual viewport captures.
  const manifest = await (await fetch(`${url}/game/map/manifest.json`)).json();
  const panels = await Promise.all(
    manifest.panels.map(async (p, i) => ({
      input: await sharp(`assets/game/generated/map/${p.id}.webp`)
        .extract({
          left: 0,
          top: manifest.guard,
          width: manifest.width,
          height: manifest.tileHeight,
        })
        .png()
        .toBuffer(),
      left: 0,
      top: i * manifest.tileHeight,
    })),
  );
  const strip = await sharp({
    create: {
      width: manifest.width,
      height: manifest.tileHeight * panels.length,
      channels: 3,
      background: "#81958b",
    },
  })
    .composite(panels)
    .png()
    .toBuffer();
  await sharp(strip)
    .resize({ width: 300 })
    .png()
    .toFile(`${output}/terrain-contact-sheet.png`);
  await wide.getByTestId("game-map-panel-city-1").scrollIntoViewIfNeeded();
  await wide.getByTestId("game-parallax-city-1-mist").waitFor();
  await wide.getByTestId("game-scenery-city-1").evaluate(async (el) => {
    const image = new window.Image();
    image.src = window
      .getComputedStyle(el.firstElementChild)
      .backgroundImage.match(/url\("?(.*?)"?\)/)[1];
    await image.decode();
  });
  await wide.screenshot({ path: `${output}/final-wide.png` });
} finally {
  await browser.close();
}
