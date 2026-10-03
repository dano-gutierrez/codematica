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
