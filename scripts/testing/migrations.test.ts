import { readdir } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("migration registration", () => {
  it("assigns each SQL migration a unique version for a clean Supabase replay", async () => {
    const files = (await readdir("supabase/migrations")).filter((file) => file.endsWith(".sql"));
    const versions = files.map((file) => file.split("_")[0]);
    expect(new Set(versions).size, files.join("\n")).toBe(files.length);
  });
});
