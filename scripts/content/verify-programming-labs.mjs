import assert from "node:assert/strict";
import console from "node:console";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const lessons = [
  "javascript-value-contracts",
  "lazy-demand-and-stream-boundaries",
  "text-domain-and-matching",
];
// Fixed authored fences only; never execute user input or model-produced candidates.
for (const slug of lessons) {
  const document = readFileSync(
    join(root, `content/knowledge/programming/${slug}.md`),
    "utf8",
  );
  const blocks = [...document.matchAll(/^```javascript\n([\s\S]*?)^```$/gm)];
  assert.equal(
    blocks.length,
    1,
    `${slug} must have exactly one JavaScript fence`,
  );
  const directory = mkdtempSync(join(tmpdir(), "codematica-programming-lab-"));
  try {
    const result = spawnSync(
      process.execPath,
      ["--input-type=module", "--eval", blocks[0][1]],
      {
        cwd: directory,
        env: {},
        encoding: "utf8",
        timeout: 5000,
      },
    );
    assert.ifError(result.error);
    assert.equal(result.status, 0, `${slug}: ${result.stderr}`);
    assert.equal(result.stderr, "", `${slug} emitted an unexpected diagnostic`);
    assert.equal(result.stdout.trim(), `${slug}: passed`);
    console.log(result.stdout.trim());
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
