import type { SupabaseClient } from "@supabase/supabase-js";

export type FeedEventType =
  | "run"
  | "workout"
  | "level_up"
  | "streak"
  | "personal_record"
  | "streak_milestone"
  | "hybrid_bonus";

export type FeedProfile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_id: string | null;
  rank: string | null;
  current_level: number | null;
};

export type FeedEvent = {
  id: string;
  user_id: string;
  event_type: FeedEventType;
  payload: Record<string, unknown>;
  created_at: string;
  profile?: FeedProfile;
  reaction_count: number;
  user_has_reacted: boolean;
};

export async function insertFeedEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: FeedEventType,
  payload: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from("activities_feed")
    .insert({ user_id: userId, event_type: eventType, payload });
  if (error) console.error("[feed] insert error:", error.message);
}

export async function deleteFeedEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: FeedEventType,
  activityId: string
): Promise<void> {
  const { error } = await supabase
    .from("activities_feed")
    .delete()
    .eq("user_id", userId)
    .eq("event_type", eventType)
    .filter("payload->>id", "eq", activityId);
  if (error) console.error("[feed] delete error:", error.message);
}

export async function getFeedEvents(
  supabase: SupabaseClient,
  userId: string,
  limit = 20,
  before?: string
): Promise<FeedEvent[]> {
  const { data: followedData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const userIds = [
    userId,
    ...(followedData ?? []).map((f: { following_id: string }) => f.following_id),
  ];

  let query = supabase
    .from("activities_feed")
    .select("id,user_id,event_type,payload,created_at")
    .in("user_id", userIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) query = query.lt("created_at", before);

  const { data: events } = await query;
  if (!events?.length) return [];

  const eventIds = (events as { id: string }[]).map((e) => e.id);
  const uniqueUserIds = [...new Set((events as { user_id: string }[]).map((e) => e.user_id))];

  const [profilesRes, reactionsRes, userReactionsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id,username,display_name,avatar_id,rank,current_level")
      .in("user_id", uniqueUserIds),
    supabase
      .from("feed_reactions")
      .select("feed_event_id")
      .in("feed_event_id", eventIds),
    supabase
      .from("feed_reactions")
      .select("feed_event_id")
      .in("feed_event_id", eventIds)
      .eq("user_id", userId),
  ]);

  const profileMap = Object.fromEntries(
    ((profilesRes.data ?? []) as FeedProfile[]).map((p) => [p.user_id, p])
  );

  // Count reactions per event
  const reactionCountMap: Record<string, number> = {};
  for (const r of (reactionsRes.data ?? []) as { feed_event_id: string }[]) {
    reactionCountMap[r.feed_event_id] = (reactionCountMap[r.feed_event_id] ?? 0) + 1;
  }

  // Set of event IDs the current user has reacted to
  const userReactedSet = new Set(
    ((userReactionsRes.data ?? []) as { feed_event_id: string }[]).map((r) => r.feed_event_id)
  );

  return (events as Omit<FeedEvent, "profile" | "reaction_count" | "user_has_reacted">[]).map((event) => ({
    ...event,
    profile: profileMap[event.user_id],
    reaction_count: reactionCountMap[event.id] ?? 0,
    user_has_reacted: userReactedSet.has(event.id),
  }));
}
