import { NextResponse } from "next/server";
import { getContentIndex } from "@/lib/content";
import { syncAnonymousProgress, type ProgressDataClient } from "@/lib/progress/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 401 });
  }

  const body = await request.json().catch(() => undefined);
  const result = await syncAnonymousProgress(supabase as unknown as ProgressDataClient, body?.items ?? body, getContentIndex());

  return NextResponse.json(result.body, { status: result.status });
}
