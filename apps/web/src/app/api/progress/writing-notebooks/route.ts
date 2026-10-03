import { NextResponse } from "next/server";
import {
  getContentIndex,
  readNotebookProgress,
  syncNotebookProgress,
  type NotebookDataClient,
} from "@codematica/core";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const client = await createServerSupabaseClient();
  if (!client) return NextResponse.json({ isSignedIn: false, items: [] });
  try {
    return NextResponse.json(
      await readNotebookProgress(client as unknown as NotebookDataClient),
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load notebook progress." },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  const client = await createServerSupabaseClient();
  if (!client)
    return NextResponse.json(
      { error: "Auth is not configured." },
      { status: 401 },
    );
  const body = await request.json().catch(() => undefined);
  const result = await syncNotebookProgress(
    client as unknown as NotebookDataClient,
    body?.items,
    getContentIndex(),
  );
  return NextResponse.json(result.body, { status: result.status });
}
