// @vitest-environment node
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { withInferenceLock } from "./inference";

it("rejects relative lock paths without running model work", async () => {
  let called = false;
  await expect(withInferenceLock(async () => { called = true; }, "relative.lock")).rejects.toThrow("absolute");
  expect(called).toBe(false);
});

it("serializes model calls across independently acquired locks and releases after failure", async () => {
  const folder = await mkdtemp(join(tmpdir(), "inference-lock-"));
  const path = join(folder, "shared.lock");
  let active = 0, peak = 0;
  try {
    const run = () => withInferenceLock(async () => {
      active++; peak = Math.max(peak, active);
      await new Promise(resolve => setTimeout(resolve, 40));
      active--; return "done";
    }, path);
    expect(await Promise.all([run(), run(), run()])).toEqual(["done", "done", "done"]);
    expect(peak).toBe(1);
    await expect(withInferenceLock(async () => { throw new Error("Model unavailable"); }, path)).rejects.toThrow("Model unavailable");
    expect(await run()).toBe("done");
  } finally { await rm(folder, { recursive: true, force: true }); }
});

it("fails closed when the helper cannot start", async () => {
  const previous = process.env.PATH;
  try {
    process.env.PATH = "/nonexistent-codematica-python";
    await expect(withInferenceLock(async () => "must not run", "/tmp/codematica-spawn-failure.lock")).rejects.toThrow("Unable to start");
  } finally { process.env.PATH = previous; }
});
