import { createClient } from "@supabase/supabase-js";
import { buildContentIndex } from "../../packages/core/src/content/build-index";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before syncing content.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

const index = await buildContentIndex({ rootDir: process.cwd() });

const { error: documentError } = await supabase.from("kb_documents").upsert(
  index.documents.map((document) => ({
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
  })),
  { onConflict: "slug" },
);

if (documentError) {
  throw documentError;
}

const { error: diagramError } = await supabase.from("kb_diagrams").upsert(
  index.diagrams.map((diagram) => ({
    slug: diagram.slug,
    title: diagram.title,
    source_path: diagram.sourcePath,
    source: diagram.source,
    content_hash: diagram.contentHash,
  })),
  { onConflict: "slug" },
);

if (diagramError) {
  throw diagramError;
}

console.log(`Synced ${index.documents.length} documents and ${index.diagrams.length} diagrams.`);
