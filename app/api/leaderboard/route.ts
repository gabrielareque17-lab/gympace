import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getGlobalLeaderboard, getFriendsLeaderboard, type LeaderboardCategory } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES: LeaderboardCategory[] = ["xp", "km", "workouts", "streak"];

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") ?? "global"; // "global" | "friends"
  const rawCat = url.searchParams.get("category") ?? "xp";
  const category: LeaderboardCategory = VALID_CATEGORIES.includes(rawCat as LeaderboardCategory)
    ? (rawCat as LeaderboardCategory)
    : "xp";

  const entries =
    scope === "friends"
      ? await getFriendsLeaderboard(supabase, user.id, category)
      : await getGlobalLeaderboard(supabase, category);

  const myPosition = entries.findIndex((e) => e.userId === user.id);

  return NextResponse.json({ entries, myPosition, category, scope });
}
