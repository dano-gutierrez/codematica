import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { buildJapaneseN5 } from "./build-japanese-n5";

const execFileAsync = promisify(execFile);
const temporaryDirectories: string[] = [];
const checksum = (value: string | Uint8Array) => crypto.createHash("sha256").update(value).digest("hex");

async function createFixture(itemCount = 650) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "codematica-n5-test-"));
  temporaryDirectories.push(root);
  await Promise.all([
    fs.mkdir(path.join(root, "content/languages/japanese"), { recursive: true }),
    fs.mkdir(path.join(root, "content/learning-paths"), { recursive: true }),
    fs.mkdir(path.join(root, "packages/core/src/generated"), { recursive: true }),
  ]);
  const items = Array.from({ length: itemCount }, (_, index) => ({
    slug: `japanese/vocabulary/fixture-${index + 1}`,
    expression: `語${index + 1}`,
    reading: "ことば",
    romaji: "kotoba",
    meanings: [`word ${index + 1}`],
    status: "published",
  }));
  await fs.writeFile(path.join(root, "content/languages/japanese/vocabulary.json"), JSON.stringify({ kind: "vocabulary", language: "ja", items }));
  await fs.writeFile(path.join(root, "content/learning-paths/japanese-foundations.json"), JSON.stringify({
    slug: "japanese-foundations",
    title: "Japanese Foundations",
    summary: "Fixture",
    units: Array.from({ length: 5 }, (_, index) => ({ slug: `kana-${index + 1}`, nodes: [] })),
    progression: { roadmapLabel: "Kana", stages: [{ id: "kana", label: "Kana", unitSlugs: [] }] },
  }));

  const archiveDirectory = path.join(root, "archive");
  await fs.mkdir(archiveDirectory);
  await fs.writeFile(path.join(archiveDirectory, "fixture.json"), JSON.stringify({ words: [
    { kana: [{ text: "がくせい", common: true }], kanji: [{ text: "学生", common: true }] },
    { kana: [{ text: "みず", common: false }], kanji: [{ text: "水", common: true }, { text: "水分", common: false }] },
    { kana: [], kanji: [] },
  ] }));
  const archive = path.join(root, "jmdict.tgz");
  await execFileAsync("tar", ["-czf", archive, "-C", archiveDirectory, "fixture.json"]);
  return { root, archiveBytes: new Uint8Array(await fs.readFile(archive)) };
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

describe("Japanese N5 curriculum builder", () => {
  it("generates the complete deterministic curriculum from pinned source responses", async () => {
    const { root, archiveBytes } = await createFixture();
    const csv = "Expression,Reading,Meaning\n";
    const fetcher = async (url: string | URL | Request) => new Response(String(url).includes("vocabulary") ? csv : archiveBytes);

    await expect(buildJapaneseN5(root, {
      fetcher: fetcher as typeof fetch,
      vocabularySource: { url: "https://fixture.test/vocabulary.csv", sha256: checksum(csv) },
      jmdictSource: { url: "https://fixture.test/jmdict.tgz", sha256: checksum(archiveBytes) },
    })).resolves.toEqual({ vocabulary: 650, grammar: 60, queuedAudio: 710 });

    const vocabulary = JSON.parse(await fs.readFile(path.join(root, "content/languages/japanese/vocabulary.json"), "utf8"));
    const grammar = JSON.parse(await fs.readFile(path.join(root, "content/languages/japanese/grammar-n5.json"), "utf8"));
    const audio = JSON.parse(await fs.readFile(path.join(root, "content/languages/japanese/audio-manifest.json"), "utf8"));
    const learningPath = JSON.parse(await fs.readFile(path.join(root, "content/learning-paths/japanese-foundations.json"), "utf8"));
    const dictionary = JSON.parse(await fs.readFile(path.join(root, "packages/core/src/generated/japanese-ime-dictionary.json"), "utf8"));

    expect(vocabulary.items).toHaveLength(650);
    expect(grammar.items).toHaveLength(60);
    expect(audio.items).toHaveLength(710);
    expect(audio.items.every((item: { qaStatus: string }) => item.qaStatus === "draft")).toBe(true);
    expect(learningPath.units).toHaveLength(15);
    expect(learningPath.progression.stages).toHaveLength(5);
    expect(dictionary).toEqual({ がくせい: ["学生"], みず: ["水"] });
    expect(await fs.readdir(path.join(root, "content/knowledge/languages"))).toHaveLength(10);
    expect(await fs.readdir(path.join(root, "content/exercises/languages"))).toHaveLength(30);
  });

  it("fills a partial catalog from quoted CSV rows and assigns deterministic study metadata", async () => {
    const { root, archiveBytes } = await createFixture(2);
    const sourceRows = Array.from({ length: 648 }, (_, index) => {
      const meaning = index === 0 ? '"word, example"' : index === 1 ? "to learn" : `fixture meaning ${index + 1}`;
      const reading = index === 2 ? "っかー" : "あ";
      return `新語${index + 1},${reading},${meaning}`;
    });
    const csv = `Expression,Reading,Meaning\r\n${sourceRows.join("\r\n")}\r\n`;
    const fetcher = async (url: string | URL | Request) => new Response(String(url).includes("vocabulary") ? csv : archiveBytes);

    await buildJapaneseN5(root, {
      fetcher: fetcher as typeof fetch,
      vocabularySource: { url: "https://fixture.test/vocabulary.csv", sha256: checksum(csv) },
      jmdictSource: { url: "https://fixture.test/jmdict.tgz", sha256: checksum(archiveBytes) },
    });

    const vocabulary = JSON.parse(await fs.readFile(path.join(root, "content/languages/japanese/vocabulary.json"), "utf8"));
    expect(vocabulary.items).toHaveLength(650);
    expect(vocabulary.items[2]).toEqual(expect.objectContaining({ meanings: ["word, example"], romaji: "a", wordClass: ["word"] }));
    expect(vocabulary.items[3]).toEqual(expect.objectContaining({ wordClass: ["verb"] }));
    expect(vocabulary.items[4]).toEqual(expect.objectContaining({ romaji: "kka-" }));
    expect(vocabulary.items[649].unitSlugs).toEqual(["n5-integrated-readiness"]);
  });

  it("rejects changed vocabulary and dictionary downloads before writing trusted assets", async () => {
    const first = await createFixture();
    await expect(buildJapaneseN5(first.root, {
      fetcher: (async () => new Response("changed")) as typeof fetch,
      vocabularySource: { url: "https://fixture.test/vocabulary.csv", sha256: "wrong" },
    })).rejects.toThrow("vocabulary source failed its checksum");

    const second = await createFixture();
    const csv = "Expression,Reading,Meaning\n";
    const fetcher = async (url: string | URL | Request) => new Response(String(url).includes("vocabulary") ? csv : second.archiveBytes);
    await expect(buildJapaneseN5(second.root, {
      fetcher: fetcher as typeof fetch,
      vocabularySource: { url: "https://fixture.test/vocabulary.csv", sha256: checksum(csv) },
      jmdictSource: { url: "https://fixture.test/jmdict.tgz", sha256: "wrong" },
    })).rejects.toThrow("JMdict source failed its checksum");

    const third = await createFixture(1);
    await expect(buildJapaneseN5(third.root, {
      fetcher: (async () => new Response(csv)) as typeof fetch,
      vocabularySource: { url: "https://fixture.test/vocabulary.csv", sha256: checksum(csv) },
    })).rejects.toThrow("exactly 650 unique entries");
  });
});
