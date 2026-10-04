import sharp from "sharp";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import { MAP_PANELS, MAP_CAPACITY } from "../../packages/core/src/game/map-art";

/** Assemble first, then cut: adjacent files share the same pixels at every join. */
export async function buildMapArt() {
  const width = 768,
    tileHeight = 1152,
    guard = 64,
    chapterHeight = tileHeight * 3;
  const directory = "assets/game/generated/map";
  await mkdir(directory, { recursive: true });
  await mkdir("apps/web/public/game/map", { recursive: true });
  const chapters = await Promise.all(
    ["summit", "woodland", "highlands", "city"].map(async (name) =>
      sharp(`assets/game/source/map/${name}-v1.png`)
        .resize(width, chapterHeight, { fit: "cover" })
        .removeAlpha()
        .raw()
        .toBuffer(),
    ),
  );
  // Blend aligned overlap rows; never extrapolate a boundary row into streaks.
  const overlap = 384;
  let stitched = chapters[0];
  let stitchedHeight = chapterHeight;
  for (const lower of chapters.slice(1)) {
    const upperStart = (stitchedHeight - overlap) * width * 3;
    const blend = Buffer.alloc(overlap * width * 3);
    for (let y = 0; y < overlap; y++) {
      const t = y / (overlap - 1),
        alpha = t * t * (3 - 2 * t);
      for (let x = 0; x < width * 3; x++) {
        const pixel = y * width * 3 + x;
        blend[pixel] = Math.round(
          stitched[upperStart + pixel] * (1 - alpha) + lower[pixel] * alpha,
        );
      }
    }
    stitched = Buffer.concat([
      stitched.subarray(0, upperStart),
      blend,
      lower.subarray(overlap * width * 3),
    ]);
    stitchedHeight += chapterHeight - overlap;
  }
  const totalHeight = chapterHeight * 4;
  const master = await sharp(stitched, {
    raw: { width, height: stitchedHeight, channels: 3 },
  })
    .resize(width, totalHeight, { fit: "fill" })
    .raw()
    .toBuffer();
  const padded = Buffer.concat([
    master.subarray(0, guard * width * 3),
    master,
    master.subarray((totalHeight - guard) * width * 3),
  ]);
  for (const [index, panel] of MAP_PANELS.entries()) {
    const name = `${panel.id}.webp`;
    await sharp(padded, {
      raw: { width, height: totalHeight + guard * 2, channels: 3 },
    })
      .extract({
        left: 0,
        top: index * tileHeight,
        width,
        height: tileHeight + guard * 2,
      })
      .webp({ lossless: true })
      .toFile(`${directory}/${name}`);
    await copyFile(`${directory}/${name}`, `apps/web/public/game/map/${name}`);
  }
  // Shared transparent overlays, kept separate from the immobile stitched terrain.
  const foliage = await sharp("assets/game/source/map/foliage-v1.png")
    .resize(width, chapterHeight, { fit: "fill" })
    .png()
    .toBuffer();
  for (let i = 0; i < 3; i++) {
    await sharp(foliage)
      .extract({ left: 0, top: i * tileHeight, width, height: tileHeight })
      .webp({ lossless: true })
      .toFile(`${directory}/foliage-${i}.webp`);
  }
  for (const layer of ["mist", "motes"])
    await sharp(`assets/game/source/map/${layer}.svg`)
      .resize(width, tileHeight)
      .webp({ lossless: true })
      .toFile(`${directory}/${layer}.webp`);
  for (const layer of ["mist", "motes", "foliage-0", "foliage-1", "foliage-2"])
    await copyFile(
      `${directory}/${layer}.webp`,
      `apps/web/public/game/map/${layer}.webp`,
    );
  const manifest = {
    version: 1,
    capacity: MAP_CAPACITY,
    width,
    tileHeight,
    guard,
    layers: ["mist", "motes", "foliage-0", "foliage-1", "foliage-2"],
    panels: MAP_PANELS,
  };
  await writeFile(
    `${directory}/manifest.json`,
    JSON.stringify(manifest, null, 2) + "\n",
  );
  await copyFile(
    `${directory}/manifest.json`,
    "apps/web/public/game/map/manifest.json",
  );
  console.log(
    "Exported twelve contiguous landscape tiles and three parallax overlays for fifty positions.",
  );
}
