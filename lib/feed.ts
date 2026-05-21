import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getLevelProgress } from "@/lib/xp";

export type FeedEventType =
  | "run"
  | "workout"
  | "level_up"
  | "streak"
  | "personal_record"
  | "streak_milestone"
  | "hybrid_bonus"
  | "challenge_accepted"
  | "challenge_won"
  | "competition_joined"
  | "exclusive_trophy"
  | "rank_reached"
  | "season_started";

export type FeedProfile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_id: string | null;
  rank: string | null;
  current_level: number | null;
  total_xp: number | null;
  xp_into_level: number | null;
  xp_for_next_level: number | null;
  level_progress: number | null;
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
  comment_count: number;
};

export type CreateFeedEventInput = {
  userId: string;
  eventType: FeedEventType;
  payload: Record<string, unknown>;
  createdAt?: string;
  dedupeKey?: string;
};

/**
 * Central feed engine.
 * All social events should pass through here so payloads, timestamps and
 * de-duplication stay consistent across workouts, runs, trophies and social.
 */
export async function createFeedEvent(
  supabase: SupabaseClient,
  input: CreateFeedEventInput
): Promise<{ id: string } | null> {
  const writeSupabase = createSupabaseAdminClient();
  const dedupeKey = input.dedupeKey ?? getPayloadDedupeKey(input.payload);

  if (dedupeKey) {
    const { data: existing, error: existingError } = await writeSupabase
      .from("activities_feed")
      .select("id")
      .eq("user_id", input.userId)
      .eq("event_type", input.eventType)
      .filter("payload->>dedupe_key", "eq", dedupeKey)
      .maybeSingle();

    if (existingError) {
      console.error("[feed] dedupe lookup error:", existingError.message);
    }
    if (existing?.id) return { id: existing.id as string };
  }

  const payload = dedupeKey
    ? { ...input.payload, dedupe_key: dedupeKey }
    : input.payload;

  const { data, error } = await writeSupabase
    .from("activities_feed")
    .insert({
      user_id: input.userId,
      event_type: input.eventType,
      payload,
      ...(input.createdAt ? { created_at: input.createdAt } : {}),
    })
    .select("id")
    .single();

  if (error) {
    console.error("[feed] create event error:", error.message);
    return null;
  }

  return data as { id: string };
}

export async function insertFeedEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: FeedEventType,
  payload: Record<string, unknown>,
  createdAt?: string
): Promise<void> {
  await createFeedEvent(supabase, {
    userId,
    eventType,
    payload,
    createdAt,
  });
}

export async function deleteFeedEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: FeedEventType,
  activityId: string
): Promise<void> {
  const writeSupabase = createSupabaseAdminClient();
  const { error } = await writeSupabase
    .from("activities_feed")
    .delete()
    .eq("user_id", userId)
    .eq("event_type", eventType)
    .filter("payload->>id", "eq", activityId);
  if (error) console.error("[feed] delete error:", error.message);
}

function getPayloadDedupeKey(payload: Record<string, unknown>): string | undefined {
  const id = payload.id ?? payload.run_id ?? payload.workout_id ?? payload.trophy_id ?? payload.challenge_id ?? payload.competition_id;
  if (typeof id === "string" && id.trim()) return id;
  if (typeof id === "number" && Number.isFinite(id)) return String(id);
  return undefined;
}

function hydrateXpState(profile: FeedProfile): FeedProfile {
  const totalXp = Number(profile.total_xp ?? 0);
  const progress = getLevelProgress(totalXp);
  return {
    ...profile,
    xp_into_level: progress.xpIntoLevel,
    xp_for_next_level: progress.xpForNextLevel,
    level_progress: progress.levelProgress,
  };
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

  const [profilesRes, reactionsRes, userReactionsRes, commentsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id,username,display_name,avatar_id,rank,current_level,total_xp")
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
    supabase
      .from("feed_comments")
      .select("feed_event_id")
      .in("feed_event_id", eventIds),
  ]);

  const profileMap = Object.fromEntries(
    ((profilesRes.data ?? []) as FeedProfile[]).map((p) => [p.user_id, hydrateXpState(p)])
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

  // Count comments per event (graceful if table doesn't exist yet)
  const commentCountMap: Record<string, number> = {};
  for (const c of (commentsRes.data ?? []) as { feed_event_id: string }[]) {
    commentCountMap[c.feed_event_id] = (commentCountMap[c.feed_event_id] ?? 0) + 1;
  }

  return (events as Omit<FeedEvent, "profile" | "reaction_count" | "user_has_reacted" | "comment_count">[]).map((event) => ({
    ...event,
    profile: profileMap[event.user_id],
    reaction_count: reactionCountMap[event.id] ?? 0,
    user_has_reacted: userReactedSet.has(event.id),
    comment_count: commentCountMap[event.id] ?? 0,
  }));
}
