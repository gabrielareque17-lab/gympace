import type { SupabaseClient } from "@supabase/supabase-js";

import {
  calculateSeasonScores,
  getSeasonDateWindow,
  type SeasonActivityRun,
  type SeasonActivityWorkout,
  type SeasonScoreBreakdown,
} from "@/lib/season-points";
import type { Season } from "@/lib/seasons";
import { customAvatarRowToDefinition, type CustomAvatarRow } from "@/lib/custom-avatars";
import type { AvatarDefinition } from "@/lib/avatar-registry";

export type LeaderboardEntry = {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarId: string | null;
  avatarDefinition?: AvatarDefinition | null;
  rank: string | null;
  currentLevel: number;
  totalXp: number;
  weeklyKm: number;
  weeklyWorkouts: number;
  weeklyScore: number;
  currentStreak: number;
  seasonPoints: number;
  seasonBreakdown: SeasonScoreBreakdown;
};

export type LeaderboardCategory = "xp" | "season" | "km" | "workouts" | "streak";

type ProfileLeaderboardRow = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_id: string | null;
  rank: string | null;
  current_level: number | null;
  total_xp: number | null;
};

const EMPTY_SEASON_BREAKDOWN: SeasonScoreBreakdown = {
  points: 0,
  runs: 0,
  workouts: 0,
  km: 0,
  activeDays: 0,
  hybridDays: 0,
};

function toLeaderboardEntry(profile: ProfileLeaderboardRow): LeaderboardEntry {
  return {
    userId: profile.user_id,
    username: profile.username,
    displayName: profile.display_name,
    avatarId: profile.avatar_id,
    rank: profile.rank ?? "rookie",
    currentLevel: profile.current_level ?? 1,
    totalXp: profile.total_xp ?? 0,
    weeklyKm: 0,
    weeklyWorkouts: 0,
    weeklyScore: 0,
    currentStreak: 0,
    seasonPoints: 0,
    seasonBreakdown: EMPTY_SEASON_BREAKDOWN,
  };
}

async function withSeasonScores(
  supabase: SupabaseClient,
  entries: LeaderboardEntry[],
  season: Season | null = null
): Promise<LeaderboardEntry[]> {
  if (!season || entries.length === 0) return entries;

  const userIds = entries.map((entry) => entry.userId);
  const window = getSeasonDateWindow(season);

  const [runsResult, workoutsResult] = await Promise.all([
    supabase
      .from("runs")
      .select("user_id, distance, created_at")
      .in("user_id", userIds)
      .gte("created_at", window.start)
      .lte("created_at", window.end),
    supabase
      .from("workouts")
      .select("user_id, duration_minutes, created_at")
      .in("user_id", userIds)
      .gte("created_at", window.start)
      .lte("created_at", window.end),
  ]);

  const missingWorkouts =
    workoutsResult.error &&
    (workoutsResult.error.code === "42P01" ||
      workoutsResult.error.message?.toLowerCase().includes("workouts"));

  const seasonScores = calculateSeasonScores(
    season,
    (runsResult.data ?? []) as SeasonActivityRun[],
    missingWorkouts ? [] : ((workoutsResult.data ?? []) as SeasonActivityWorkout[])
  );

  return entries.map((entry) => {
    const seasonBreakdown = seasonScores[entry.userId] ?? EMPTY_SEASON_BREAKDOWN;
    return {
      ...entry,
      seasonPoints: seasonBreakdown.points,
      seasonBreakdown,
    };
  });
}

async function withCustomAvatarDefinitions(
  supabase: SupabaseClient,
  entries: LeaderboardEntry[]
): Promise<LeaderboardEntry[]> {
  const customIds = entries
    .map((entry) => entry.avatarId)
    .filter((id): id is string => Boolean(id?.startsWith("custom-")));

  if (customIds.length === 0) return entries;

  const { data } = await supabase
    .from("custom_avatars")
    .select("id,name,type,category,label,description,primary_color,accent_color,secondary_color,background_color,outfit_color,hair_style,hair_color,face_style,accessory,glow_color,rarity,gender,unlock_kind,unlock_label,female,exclusive,trophy_id,assigned_to,is_active,metadata,created_at,updated_at")
    .in("id", customIds)
    .eq("is_active", true);

  const definitions = new Map(
    ((data ?? []) as CustomAvatarRow[]).map((row) => [row.id, customAvatarRowToDefinition(row)])
  );

  return entries.map((entry) => ({
    ...entry,
    avatarDefinition: entry.avatarId ? definitions.get(entry.avatarId) ?? null : null,
  }));
}

/**
 * Main leaderboard: read-only and ranked only by profiles.total_xp.
 * Extra fields remain in the shape so the UI/API can grow back categories later.
 */
export async function getGlobalLeaderboard(
  supabase: SupabaseClient,
  _category: LeaderboardCategory = "xp",
  activeSeason: Season | null = null
): Promise<LeaderboardEntry[]> {
  void _category;

  const { data } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, avatar_id, rank, current_level, total_xp")
    .order("total_xp", { ascending: false })
    .limit(50);

  const entries = await withSeasonScores(supabase, ((data ?? []) as ProfileLeaderboardRow[]).map(toLeaderboardEntry), activeSeason);
  return withCustomAvatarDefinitions(supabase, entries);
}

/**
 * Friends leaderboard: same XP-only contract, scoped to followed users + self.
 */
export async function getFriendsLeaderboard(
  supabase: SupabaseClient,
  userId: string,
  _category: LeaderboardCategory = "xp",
  activeSeason: Season | null = null
): Promise<LeaderboardEntry[]> {
  void _category;

  const { data: followData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const friendIds = [userId, ...((followData ?? []) as { following_id: string }[]).map((f) => f.following_id)];

  const { data } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, avatar_id, rank, current_level, total_xp")
    .in("user_id", friendIds)
    .order("total_xp", { ascending: false })
    .limit(50);

  const entries = await withSeasonScores(supabase, ((data ?? []) as ProfileLeaderboardRow[]).map(toLeaderboardEntry), activeSeason);
  return withCustomAvatarDefinitions(supabase, entries);
}
