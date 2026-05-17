import type { SupabaseClient } from "@supabase/supabase-js";

export type FeedEventType = "run" | "workout" | "level_up" | "streak";

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

  const uniqueUserIds = [
    ...new Set((events as { user_id: string }[]).map((e) => e.user_id)),
  ];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id,username,display_name,avatar_id,rank,current_level")
    .in("user_id", uniqueUserIds);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p: FeedProfile) => [p.user_id, p])
  );

  return (events as FeedEvent[]).map((event) => ({
    ...event,
    profile: profileMap[event.user_id],
  }));
}
