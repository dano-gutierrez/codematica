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
