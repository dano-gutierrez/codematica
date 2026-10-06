import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/release-regression.yml", "utf8");
const jobs = ["release-quality", "release-web"];

function artifactName(job: string, ref: string, attempt: number) {
  const body = workflow.split(`  ${job}:\n`)[1]?.split(/^ {2}[\w-]+:\s*$/m)[0];
  expect(body, job).toBeDefined();
  const uploads = [...body!.matchAll(/uses: actions\/upload-artifact@v4\s+with:\s+name: ([^\n]+)/g)];
  expect(uploads, job).toHaveLength(1);
  const values: Record<string, string> = {
    "github.ref_name": ref,
    "github.sha": "0123456789abcdef0123456789abcdef01234567",
    "github.run_attempt": String(attempt),
  };
  return uploads[0][1].replace(/\$\{\{\s*(.*?)\s*\}\}/g, (_, key: string) => {
    expect(values[key], key).toBeDefined();
    return values[key];
  });
}

describe("release regression evidence", () => {
  it.each([
    [".github/workflows/ci.yml", "database", "npm run test:reservation:sql"],
    [".github/workflows/release-regression.yml", "release-database", "python3 -I -W error::ResourceWarning scripts/content/verify-reservation-ranges.py"],
  ])("runs the pinned, isolated SQL verifier in %s", (file, job, command) => {
    const text = readFileSync(file, "utf8");
    const body = text.split(`  ${job}:\n`)[1]?.split(/^ {2}[\w-]+:\s*$/m)[0];
    expect(body).toBeDefined();
    const image = readFileSync("scripts/content/verify-reservation-ranges.py", "utf8").match(/^IMAGE = "([^"]+)"$/m)?.[1];
    expect(image).toMatch(/^postgres@sha256:[a-f0-9]{64}$/);
    const pull = body!.indexOf(`- run: docker pull ${image}\n`);
    const verify = body!.indexOf(`- run: ${command}\n`);
    expect(pull).toBeGreaterThanOrEqual(0);
    expect(verify).toBeGreaterThan(pull);
    const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts;
    expect(scripts["test:reservation:sql"]).toBe("python3 -I -W error::ResourceWarning scripts/content/verify-reservation-ranges.py");
  });
  it.each(jobs)("keeps %s artifact names valid for manual branch dispatch and tags", job => {
    for (const ref of ["codex/linkedin-saved-learning", "v0.1.0"]) {
      expect(artifactName(job, ref, 1)).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it("preserves distinct artifacts across jobs and rerun attempts", () => {
    const names = jobs.flatMap(job => [1, 2].map(attempt => artifactName(job, "codex/review", attempt)));
    expect(new Set(names).size).toBe(4);
  });
});
