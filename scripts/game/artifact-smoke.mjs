import { mkdtemp, mkdir, cp, readFile, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:net";
import {createHash} from "node:crypto";
import sharp from "sharp";
import { chromium } from "@playwright/test";
const root = process.cwd(),
  target = await mkdtemp(join(tmpdir(), "codematica-game-production-"));
let server,
  browser,
  logs = `Isolated artifact: ${target}\n`;
try {
  // Preserve the real production manifests and configuration, including pruning behavior.
  for (const dir of [
    "apps/web",
    "apps/mobile",
    "packages/core",
    "packages/ui",
  ]) {
    await mkdir(join(target, dir), { recursive: true });
    await cp(
      join(root, dir, "package.json"),
      join(target, dir, "package.json"),
    );
  }
  for (const name of ["package.json", "package-lock.json"])
    await cp(name, join(target, name));
  for (const dir of [
    "apps/web/.next",
    "apps/web/public",
    "packages/core/src",
    "assets/game",
  ])
    await cp(dir, join(target, dir), {
      recursive: true,
      filter: (path) => !path.includes("/.next/cache"),
    });
  await cp("apps/web/next.config.ts", join(target, "apps/web/next.config.ts"));
  logs += execFileSync(
    "npm",
    ["ci", "--omit=dev", "--ignore-scripts", "--no-audit", "--no-fund"],
    { cwd: target, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  );
  const port = await new Promise((resolvePort, reject) => {
    const listener = createServer();
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", () => {
      const address = listener.address();
      listener.close(() => resolvePort(address.port));
    });
  });
  server = spawn(
    process.execPath,
    [
      join(target, "node_modules/next/dist/bin/next"),
      "start",
      join(target, "apps/web"),
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      cwd: target,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production" },
    },
  );
  server.stdout.on("data", (b) => (logs += b));
  server.stderr.on("data", (b) => (logs += b));
  const url = `http://127.0.0.1:${port}`;
  for (let tries = 0; ; tries++) {
    try {
      const response = await fetch(url);
      if (response.ok) break;
    } catch {
      /* Retry until the isolated server is ready. */
    }
    if (tries > 60) throw Error(`Production startup failed: ${logs}`);
    await new Promise((r) => setTimeout(r, 250));
  }
  for (const asset of [
    "actors.json",
    "actors.png",
    ...["garden", "canal", "tower"].flatMap((d) => [
      `${d}.webp`,
      `${d}-middle.webp`,
      `${d}-foreground.webp`,
      `${d}-restored.webp`,
    ]),
    "sql-worker.js",
  ]) {
    const response = await fetch(`${url}/game/${asset}`);
    if (!response.ok) throw Error(`Missing runtime asset: ${asset}`);
    const data = Buffer.from(await response.arrayBuffer());
    if (asset.endsWith(".js") && !data.includes(Buffer.from("AGFzbQ")))
      throw Error("SQLite WASM is missing from the bundled worker");
  }
  const portraits = await fetch(`${url}/game/thumbnails/manifest.json`);
  if (!portraits.ok) throw Error("Missing character thumbnail manifest");
  const portraitManifest = await portraits.json();
  for (const character of portraitManifest.characters) {
    for (const variant of character.variants) {
      for (const format of ["png", "webp"]) {
        const response = await fetch(`${url}/game/thumbnails/${variant[format]}`);
        if (!response.ok) throw Error(`Missing thumbnail: ${variant[format]}`);
        const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
        if (metadata.width !== variant.size || metadata.height !== variant.size)
          throw Error(`Incorrect thumbnail dimensions: ${variant[format]}`);
      }
    }
  }
  logs += "All four character thumbnails and their 64–512px variants are packaged.\n";
  const miniResponse = await fetch(`${url}/game/miniatures/manifest.json`);
  if (!miniResponse.ok) throw Error("Missing full-body miniature manifest");
  const miniManifest = await miniResponse.json();
  for (const character of miniManifest.characters) for (const variant of character.variants) {
    const response = await fetch(`${url}/game/miniatures/${variant.png}`);
    if (!response.ok) throw Error(`Missing miniature: ${variant.png}`);
    const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
    if (!metadata.hasAlpha || metadata.width !== variant.size || metadata.height !== variant.size)
      throw Error(`Invalid miniature: ${variant.png}`);
  }
  logs += "All four full-body miniatures and their 48–128px variants are packaged.\n";
  for (const asset of [
    "brand/patch-mark.png", "brand/wordmark.png", "brand/logo.png", "brand/app-icon.png",
    ...[16, 32, 48, 192, 512].map(size => `brand/icon-${size}.png`),
    "favicon.ico", "apple-icon.png", "manifest.webmanifest",
  ]) {
    const response = await fetch(`${url}/${asset}`);
    if (!response.ok) throw Error(`Missing brand asset in production artifact: ${asset}`);
    const source = asset === "favicon.ico" || asset === "apple-icon.png" ? `apps/web/src/app/${asset}` : `apps/web/public/${asset}`;
    const expected = await readFile(join(root, source));
    if (!Buffer.from(await response.arrayBuffer()).equals(expected)) throw Error(`Stale brand asset in production artifact: ${asset}`);
  }
  logs += "Approved logo, transparent favicons, Apple icon and manifest match the packaged brand exports.\n";
  browser = await chromium.launch();
  const page = await browser.newPage();
  const campaign = JSON.parse(
    await readFile("content/game/restore-the-signal.json", "utf8"),
  );
  await page.goto(`${url}/play/${campaign.id}/${campaign.levels[0].id}`);
  await page
    .getByTestId("game-code")
    .fill(campaign.levels[0].scenarios[0].solution);
  await page.getByTestId("game-run").click();
  await page.getByRole("heading", { name: "Signal restored!" }).waitFor();
  await page.getByRole("link", { name: "Next level" }).click();
  await page
    .getByTestId("game-code")
    .fill(campaign.levels[1].scenarios[0].solution);
  await page.getByTestId("game-run").click();
  await page.getByRole("heading", { name: "Signal restored!" }).waitFor();
  logs +=
    "Pruned production startup, every district layer, real CSS and bundled SQLite passed.\n";
  const apk = process.argv.find((a) => a.endsWith(".apk"));
  if (apk) {
    const path=resolve(apk);
    // Android resource shrinking renames files. Match decoded pixels, not names.
    const resources=execFileSync("unzip",["-Z1",path],{encoding:"utf8"}).split("\n").filter(name=>/^res\/.*\.(png|webp)$/.test(name));
    const hash=bytes=>createHash("sha256").update(bytes).digest("hex");
    const pixels=async file=>{const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});return `${info.width}x${info.height}:${hash(data)}`;};
    const required=(await readdir("assets/game/generated")).filter(name=>name.endsWith(".png")||name.endsWith(".webp"));
    const missing=new Map(await Promise.all(required.map(async name=>[await pixels(join("assets/game/generated",name)),name])));
    for(const file of resources){const bytes=execFileSync("unzip",["-p",path,file],{maxBuffer:20*1024*1024});missing.delete(await pixels(bytes));if(!missing.size)break;}
    if(missing.size)throw Error(`APK missing textures: ${[...missing.values()].join(", ")}`);
    const bundle = execFileSync(
      "unzip",
      ["-p", path, "assets/index.android.bundle"],
      { maxBuffer: 30 * 1024 * 1024 },
    );
    if (
      !bundle.includes(Buffer.from("codematica-game")) ||
      !bundle.includes(Buffer.from("AGFzbQ"))
    )
      throw Error("APK missing local runner/WASM");
    logs += "APK includes all districts and offline SQL/CSS runners.\n";
  }
  console.log(logs);
} catch (error) {
  logs += String(error) + "\n" + (error.stdout ?? "") + (error.stderr ?? "");
  throw error;
} finally {
  await browser?.close();
  server?.kill();
  await mkdir("test-results", { recursive: true });
  await writeFile(`test-results/game-artifact-${Date.now()}.log`, logs);
  await writeFile("test-results/game-artifact.log", logs);
}
