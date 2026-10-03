import {readFile,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.BRAND_PLAYWRIGHT_MODULE ?? '@playwright/test');
const root=dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(await readFile(join(root,'prompts.json'),'utf8'));
const descriptions=[
 'Flat geometry · rounded lettering · bold, simple face',
 'Matte 3D clay · soft light · tactile game character',
 'Pixel art · bitmap lettering · retro coding adventure',
 'Layered paper · soft texture · storybook atmosphere',
 'Screenprint badge · slab lettering · repair workshop',
 'Minimal linework · C/robot symbol · technical clarity'
];
const cards=manifest.options.map((o,i)=>`<article><header><span class="number">${i+1}</span><div><h2>${o.name}</h2><p>${descriptions[i]}</p></div><a href="${o.output}" aria-label="Open ${o.name} full size">↗</a></header><a href="${o.output}"><img src="${o.output}" alt="Option ${i+1}: ${o.name} logo and matching favicon concepts"></a></article>`).join('');
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Codematica — Logo directions</title><style>*{box-sizing:border-box}body{margin:0;padding:48px;background:#ebe8df;color:#203f3e;font:17px system-ui}.intro{display:flex;align-items:end;justify-content:space-between;margin-bottom:30px}.eyebrow{font-size:12px;letter-spacing:2px;font-weight:700}h1{font-size:50px;letter-spacing:-2px;margin:9px 0 6px}p{margin:0;color:#4f655b;font-size:15px;line-height:1.5}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}article{background:#f7f2e8;border-radius:16px;overflow:hidden;border:1px solid #ccd0be}article header{display:flex;align-items:center;gap:14px;padding:20px 22px;border-bottom:1px solid #dfdfcf}h2{font-size:22px;margin:0 0 4px;letter-spacing:-.4px}article p{font-size:12px}article img{width:100%;display:block;aspect-ratio:3/2;object-fit:contain}.number{background:#203f3e;color:#fff4d8;border-radius:50%;width:34px;height:34px;display:grid;place-items:center;font-weight:700;flex-shrink:0}a{color:inherit;text-decoration:none}header a{margin-left:auto;font-size:24px;min-width:44px;min-height:44px;display:grid;place-items:center}a:focus-visible{outline:3px solid #c77a27;outline-offset:-3px}footer{display:flex;justify-content:space-between;margin-top:26px;font-size:12px;letter-spacing:1px;color:#4f655b}@media(max-width:1200px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:680px){body{padding:22px}.grid{grid-template-columns:1fr}.intro{display:block}h1{font-size:38px}.intro>p{margin-top:15px}footer{display:block;line-height:1.8}}</style><div class="intro"><div><div class="eyebrow">CODEMATICA / IDENTITY EXPLORATION / 02 OCT 2026</div><h1>One Patch. Six directions.</h1><p>Each option pairs a logo with a matching favicon study.</p></div><p>Choose a number to refine.<br>Concepts for review.</p></div><main class="grid">${cards}</main><footer><span>ORIGINAL PATCH IDENTITY · CREAM / TEAL / ORANGE</span><span>SMALL-SIZE FAVICON OPTIMIZATION FOLLOWS SELECTION</span></footer></html>`;
await writeFile(join(root,'gallery.html'),html);
const browser=await chromium.launch({channel:process.env.BRAND_BROWSER_CHANNEL});
try{
 const page=await browser.newPage({viewport:{width:2160,height:1400},deviceScaleFactor:1});
 await page.goto(pathToFileURL(join(root,'gallery.html')).href);
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0));
 await page.screenshot({path:join(root,'comparison.png'),fullPage:true});
}finally{await browser.close();}
console.log(join(root,'comparison.png'));
