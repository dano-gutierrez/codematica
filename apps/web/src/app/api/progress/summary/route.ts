import { NextResponse } from "next/server";
import { getContentIndex } from "@/lib/content";
import { getProgressSummary, type ProgressDataClient } from "@/lib/progress/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ isSignedIn: false, items: [] });
  }

  try {
    const body = await getProgressSummary(supabase as unknown as ProgressDataClient, getContentIndex());
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "Unable to load progress." }, { status: 500 });
  }
}
