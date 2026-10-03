import { chromium, expect } from "@playwright/test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const base = process.argv[2] ?? "http://127.0.0.1:3128";
const out = "assets/game/previews";
await mkdir(out, { recursive: true });
const campaign = JSON.parse(
  await readFile("content/game/restore-the-signal.json", "utf8"),
);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 900, height: 1050 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  await page.goto(base);
  await page
    .getByRole("region", { name: "garden district" })
    .screenshot({ path: `${out}/map.png` });
  await page.goto(`${base}/play/${campaign.id}/${campaign.levels[0].id}`);
  await expect(page.getByTestId("game-scene")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page
    .getByTestId("game-code")
    .fill(campaign.levels[0].scenarios[0].solution);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page
    .getByTestId("game-scene")
    .screenshot({ path: `${out}/coding-actors.png` });
  await page
    .getByTestId("game-sandbox")
    .screenshot({ path: `${out}/coding-grid.png` });
  await page
    .getByTestId("game-code")
    .screenshot({ path: `${out}/coding-editor.png` });
  await page.evaluate((c) => {
    const awards = {};
    for (const l of c.levels.slice(0, 7))
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
        cosmetic: "antenna",
        updatedAt: new Date().toISOString(),
      }),
    );
  }, campaign);
  const level = campaign.levels[7],
    s = level.scenarios[0];
  await page.goto(`${base}/play/${campaign.id}/${level.id}`);
  await expect(page.getByTestId("game-scene")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page
    .getByTestId("game-scene")
    .screenshot({ path: `${out}/defense-actors.png` });
  for (const id of s.solution.nodes)
    await page.getByTestId(`game-piece-${id}`).click();
  for (const e of s.solution.edges) {
    await page.getByTestId(`game-connect-${e.from}`).click();
    await page.getByTestId(`game-connect-${e.to}`).click();
  }
  await page
    .getByTestId("game-board")
    .screenshot({ path: `${out}/architecture.png` });
  const html = `<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:56px;background:#f3eedf;color:#224a43;font:20px system-ui}header{display:flex;justify-content:space-between;align-items:end;margin-bottom:34px}h1{font-size:64px;letter-spacing:-3px;margin:8px 0}p{color:#476258;line-height:1.6;margin:10px 0}.eyebrow{font-size:14px;letter-spacing:3px;font-weight:700}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}.frame{border-radius:20px;overflow:hidden;background:#fffaf0;border:1px solid #c9d7c7;height:790px}.screen{width:100%;height:100%;object-fit:cover;object-position:top}h2{font-size:25px;margin:22px 0 7px}.small{font-size:17px}.defense{padding:28px}.defense img{width:100%;border-radius:16px;margin:12px 0}.defense img.actors{height:150px;object-fit:contain}.defense img[src="defense-actors.png"]{height:130px;object-fit:contain}.defense img[src="architecture.png"]{height:300px;object-fit:contain}.screen{object-fit:contain}.metric{display:flex;gap:8px;flex-wrap:wrap}.metric span{background:#e2e9d7;padding:9px 13px;border-radius:8px;font-size:15px}footer{margin-top:28px;display:flex;justify-content:space-between;font-size:15px;letter-spacing:1px}</style><header><div><div class="eyebrow">CODEMATICA / CHAPTER ONE</div><h1>Restore the Signal</h1><p>Small fixes. A brighter city.</p></div><p class="small">Original art + working gameplay<br>12 levels · 36 scenarios · four learning mechanics</p></header><div class="grid"><section><div class="frame"><img class="screen" src="map.png"></div><h2>01 / The city is your curriculum</h2><p class="small">An upward journey through three districts.</p></section><section><div class="frame defense"><div class="eyebrow">LEVEL 01 / COURTYARD DEFENSE</div><h2>Restore the first signal.</h2><p class="small">Guide the net to the target column. Keep survivor tiles clear.</p><img class="actors" src="coding-actors.png"><img src="coding-grid.png"><div class="eyebrow">CSS DECLARATIONS</div><img src="coding-editor.png"></div><h2>02 / Write it. Run it. See it.</h2><p class="small">Real CSS geometry and local SQLite queries.</p></section><section><div class="frame defense"><div class="eyebrow">LEVEL 08 / BRIDGE SIEGE</div><h2>Build a defense that holds.</h2><p class="small">Connect healthy services, inspect the traffic, then adapt as the waves arrive.</p><img src="defense-actors.png"><div class="metric"><span>600 requests / sec</span><span>Health checks enabled</span></div><img src="architecture.png"><p class="small">Scenario capacities are teaching assumptions. Outcomes come from the simulator.</p></div><h2>03 / Architecture in motion</h2><p class="small">Routing, availability, caching, freshness and cost.</p></section></div><footer><span>PATCH + THE ZOMBIE CREW</span><span>PAINTERLY ENVIRONMENTS / EDITABLE CHARACTER RIGS</span></footer>`;
  await writeFile(`${out}/contact-sheet.html`, html);
  await page.setViewportSize({ width: 1800, height: 1200 });
  await page.goto(pathToFileURL(resolve(`${out}/contact-sheet.html`)).href);
  await page.screenshot({ path: `${out}/contact-sheet.png`, fullPage: true });
  console.log(`Captured ${out}/contact-sheet.png from ${base}`);
} finally {
  await browser.close();
}
