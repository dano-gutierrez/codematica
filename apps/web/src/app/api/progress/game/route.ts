import { NextResponse } from "next/server";
import { getContentIndex } from "@/lib/content";
import { validateGameProgress } from "@codematica/core/game";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const client = await createServerSupabaseClient();
  if (!client) return NextResponse.json(null);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return NextResponse.json(null);
  if (request.headers.get("x-game-account") !== user.id)
    return NextResponse.json({ error: "Account changed" }, { status: 409 });
  const { data, error } = await client.rpc("get_game_progress");
  return error
    ? NextResponse.json(
        { error: "Unable to load game progress" },
        { status: 503 },
      )
    : NextResponse.json(data);
}
export async function POST(request: Request) {
  const client = await createServerSupabaseClient();
  if (!client)
    return NextResponse.json({ error: "Sign in to sync" }, { status: 401 });
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Sign in to sync" }, { status: 401 });
  if (request.headers.get("x-game-account") !== user.id)
    return NextResponse.json({ error: "Account changed" }, { status: 409 });
  try {
    const body = await request.text();
    if (body.length > 200000)
      return NextResponse.json(
        { error: "Snapshot too large" },
        { status: 413 },
      );
    const progress = validateGameProgress(
      JSON.parse(body),
      getContentIndex().gameCampaigns[0],
    );
    const { data, error } = await client.rpc("merge_game_progress", {
      payload: progress,
      expected_user: user.id,
    });
    return error
      ? NextResponse.json(
          { error: "Unable to sync game progress" },
          { status: 503 },
        )
      : NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Invalid game progress" },
      { status: 400 },
    );
  }
}
