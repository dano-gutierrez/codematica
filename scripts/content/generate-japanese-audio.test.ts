import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateJapaneseAudio } from "./generate-japanese-audio";

const roots: string[] = [];
afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

async function fixtureRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codematica-tts-"));
  roots.push(rootDir);
  const directory = path.join(rootDir, "content/languages/japanese");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "audio-manifest.json"), JSON.stringify({ kind: "audio", language: "ja", items: [{ id: "student", transcript: "学生です。", reading: "がくせいです。", speaker: "OpenAI marin", license: "OpenAI generated output", attribution: "Generated for Codematica", assetPath: "audio/student.mp3", qaStatus: "draft", disclosure: "AI-generated voice", unitSlug: "identity-and-demonstratives", generation: { provider: "openai", model: "gpt-4o-mini-tts", voice: "marin", instructions: "Speak clear standard Tokyo Japanese for a beginner." } }] }));
  return rootDir;
}

describe("Japanese TTS generation", () => {
  it("reports a no-cost dry run by default", async () => {
    const rootDir = await fixtureRoot();
    await expect(generateJapaneseAudio({ rootDir })).resolves.toEqual({ generated: 0, pending: 1, characters: 5, dryRun: true });
  });

  it("writes resumable audio and provenance after a confirmed request", async () => {
    const rootDir = await fixtureRoot();
    const fetchImpl = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
    await expect(generateJapaneseAudio({ rootDir, confirm: true, apiKey: "test", fetchImpl })).resolves.toMatchObject({ generated: 1, dryRun: false });
    await expect(readFile(path.join(rootDir, "content/languages/japanese/audio/student.mp3"))).resolves.toEqual(Buffer.from([1, 2, 3]));
    const manifest = await readFile(path.join(rootDir, "content/languages/japanese/audio-manifest.json"), "utf8");
    expect(manifest).toContain('"checksum"');
  });
});
