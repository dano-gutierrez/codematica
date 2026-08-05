import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { buildContentIndex } from "../../packages/core/src/content/build-index";
import type { ContentIndex } from "../../packages/core/src/content/schema";

type SyncError = { message?: string } | null;

export type ContentSyncClient = {
  from: (table: "kb_documents" | "kb_diagrams") => {
    upsert: (
      rows: Array<Record<string, unknown>>,
      options: { onConflict: string },
    ) => Promise<{ error: SyncError }>;
  };
};

export function createDocumentSyncRows(index: ContentIndex) {
  return index.documents.map((document) => ({
    slug: document.slug,
    title: document.title,
    summary: document.summary,
    track: document.track,
    topic: document.topic,
    difficulty: document.difficulty,
    tags: document.tags,
    prerequisites: document.prerequisites,
    diagram_refs: document.diagramRefs,
    status: document.status,
    source_path: document.sourcePath,
    markdown: document.markdown,
    plain_text: document.plainText,
    headings: document.headings,
    mermaid_blocks: document.mermaidBlocks,
    content_hash: document.contentHash,
    reading_minutes: document.readingMinutes,
  }));
}

export function createDiagramSyncRows(index: ContentIndex) {
  return index.diagrams.map((diagram) => ({
    slug: diagram.slug,
    title: diagram.title,
    source_path: diagram.sourcePath,
    source: diagram.source,
    content_hash: diagram.contentHash,
  }));
}

export async function syncContentToSupabase(client: ContentSyncClient, index: ContentIndex) {
  const { error: documentError } = await client
    .from("kb_documents")
    .upsert(createDocumentSyncRows(index), { onConflict: "slug" });

  if (documentError) throw documentError;

  const { error: diagramError } = await client
    .from("kb_diagrams")
    .upsert(createDiagramSyncRows(index), { onConflict: "slug" });

  if (diagramError) throw diagramError;

  return { documents: index.documents.length, diagrams: index.diagrams.length };
}

export async function runContentSync(
  env: NodeJS.ProcessEnv = process.env,
  rootDir = process.cwd(),
  dependencies: {
    createClient?: typeof createClient;
    buildIndex?: typeof buildContentIndex;
    log?: (message: string) => void;
  } = {},
) {
  const supabaseUrl = env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before syncing content.");
  }

  const client = (dependencies.createClient ?? createClient)(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  }) as unknown as ContentSyncClient;
  const index = await (dependencies.buildIndex ?? buildContentIndex)({ rootDir });
  const result = await syncContentToSupabase(client, index);
  (dependencies.log ?? console.log)(`Synced ${result.documents} documents and ${result.diagrams} diagrams.`);
  return result;
}

/* v8 ignore start -- the CLI entry point delegates to the tested injectable helper. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runContentSync();
}
/* v8 ignore stop */
