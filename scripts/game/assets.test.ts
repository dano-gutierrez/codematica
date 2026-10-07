// @vitest-environment node
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { expect, it } from "vitest";
import rig from "../../assets/game/source/patch-rig.json";

it("keeps every rig layer, expression and enemy inside the shared transparent atlas", async () => {
  const atlas = JSON.parse(
    await readFile("assets/game/generated/actors.json", "utf8"),
  );
  const image = sharp("assets/game/generated/actors.png");
  const metadata = await image.metadata();
  expect(metadata.hasAlpha).toBe(true);
  const names = [
    ...rig.parts.map((p) => p.asset),
    ...["neutral", "happy", "curious", "focused", "surprised", "tired"].map(
      (face) => `patch-face-${face}`,
    ),
    "shambler",
    "runner",
    "armored",
    ...Object.keys(rig.attachments),
  ];
  for (const name of names) {
    const frame = atlas.frames[name].frame;
    expect(frame.x + frame.w).toBeLessThanOrEqual(metadata.width!);
    expect(frame.y + frame.h).toBeLessThanOrEqual(metadata.height!);
    const { data } = await image
      .clone()
      .extract({ left: frame.x, top: frame.y, width: frame.w, height: frame.h })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const alpha = data.filter((_, i) => i % 4 === 3);
    expect(alpha.some((a) => a === 0)).toBe(true);
    expect(alpha.some((a) => a > 200)).toBe(true);
  }
});

it("exports all four portrait identities at readable, matching web and native sizes", async () => {
  const manifest = JSON.parse(
    await readFile("assets/game/generated/thumbnails/manifest.json", "utf8"),
  );
  expect(manifest.characters.map((c: { id: string }) => c.id)).toEqual([
    "patch",
    "shambler",
    "runner",
    "armored",
  ]);
  for (const character of manifest.characters) {
    expect(character.alt.length).toBeGreaterThan(10);
    expect(character.variants.map((v: { size: number }) => v.size)).toEqual([
      64, 128, 256, 512,
    ]);
    for (const variant of character.variants) {
      for (const format of ["png", "webp"]) {
        const file = variant[format];
        const bytes = await readFile(
          `assets/game/generated/thumbnails/${file}`,
        );
        const metadata = await sharp(bytes).metadata();
        expect(metadata.width).toBe(variant.size);
        expect(metadata.height).toBe(variant.size);
        expect(
          bytes.equals(
            await readFile(`apps/web/public/game/thumbnails/${file}`),
          ),
        ).toBe(true);
      }
    }
  }
});

it("exports transparent full-body miniatures separately from portrait icons", async () => {
  const manifest = JSON.parse(
    await readFile("assets/game/generated/miniatures/manifest.json", "utf8"),
  );
  expect(manifest.kind).toBe("in-level-miniatures");
  expect(manifest.characters.map((c: { id: string }) => c.id)).toEqual([
    "patch",
    "shambler",
    "runner",
    "armored",
  ]);
  for (const character of manifest.characters) {
    expect(character.variants.map((v: { size: number }) => v.size)).toEqual([
      48, 64, 96, 128,
    ]);
    for (const variant of character.variants) {
      const bytes = await readFile(
        `assets/game/generated/miniatures/${variant.png}`,
      );
      const image = sharp(bytes);
      expect((await image.metadata()).width).toBe(variant.size);
      const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      expect(info.height).toBe(variant.size);
      // Transparent corners and visible face/body pixels guard against empty or portrait exports.
      expect(data[3]).toBe(0);
      expect(data[(variant.size - 1) * 4 + 3]).toBe(0);
      expect(data.filter((_, i) => i % 4 === 3).some((a) => a > 200)).toBe(
        true,
      );
      expect(
        bytes.equals(
          await readFile(`apps/web/public/game/miniatures/${variant.png}`),
        ),
      ).toBe(true);
    }
  }
});

it("exports fifty-position terrain with identical shared pixels at every tile boundary", async () => {
  const manifest = JSON.parse(await readFile("assets/game/generated/map/manifest.json", "utf8"));
  expect(manifest.capacity).toBe(50);
  expect(manifest.panels).toHaveLength(12);
  expect(manifest.layers).toEqual(["mist", "motes", "foliage-0", "foliage-1", "foliage-2"]);
  let previous: Buffer | undefined;
  for (const panel of manifest.panels) {
    const file = `map/${panel.id}.webp`;
    const bytes = await readFile(`assets/game/generated/${file}`);
    expect(bytes.equals(await readFile(`apps/web/public/game/${file}`))).toBe(true);
    const image = sharp(bytes);
    const metadata = await image.metadata();
    expect(metadata.width).toBe(manifest.width);
    expect(metadata.height).toBe(manifest.tileHeight + 2 * manifest.guard);
    const top = await image.clone().extract({left:0,top:0,width:manifest.width,height:manifest.guard*2}).raw().toBuffer();
    if (previous) expect(top.equals(previous)).toBe(true);
    previous = await image.clone().extract({left:0,top:manifest.tileHeight,width:manifest.width,height:manifest.guard*2}).raw().toBuffer();
  }
  for (const layer of manifest.layers) {
    const bytes = await readFile(`assets/game/generated/map/${layer}.webp`);
    expect((await sharp(bytes).metadata()).hasAlpha).toBe(true);
    const {data,info} = await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    // Quiet center for controls. The foliage can never become an opaque page overlay.
    if (layer.startsWith("foliage")) for(let y=0;y<info.height;y+=32)
      expect(data[(y*info.width + Math.floor(info.width/2))*4 +3]).toBe(0);
    expect(bytes.equals(await readFile(`apps/web/public/game/map/${layer}.webp`))).toBe(true);
  }
});
