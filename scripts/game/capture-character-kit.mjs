import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const root = "assets/game", out = `${root}/previews`;
await mkdir(out, { recursive: true });
const rig = JSON.parse(await readFile(`${root}/source/patch-rig.json`, "utf8"));
const manifest = JSON.parse(await readFile(`${root}/generated/thumbnails/manifest.json`, "utf8"));
const parts = await Promise.all(rig.parts.map(async (part) => {
  const asset = part.id === "head" ? "patch-face-neutral" : part.asset;
  const svg = await readFile(`${root}/source/${asset}.svg`);
  const rotation = part.id.includes("arm") ? (part.id.startsWith("left") ? 1 : -1) * rig.animations.idle.frames[0][2] * 180 / Math.PI : 0;
  return `<g transform="translate(${part.x} ${part.y}) rotate(${rotation}) scale(${part.scale}) translate(${-part.pivot[0]} ${-part.pivot[1]})"><image width="128" height="128" href="data:image/svg+xml;base64,${svg.toString("base64")}"/></g>`;
}));
await writeFile(`${out}/patch-runtime-v2.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="192" viewBox="-90 -104 180 192">${parts.join("")}</svg>\n`);
const roles = { patch: "The repair partner", shambler: "Slow and sleepy", runner: "Quick and curious", armored: "Heavy and stubborn" };
const cards = manifest.characters.map((c, i) => `<article><div class="number">0${i+1} / ${c.name.toUpperCase()}</div><img class="portrait" src="../generated/thumbnails/${c.id}-512.webp" alt="${c.alt}"><h2>${c.name}</h2><p>${roles[c.id]}</p><div class="sizes">${[32,48,64].map(size=>`<div><img width="${size}" height="${size}" src="../generated/thumbnails/${c.id}-128.png" alt=""><small>${size}px</small></div>`).join("")}</div></article>`).join("");
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Codematica · Character kit</title><style>
*{box-sizing:border-box}body{margin:0;padding:56px;background:#f4eddd;color:#234940;font:18px system-ui}header{display:flex;justify-content:space-between;align-items:end;margin-bottom:32px}h1{font-size:54px;letter-spacing:-2px;line-height:1.1;margin:14px 0}h2{font-size:27px;margin:19px 0 4px}p{color:#50655a;line-height:1.5;margin:0}.eyebrow,.number{font-size:12px;font-weight:750;letter-spacing:2px}.number{margin-bottom:14px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}.portrait{width:100%;border-radius:24%;display:block}.sizes{display:flex;align-items:end;gap:24px;margin-top:20px}.sizes img{display:block;border-radius:24%}small{font-size:11px;display:block;text-align:center;margin-top:8px;color:#50655a}.runtime{border-top:1px solid #c7c9b7;margin-top:34px;padding-top:26px;display:flex;align-items:center;justify-content:space-between}.cast{display:flex;gap:25px;align-items:end}.cast img{width:128px;height:155px;object-fit:contain}.cast img:first-child{width:155px;height:166px}.runtime p{max-width:410px;font-size:16px}.chips{display:flex;gap:6px;margin-top:18px}.chips i{width:27px;height:12px;border-radius:8px}.footer{margin-top:25px;padding-top:18px;border-top:1px solid #c7c9b7;display:flex;justify-content:space-between;font-size:12px;letter-spacing:1px}
</style><header><div><div class="eyebrow">CODEMATICA / CHARACTER KIT 02</div><h1>Patch &amp; the zombie crew.</h1><p>Warm enamel. Expressive faces. A shared world.</p></div><p>Portraits + editable game artwork<br>PNG &amp; WebP · 64 / 128 / 256 / 512</p></header><main class="grid">${cards}</main><section class="runtime"><div><div class="eyebrow">EDITABLE GAME CHARACTERS</div><h2>Built to move.</h2><p>Separate robot parts, six expressions and three cosmetic attachments. Distinct enemy silhouettes, with the same cream, teal and orange material palette.</p><div class="chips">${["#eddfbe","#d88c38","#203f3e","#99a772","#e9bd57"].map(color=>`<i style="background:${color}"></i>`).join("")}</div></div><div class="cast"><img src="patch-runtime-v2.svg" alt="Assembled Patch rig">${["shambler","runner","armored"].map(id=>`<img src="../source/${id}.svg" alt="${id} game sprite">`).join("")}</div></section><footer class="footer"><span>ORIGINAL CHARACTERS · RESTORE THE SIGNAL</span><span>ROUNDED SQUARES ARE THE PREFERRED THUMBNAIL MASK</span></footer></html>`;
await writeFile(`${out}/character-kit-v2.html`, html);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1040 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(resolve(`${out}/character-kit-v2.html`)).href);
  await page.screenshot({ path: `${out}/character-kit-v2.png`, fullPage: true });
} finally { await browser.close(); }
console.log(`Saved ${out}/character-kit-v2.png`);
