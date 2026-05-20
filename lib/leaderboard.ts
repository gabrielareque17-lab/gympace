import type { SupabaseClient } from "@supabase/supabase-js";

import { getLocalDateKey } from "@/lib/date-utils";

export type LeaderboardEntry = {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarId: string | null;
  rank: string | null;
  currentLevel: number;
  totalXp: number;
  weeklyKm: number;
  weeklyWorkouts: number;
  weeklyScore: number;
  currentStreak: number;
};

export type LeaderboardCategory = "xp" | "km" | "workouts" | "streak";

function currentWeekStartKey(): string {
  const todayKey = getLocalDateKey(new Date());
  const today = new Date(`${todayKey}T12:00:00`);
  const day = today.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diff);
  return getLocalDateKey(monday);
}

function weekStartQuerySince(): string {
  const mondayNoon = new Date(`${currentWeekStartKey()}T12:00:00`);
  return new Date(mondayNoon.getTime() - 36 * 60 * 60 * 1000).toISOString();
}

/**
 * Returns top 50 users for the global leaderboard.
 * Pulls profile data + this-week activity from runs/workouts.
 */
export async function getGlobalLeaderboard(
  supabase: SupabaseClient,
  category: LeaderboardCategory = "xp"
): Promise<LeaderboardEntry[]> {
  const since = weekStartQuerySince();
  const sinceKey = currentWeekStartKey();

  const [profilesRes, runsRes, workoutsRes, streaksRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_id, rank, current_level, total_xp")
      .order("total_xp", { ascending: false })
      .limit(200),
    supabase
      .from("runs")
      .select("user_id, distance, created_at")
      .gte("created_at", since),
    supabase
      .from("workouts")
      .select("user_id, created_at")
      .gte("created_at", since),
    supabase
      .from("streaks")
      .select("user_id, current_streak")
      .eq("streak_type", "general"),
  ]);

  const profiles = (profilesRes.data ?? []) as {
    user_id: string;
    username: string | null;
    display_name: string | null;
    avatar_id: string | null;
    rank: string | null;
    current_level: number | null;
    total_xp: number | null;
  }[];

  // Aggregate weekly km per user
  const weeklyKmMap: Record<string, number> = {};
  for (const r of (runsRes.data ?? []) as { user_id: string; distance: number | null; created_at: string }[]) {
    if (getLocalDateKey(r.created_at) < sinceKey) continue;
    weeklyKmMap[r.user_id] = (weeklyKmMap[r.user_id] ?? 0) + Number(r.distance ?? 0);
  }

  // Aggregate weekly workout count
  const weeklyWorkoutMap: Record<string, number> = {};
  for (const w of (workoutsRes.data ?? []) as { user_id: string; created_at: string }[]) {
    if (getLocalDateKey(w.created_at) < sinceKey) continue;
    weeklyWorkoutMap[w.user_id] = (weeklyWorkoutMap[w.user_id] ?? 0) + 1;
  }

  // Streak map
  const streakMap: Record<string, number> = {};
  for (const s of (streaksRes.data ?? []) as { user_id: string; current_streak: number | null }[]) {
    streakMap[s.user_id] = s.current_streak ?? 0;
  }

  const entries: LeaderboardEntry[] = profiles.map((p) => {
    const km = Math.round((weeklyKmMap[p.user_id] ?? 0) * 10) / 10;
    const workouts = weeklyWorkoutMap[p.user_id] ?? 0;
    return {
      userId: p.user_id,
      username: p.username,
      displayName: p.display_name,
      avatarId: p.avatar_id,
      rank: p.rank ?? "rookie",
      currentLevel: p.current_level ?? 1,
      totalXp: p.total_xp ?? 0,
      weeklyKm: km,
      weeklyWorkouts: workouts,
      weeklyScore: Math.round(km * 10 + workouts * 8),
      currentStreak: streakMap[p.user_id] ?? 0,
    };
  });

  const sorters: Record<LeaderboardCategory, (a: LeaderboardEntry, b: LeaderboardEntry) => number> = {
    xp:       (a, b) => b.totalXp - a.totalXp,
    km:       (a, b) => b.weeklyKm - a.weeklyKm,
    workouts: (a, b) => b.weeklyWorkouts - a.weeklyWorkouts,
    streak:   (a, b) => b.currentStreak - a.currentStreak,
  };

  // For weekly categories only include users with activity this week
  const filtered = category === "xp" || category === "streak"
    ? entries
    : entries.filter((e) => (category === "km" ? e.weeklyKm > 0 : e.weeklyWorkouts > 0));

  return filtered.sort(sorters[category]).slice(0, 50);
}

/**
 * Returns leaderboard filtered to users that `userId` follows (+ themselves).
 */
export async function getFriendsLeaderboard(
  supabase: SupabaseClient,
  userId: string,
  category: LeaderboardCategory = "xp"
): Promise<LeaderboardEntry[]> {
  const { data: followData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const friendIds = [userId, ...((followData ?? []) as { following_id: string }[]).map((f) => f.following_id)];

  const since = weekStartQuerySince();
  const sinceKey = currentWeekStartKey();

  const [profilesRes, runsRes, workoutsRes, streaksRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_id, rank, current_level, total_xp")
      .in("user_id", friendIds),
    supabase
      .from("runs")
      .select("user_id, distance, created_at")
      .in("user_id", friendIds)
      .gte("created_at", since),
    supabase
      .from("workouts")
      .select("user_id, created_at")
      .in("user_id", friendIds)
      .gte("created_at", since),
    supabase
      .from("streaks")
      .select("user_id, current_streak")
      .in("user_id", friendIds)
      .eq("streak_type", "general"),
  ]);

  const profiles = (profilesRes.data ?? []) as {
    user_id: string;
    username: string | null;
    display_name: string | null;
    avatar_id: string | null;
    rank: string | null;
    current_level: number | null;
    total_xp: number | null;
  }[];

  const weeklyKmMap: Record<string, number> = {};
  for (const r of (runsRes.data ?? []) as { user_id: string; distance: number | null; created_at: string }[]) {
    if (getLocalDateKey(r.created_at) < sinceKey) continue;
    weeklyKmMap[r.user_id] = (weeklyKmMap[r.user_id] ?? 0) + Number(r.distance ?? 0);
  }
  const weeklyWorkoutMap: Record<string, number> = {};
  for (const w of (workoutsRes.data ?? []) as { user_id: string; created_at: string }[]) {
    if (getLocalDateKey(w.created_at) < sinceKey) continue;
    weeklyWorkoutMap[w.user_id] = (weeklyWorkoutMap[w.user_id] ?? 0) + 1;
  }
  const streakMap: Record<string, number> = {};
  for (const s of (streaksRes.data ?? []) as { user_id: string; current_streak: number | null }[]) {
    streakMap[s.user_id] = s.current_streak ?? 0;
  }

  const entries: LeaderboardEntry[] = profiles.map((p) => {
    const km = Math.round((weeklyKmMap[p.user_id] ?? 0) * 10) / 10;
    const workouts = weeklyWorkoutMap[p.user_id] ?? 0;
    return {
      userId: p.user_id,
      username: p.username,
      displayName: p.display_name,
      avatarId: p.avatar_id,
      rank: p.rank ?? "rookie",
      currentLevel: p.current_level ?? 1,
      totalXp: p.total_xp ?? 0,
      weeklyKm: km,
      weeklyWorkouts: workouts,
      weeklyScore: Math.round(km * 10 + workouts * 8),
      currentStreak: streakMap[p.user_id] ?? 0,
    };
  });

  const sorters: Record<LeaderboardCategory, (a: LeaderboardEntry, b: LeaderboardEntry) => number> = {
    xp:       (a, b) => b.totalXp - a.totalXp,
    km:       (a, b) => b.weeklyKm - a.weeklyKm,
    workouts: (a, b) => b.weeklyWorkouts - a.weeklyWorkouts,
    streak:   (a, b) => b.currentStreak - a.currentStreak,
  };

  return entries.sort(sorters[category]).slice(0, 50);
}
