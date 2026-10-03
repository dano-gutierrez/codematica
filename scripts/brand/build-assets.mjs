import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const check = process.argv.includes('--check');
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const teal = '#194548';
const board = resolve(root, 'assets/brand/source/approved-transparent.png');
const revisedBoard = resolve(root, 'assets/brand/source/approved-transparent-v3.png');
const outputs = new Map();

// These bounds separate the approved artwork. Imagegen owns background removal;
// this build only crops, sizes, and packages the resulting alpha artwork.
async function piece(left, top, width, height, source = board) {
  const cropped = await sharp(source).extract({ left, top, width, height }).png().toBuffer();
  return sharp(cropped).trim({ threshold: 10 }).png().toBuffer();
}
async function square(input, size, inset = 0, background = transparent) {
  const artwork = await sharp(input).resize(size - inset * 2, size - inset * 2, { fit: 'contain', background: transparent }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: artwork, gravity: 'centre' }]).png().toBuffer();
}
function output(path, buffer) { outputs.set(path, buffer); }

const mark = await piece(150, 40, 770, 670, revisedBoard);
const wordmark = await piece(50, 716, 990, 252);
// Assemble the revised head with the original lettering. The typography and
// tiny favicon continue to use their unchanged approved artwork.
const revisedHead = await sharp(revisedBoard).extract({ left: 50, top: 40, width: 990, height: 676 }).png().toBuffer();
const originalLettering = await sharp(board).extract({ left: 50, top: 716, width: 990, height: 252 }).png().toBuffer();
const logoBoard = await sharp({ create: { width: 990, height: 928, channels: 4, background: transparent } })
  .composite([{ input: revisedHead, top: 0, left: 0 }, { input: originalLettering, top: 676, left: 0 }]).png().toBuffer();
const logo = await sharp(logoBoard).trim({ threshold: 10 }).png().toBuffer();
const favicon = await piece(1185, 695, 188, 177);
const launcher = await sharp(resolve(root, 'assets/brand/source/launcher-foreground-v2.png')).trim({ threshold: 10 }).png().toBuffer();

const markPng = await square(mark, 512, 8);
const wordmarkPng = await sharp(wordmark).resize({ width: 768 }).png().toBuffer();
const headerMark = await sharp(markPng).resize(128).png().toBuffer();
const headerWordmark = await sharp(wordmarkPng).resize({ width: 384 }).png().toBuffer();
const logoPng = await sharp(logo).resize({ width: 1024 }).png().toBuffer();
const appIcon = await sharp(await square(launcher, 1024, 92, teal)).flatten({ background: teal }).png().toBuffer();
// Keep the entire foreground within Android's central safe circle.
const adaptive = await square(launcher, 1024, 282);

for (const [name, buffer] of [['patch-mark.png', markPng], ['wordmark.png', wordmarkPng], ['logo.png', logoPng], ['app-icon.png', appIcon]]) {
  output(`assets/brand/generated/${name}`, buffer);
  output(`apps/web/public/brand/${name}`, name === 'patch-mark.png' ? headerMark : name === 'wordmark.png' ? headerWordmark : buffer);
}
for (const [name, buffer] of [['patch-mark.png', headerMark], ['wordmark.png', headerWordmark]]) {
  output(`packages/ui/src/assets/brand/${name}`, buffer);
}
output('apps/mobile/assets/icon.png', appIcon);
output('apps/mobile/assets/adaptive-icon.png', adaptive);
output('apps/mobile/assets/splash.png', await square(mark, 512, 24));
output('apps/web/src/app/apple-icon.png', await sharp(appIcon).resize(180).png().toBuffer());

const sizes = [16, 32, 48];
const frames = [];
for (const size of [...sizes, 192, 512]) {
  const buffer = size <= 48 ? await square(favicon, size) : await sharp(appIcon).resize(size).png().toBuffer();
  output(`apps/web/public/brand/icon-${size}.png`, buffer);
  if (size <= 48) frames.push(buffer);
}
// ICO directory followed by PNG frames; no runtime icon-generation dependency.
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (const [index, size] of sizes.entries()) {
  const entry = 6 + index * 16;
  header[entry] = size;
  header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(frames[index].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += frames[index].length;
}
output('apps/web/src/app/favicon.ico', Buffer.concat([header, ...frames]));

// Validate platform contracts on the actual encoded bytes.
assert.equal((await sharp(appIcon).metadata()).width, 1024);
assert.equal((await sharp(appIcon).stats()).isOpaque, true, 'iOS launcher must be opaque');
for (const buffer of [markPng, wordmarkPng, adaptive, ...frames]) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(data[3], 0, 'Artwork must retain transparent corners');
  assert.ok(data.some((value, index) => index % 4 === 3 && value > 240), 'Artwork must be visible');
  assert.ok(info.width > 0 && info.height > 0);
}
const { data: adaptivePixels, info: adaptiveInfo } = await sharp(adaptive).raw().toBuffer({ resolveWithObject: true });
for (let y = 0; y < adaptiveInfo.height; y++) for (let x = 0; x < adaptiveInfo.width; x++) {
  if (adaptivePixels[(y * adaptiveInfo.width + x) * 4 + 3] > 10) {
    assert.ok(Math.hypot(x - 512, y - 512) < 313, 'Adaptive foreground exceeds safe circle');
  }
}
for (const [path, expected] of outputs) {
  const target = resolve(root, path);
  if (check) {
    assert.ok((await readFile(target)).equals(expected), `${path} is stale; run npm run brand:assets`);
  } else {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, expected);
  }
}
console.log(`${check ? 'Verified' : 'Exported'} ${outputs.size} brand assets with transparency and launcher safe-area checks.`);
