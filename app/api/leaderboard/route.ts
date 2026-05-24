import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getGlobalLeaderboard, getFriendsLeaderboard, type LeaderboardCategory } from "@/lib/leaderboard";
import { getActiveSeason } from "@/lib/seasons";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") ?? "global"; // "global" | "friends"
  const category: LeaderboardCategory = "xp";
  const activeSeason = await getActiveSeason(supabase);

  const entries =
    scope === "friends"
      ? await getFriendsLeaderboard(supabase, user.id, category, activeSeason)
      : await getGlobalLeaderboard(supabase, category, activeSeason);

  const myPosition = entries.findIndex((e) => e.userId === user.id);

  return NextResponse.json({ entries, myPosition, category, scope });
}
