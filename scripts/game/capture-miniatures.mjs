import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const base=process.argv[2]??'http://127.0.0.1:3128';
const out='assets/game/previews';
await mkdir(out,{recursive:true});
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:390,height:900},deviceScaleFactor:2,reducedMotion:'reduce'});
 await page.goto(`${base}/play/restore-the-signal/courtyard-defense`);
 const scene=page.getByTestId('game-scene');
 await expect(scene).toHaveAttribute('data-ready','true');
 await scene.screenshot({path:`${out}/miniatures-phone.png`});
 await page.setViewportSize({width:900,height:900});
 await expect(scene).toHaveAttribute('data-render-width',String(await scene.evaluate(el=>el.clientWidth)));
 await scene.screenshot({path:`${out}/miniatures-wide.png`});
 const names=['Patch','Shambler','Runner','Armored'];
 const cards=names.map(name=>`<article><div class="hero"><img src="../generated/miniatures/${name.toLowerCase()}-128.png" alt="${name} full-body miniature"></div><h2>${name}</h2><div class="sizes">${[32,48,64,96].map(size=>`<div><img width="${size}" height="${size}" src="../generated/miniatures/${name.toLowerCase()}-128.png" alt=""><small>${size}px</small></div>`).join('')}</div></article>`).join('');
 const html=`<!doctype html><html lang="en"><meta charset="utf-8"><title>Codematica · In-level miniatures</title><style>*{box-sizing:border-box}body{margin:0;padding:50px;background:#f5efdf;color:#24483d;font:17px system-ui}h1{font-size:50px;letter-spacing:-2px;margin:12px 0}h2{font-size:24px;margin:16px 0 20px}p{line-height:1.5;color:#52685b;margin:0}.eyebrow{font-size:12px;letter-spacing:2px;font-weight:700}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:26px;margin-top:30px}.hero{background:linear-gradient(#e8edda,#d5dfc6);border-radius:26px;display:flex;justify-content:center;padding:22px}.hero img{width:128px;height:128px}.sizes{display:flex;align-items:end;justify-content:space-between;gap:5px}.sizes img{display:block}.sizes small{display:block;text-align:center;font-size:11px;margin-top:5px;color:#52685b}.scene-row{display:grid;grid-template-columns:1fr 1.5fr;gap:36px;margin-top:40px;padding-top:26px;border-top:1px solid #cbd1bb}.scene-row img{width:100%;object-fit:contain;max-height:210px;display:block;border-radius:22px;margin-top:20px}footer{display:flex;justify-content:space-between;font-size:12px;letter-spacing:1px;border-top:1px solid #cbd1bb;padding-top:22px;margin-top:28px}</style><header><div class="eyebrow">CODEMATICA / IN-LEVEL CHARACTER MINIATURES</div><h1>A little crew. Clear at a glance.</h1><p>Oversized faces, short limbs and distinct silhouettes. The actual animated game artwork.</p></header><main class="grid">${cards}</main><section class="scene-row"><div><div class="eyebrow">PHONE / ACTUAL PIXI SCENE</div><img src="miniatures-phone.png" alt="Phone game scene showing all four miniature characters"></div><div><div class="eyebrow">WIDE CONTAINER / SAME CHARACTER SCALE</div><img src="miniatures-wide.png" alt="Wide game scene with the same four characters centered"></div></section><footer><span>EDITABLE PARTS + SHARED WEB/NATIVE POSES</span><span>TRANSPARENT FULL-BODY EXPORTS / 48 · 64 · 96 · 128 PX</span></footer></html>`;
 await writeFile(`${out}/miniatures-v3.html`,html);
 await page.setViewportSize({width:1440,height:990});
 await page.goto(pathToFileURL(resolve(`${out}/miniatures-v3.html`)).href);
 await page.screenshot({path:`${out}/miniatures-v3.png`,fullPage:true});
 console.log(`Saved ${out}/miniatures-v3.png`);
} finally {await browser.close();}
