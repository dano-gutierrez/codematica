import sharp from "sharp";
import {
  miniatureFrames,
  miniatureScene,
} from "../../packages/core/src/game/miniatures";
import {
  readdir,
  readFile,
  writeFile,
  mkdir,
  copyFile,
} from "node:fs/promises";
const root = "assets/game",
  files = (await readdir(`${root}/source`))
    .filter((f) => f.endsWith(".svg"))
    .sort();
const frames: Record<
  string,
  {
    frame: { x: number; y: number; w: number; h: number };
    sourceSize: { w: number; h: number };
    spriteSourceSize: { x: number; y: number; w: number; h: number };
  }
> = {};
const tiles = await Promise.all(
  files.map(async (file, i) => {
    const x = (i % 4) * 128,
      y = Math.floor(i / 4) * 128;
    frames[file.slice(0, -4)] = {
      frame: { x, y, w: 128, h: 128 },
      sourceSize: { w: 128, h: 128 },
      spriteSourceSize: { x: 0, y: 0, w: 128, h: 128 },
    };
    return {
      input: await sharp(await readFile(`${root}/source/${file}`))
        .png()
        .toBuffer(),
      left: x,
      top: y,
    };
  }),
);
await mkdir(`${root}/generated`, { recursive: true });
await sharp({
  create: {
    width: 512,
    height: Math.ceil(files.length / 4) * 128,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(tiles)
  .png()
  .toFile(`${root}/generated/actors.png`);
const atlas = {
  frames,
  meta: {
    image: "actors.png",
    scale: "1",
    size: { w: 512, h: Math.ceil(files.length / 4) * 128 },
  },
};
await writeFile(
  `${root}/generated/actors.json`,
  JSON.stringify(atlas, null, 2) + "\n",
);
await mkdir("apps/web/public/game", { recursive: true });
await copyFile(
  `${root}/generated/actors.png`,
  "apps/web/public/game/actors.png",
);
await copyFile(
  `${root}/generated/actors.json`,
  "apps/web/public/game/actors.json",
);
await mkdir("apps/web/public/game", { recursive: true });
for (const file of (await readdir(`${root}/source/environments`))
  .filter((f) => f.endsWith(".svg"))
  .sort()) {
  const name = file.slice(0, -4);
  await sharp(`${root}/source/environments/${file}`)
    .webp({ lossless: true })
    .toFile(`${root}/generated/${name}.webp`);
  await copyFile(
    `${root}/generated/${name}.webp`,
    `apps/web/public/game/${name}.webp`,
  );
}
for (const name of ["garden", "canal", "tower"]) {
  await sharp(`${root}/source/${name}.png`)
    .resize({ width: 1024 })
    .webp({ quality: 85 })
    .toFile(`${root}/generated/${name}.webp`);
  await copyFile(
    `${root}/generated/${name}.webp`,
    `apps/web/public/game/${name}.webp`,
  );
}
console.log(`Exported ${files.length} editable character parts and effects.`);

const portraits = [
  {
    id: "patch",
    name: "Patch",
    alt: "Patch, a cream repair robot with amber eyes and orange fittings",
  },
  {
    id: "shambler",
    name: "Shambler",
    alt: "A sleepy green zombie wearing a patched jacket and ochre scarf",
  },
  {
    id: "runner",
    name: "Runner",
    alt: "A lively green zombie with swept hair and an orange work vest",
  },
  {
    id: "armored",
    name: "Armored",
    alt: "A stocky green zombie in cream and orange salvaged armor",
  },
];
const portraitOutput = `${root}/generated/thumbnails`;
const portraitPublic = "apps/web/public/game/thumbnails";
await mkdir(portraitOutput, { recursive: true });
await mkdir(portraitPublic, { recursive: true });
const characters = [];
for (const portrait of portraits) {
  const source = `${root}/source/portraits/${portrait.id}.png`;
  const metadata = await sharp(source).metadata();
  if (
    metadata.width !== metadata.height ||
    !metadata.width ||
    metadata.width < 512
  )
    throw new Error(
      `Portrait ${portrait.id} must be square and at least 512 pixels.`,
    );
  const variants = [];
  for (const size of [64, 128, 256, 512]) {
    const png = `${portrait.id}-${size}.png`;
    const webp = `${portrait.id}-${size}.webp`;
    const image = sharp(source).resize(size, size);
    await image.clone().png().toFile(`${portraitOutput}/${png}`);
    await image
      .clone()
      .webp({ quality: 92 })
      .toFile(`${portraitOutput}/${webp}`);
    await copyFile(`${portraitOutput}/${png}`, `${portraitPublic}/${png}`);
    await copyFile(`${portraitOutput}/${webp}`, `${portraitPublic}/${webp}`);
    variants.push({ size, png, webp });
  }
  characters.push({ ...portrait, variants });
}
await writeFile(
  `${portraitOutput}/manifest.json`,
  JSON.stringify(
    { version: 1, style: "patch-enamel-v2", characters },
    null,
    2,
  ) + "\n",
);
await copyFile(
  `${portraitOutput}/manifest.json`,
  `${portraitPublic}/manifest.json`,
);
console.log(
  "Exported four portrait identities in PNG and WebP at 64, 128, 256 and 512 pixels.",
);

// Full-body miniatures use the actual shared idle pose, including the editable Patch rig.
const miniOutput = `${root}/generated/miniatures`;
const miniPublic = "apps/web/public/game/miniatures";
await mkdir(miniOutput, { recursive: true });
await mkdir(miniPublic, { recursive: true });
const miniPose = miniatureScene(360, 180, "idle", 0, "none", true);
const miniFrames = miniatureFrames("idle");
const miniCharacters = [];
for (const [index, character] of portraits.entries()) {
  const actor = miniPose.actors[index];
  const center = (actor.left + actor.right) / 2;
  const selected = miniPose.layers
    .map((layer, i) => ({ layer, frame: miniFrames[i] }))
    .filter(
      ({ layer }) =>
        layer.alpha > 0 &&
        (layer.id === `shadow-${index}` ||
          (index === 0
            ? !layer.id.startsWith("shadow-") && !layer.id.startsWith("enemy-")
            : layer.id === `enemy-${character.id}`)),
    );
  const markup = await Promise.all(
    selected.map(async ({ layer, frame }) => {
      const source = (await readFile(`${root}/source/${frame}.svg`)).toString(
        "base64",
      );
      return `<image width="128" height="128" href="data:image/svg+xml;base64,${source}" transform="matrix(${layer.scos} ${layer.ssin} ${-layer.ssin} ${layer.scos} ${layer.tx} ${layer.ty})"/>`;
    }),
  );
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="${center - 50} 52 100 100">${markup.join("")}</svg>`;
  const variants = [];
  for (const size of [48, 64, 96, 128]) {
    const png = `${character.id}-${size}.png`;
    await sharp(Buffer.from(source))
      .resize(size, size)
      .png()
      .toFile(`${miniOutput}/${png}`);
    await copyFile(`${miniOutput}/${png}`, `${miniPublic}/${png}`);
    variants.push({ size, png });
  }
  miniCharacters.push({ ...character, variants });
}
await writeFile(
  `${miniOutput}/manifest.json`,
  JSON.stringify(
    {
      version: 1,
      kind: "in-level-miniatures",
      rigVersion: 3,
      characters: miniCharacters,
    },
    null,
    2,
  ) + "\n",
);
await copyFile(`${miniOutput}/manifest.json`, `${miniPublic}/manifest.json`);
console.log(
  "Exported four transparent full-body miniatures at 48, 64, 96 and 128 pixels.",
);
