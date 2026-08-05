import { describe, expect, it, vi } from "vitest";
import { getContentIndex } from "../../packages/core/src/content";
import type { ContentIndex } from "../../packages/core/src/content/schema";
import {
  createDiagramSyncRows,
  createDocumentSyncRows,
  runContentSync,
  syncContentToSupabase,
  type ContentSyncClient,
} from "./sync-supabase";

function makeClient(errors: Partial<Record<"kb_documents" | "kb_diagrams", Error>> = {}) {
  const writes: Array<{ table: string; rows: Array<Record<string, unknown>>; onConflict: string }> = [];
  const client: ContentSyncClient = {
    from: (table) => ({
      upsert: vi.fn(async (rows, options) => {
        writes.push({ table, rows, onConflict: options.onConflict });
        return { error: errors[table] ?? null };
      }),
    }),
  };
  return { client, writes };
}

describe("Supabase content sync", () => {
  it("maps canonical documents and diagrams to the hosted schema", async () => {
    const index = getContentIndex();
    const { client, writes } = makeClient();

    await expect(syncContentToSupabase(client, index)).resolves.toEqual({
      documents: index.documents.length,
      diagrams: index.diagrams.length,
    });
    expect(writes.map(({ table, onConflict }) => ({ table, onConflict }))).toEqual([
      { table: "kb_documents", onConflict: "slug" },
      { table: "kb_diagrams", onConflict: "slug" },
    ]);
    expect(createDocumentSyncRows(index)[0]).toMatchObject({
      slug: index.documents[0].slug,
      diagram_refs: index.documents[0].diagramRefs,
      plain_text: index.documents[0].plainText,
    });
    expect(createDiagramSyncRows(index)[0]).toMatchObject({ slug: index.diagrams[0].slug });
  });

  it("supports an empty index without inventing remote rows", async () => {
    const index = { ...getContentIndex(), documents: [], diagrams: [] } as ContentIndex;
    const { client, writes } = makeClient();
    await syncContentToSupabase(client, index);
    expect(writes.map((write) => write.rows)).toEqual([[], []]);
  });

  it("stops after document errors and surfaces diagram errors", async () => {
    const index = getContentIndex();
    const documentFailure = makeClient({ kb_documents: new Error("documents failed") });
    await expect(syncContentToSupabase(documentFailure.client, index)).rejects.toThrow("documents failed");
    expect(documentFailure.writes).toHaveLength(1);

    const diagramFailure = makeClient({ kb_diagrams: new Error("diagrams failed") });
    await expect(syncContentToSupabase(diagramFailure.client, index)).rejects.toThrow("diagrams failed");
    expect(diagramFailure.writes).toHaveLength(2);
  });

  it("rejects missing server-only credentials before creating a client", async () => {
    await expect(runContentSync({}, "/tmp/unused")).rejects.toThrow(
      "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
    await expect(runContentSync({ SUPABASE_URL: "https://example.supabase.co" }, "/tmp/unused")).rejects.toThrow();
    await expect(runContentSync({ SUPABASE_SERVICE_ROLE_KEY: "secret" }, "/tmp/unused")).rejects.toThrow();
  });

  it("builds and syncs through injectable server-only dependencies", async () => {
    const index = { ...getContentIndex(), documents: [], diagrams: [] } as ContentIndex;
    const { client } = makeClient();
    const createClient = vi.fn(() => client as never);
    const buildIndex = vi.fn(async () => index);
    const log = vi.fn();

    await expect(runContentSync(
      { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "server-secret" },
      "/workspace",
      { createClient, buildIndex, log },
    )).resolves.toEqual({ documents: 0, diagrams: 0 });
    expect(createClient).toHaveBeenCalledWith("https://example.supabase.co", "server-secret", { auth: { persistSession: false } });
    expect(buildIndex).toHaveBeenCalledWith({ rootDir: "/workspace" });
    expect(log).toHaveBeenCalledWith("Synced 0 documents and 0 diagrams.");
  });
});
