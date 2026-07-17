import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next") ?? undefined);
  const supabase = await createServerSupabaseClient();

  if (code && supabase) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const redirectUrl = new URL("/login", requestUrl.origin);
  redirectUrl.searchParams.set("sync", "1");
  redirectUrl.searchParams.set("next", nextPath);

  return NextResponse.redirect(redirectUrl);
}

function sanitizeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}
