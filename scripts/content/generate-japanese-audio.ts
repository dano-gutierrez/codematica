import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { languageAudioCatalogFileSchema } from "../../packages/core/src/content/schema";

export type GenerateJapaneseAudioOptions = {
  rootDir?: string;
  confirm?: boolean;
  id?: string;
  unitSlug?: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
};

export async function generateJapaneseAudio({
  rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."),
  confirm = false,
  id,
  unitSlug,
  apiKey = process.env.OPENAI_API_KEY,
  fetchImpl = fetch,
}: GenerateJapaneseAudioOptions = {}) {
  const manifestPath = path.join(rootDir, "content/languages/japanese/audio-manifest.json");
  const manifest = languageAudioCatalogFileSchema.parse(JSON.parse(await fs.readFile(manifestPath, "utf8")));
  const selected = manifest.items.filter((item) => item.qaStatus === "draft" && item.generation && (!id || item.id === id) && (!unitSlug || item.unitSlug === unitSlug));
  const characters = selected.reduce((total, item) => total + item.transcript.length, 0);
  if (!confirm) return { generated: 0, pending: selected.length, characters, dryRun: true };
  if (!apiKey) throw new Error("OPENAI_API_KEY is required when --confirm is used.");

  let generated = 0;
  for (const item of selected) {
    const target = path.join(rootDir, "content/languages/japanese", item.assetPath);
    try {
      await fs.access(target);
      continue;
    } catch {
      // Missing is the expected state for a queued draft.
    }
    await fs.mkdir(path.dirname(target), { recursive: true });
    const response = await fetchImpl("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model: item.generation!.model, voice: item.generation!.voice, input: item.transcript, instructions: item.generation!.instructions, response_format: "mp3" }),
    });
    if (!response.ok) throw new Error(`OpenAI speech generation failed for ${item.id}: ${response.status} ${await response.text()}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(target, bytes);
    item.provenance = {
      kind: "openai-tts",
      model: item.generation.model,
      voice: item.generation.voice,
      instructions: item.generation.instructions,
      generatedAt: new Date().toISOString(),
      checksum: crypto.createHash("sha256").update(bytes).digest("hex"),
    };
    generated += 1;
  }
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { generated, pending: selected.length - generated, characters, dryRun: false };
}

/* v8 ignore start */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const id = process.argv.find((argument) => argument.startsWith("--id="))?.slice(5);
  const unitSlug = process.argv.find((argument) => argument.startsWith("--unit="))?.slice(7);
  const result = await generateJapaneseAudio({ confirm: process.argv.includes("--confirm"), id, unitSlug });
  console.log(result.dryRun
    ? `Dry run: ${result.pending} clips, ${result.characters} Japanese characters. Re-run with --confirm to generate billable audio.`
    : `Generated ${result.generated} clips; ${result.pending} already existed.`);
}
/* v8 ignore stop */
