import { NextResponse } from "next/server";
import { getSkillProgress, syncSkillProgress, type ProgressDataClient } from "@codematica/core/progress/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Auth is not configured." }, { status: 401 });
  const body = await request.json().catch(() => undefined);
  const result = await syncSkillProgress(supabase as unknown as ProgressDataClient, body?.items ?? body);
  return NextResponse.json(result.body, { status: result.status });
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ isSignedIn: false, items: [] });
  try {
    return NextResponse.json(await getSkillProgress(supabase as unknown as ProgressDataClient));
  } catch {
    return NextResponse.json({ error: "Unable to load skill progress." }, { status: 500 });
  }
}
