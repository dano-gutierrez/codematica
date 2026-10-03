import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const walk = async (root) => (await Promise.all(
  (await readdir(root, { withFileTypes: true })).map((entry) =>
    entry.isDirectory() ? walk(`${root}/${entry.name}`) : `${root}/${entry.name}`,
  ),
)).flat();
const files = async () => [
  ...await walk("assets/game/generated"),
  ...await walk("apps/web/public/game"),
  "apps/mobile/src/generated/game-worker.ts",
  "apps/mobile/.maestro/game-chapter.regression.yaml",
];
const snapshot = async () =>
  Object.fromEntries(
    await Promise.all(
      (await files()).sort().map(async (path) => [
        path,
        createHash("sha256")
          .update(await readFile(path))
          .digest("hex"),
      ]),
    ),
  );
const before = await snapshot();
for (const command of ["game:runtime", "game:assets", "game:flows"])
  execFileSync("npm", ["run", command], { stdio: "inherit" });
const after = await snapshot();
if (JSON.stringify(before) !== JSON.stringify(after))
  throw Error(
    "Game exports are stale or non-deterministic. Regenerate and commit the outputs.",
  );
console.log("Game worker and art exports are reproducible.");
