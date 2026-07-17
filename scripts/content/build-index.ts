import { promises as fs } from "node:fs";
import path from "node:path";
import { buildContentIndex, serializeContentIndex } from "../../packages/core/src/content/build-index";

const rootDir = process.cwd();
const outputPath = path.join(rootDir, "packages", "core", "src", "generated", "content-index.json");
const shouldCheck = process.argv.includes("--check");

const index = await buildContentIndex({ rootDir });
const serialized = serializeContentIndex(index);

if (shouldCheck) {
  const current = await fs.readFile(outputPath, "utf8").catch(() => "");

  if (current !== serialized) {
    throw new Error("Content index is stale. Run `npm run content:index`.");
  }
} else {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, serialized);
}
