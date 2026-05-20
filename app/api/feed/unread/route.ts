import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profileRes, followsRes, notifRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("feed_seen_at")
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id),

    supabase
      .from("notifications")
      .select("type")
      .eq("user_id", user.id)
      .eq("read", false),
  ]);

  // Count feed events from followed users newer than last seen
  let feed = 0;
  const feedSeenAt = (profileRes.data as { feed_seen_at?: string | null } | null)?.feed_seen_at;
  const followingIds = (followsRes.data ?? []).map((f: { following_id: string }) => f.following_id);

  if (followingIds.length > 0) {
    let feedQuery = supabase
      .from("activities_feed")
      .select("id", { count: "exact", head: true })
      .in("user_id", followingIds);

    if (feedSeenAt) {
      feedQuery = feedQuery.gt("created_at", feedSeenAt);
    }

    const { count } = await feedQuery;
    feed = count ?? 0;
  }

  // Count unread notifications by category
  const unreadNotifs = (notifRes.data ?? []) as { type: string }[];
  const challenges = unreadNotifs.filter((n) =>
    ["challenge_received", "challenge_accepted", "challenge_won"].includes(n.type)
  ).length;
  const trophies = unreadNotifs.filter((n) => n.type === "exclusive_trophy").length;
  const competitions = unreadNotifs.filter((n) =>
    ["competition_invite", "competition_started"].includes(n.type)
  ).length;

  return NextResponse.json({ feed, challenges, trophies, competitions });
}
