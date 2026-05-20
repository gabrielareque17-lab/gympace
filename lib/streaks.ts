import type { SupabaseClient } from "@supabase/supabase-js";

export type StreakType = "run" | "gym" | "hybrid" | "general";

export type StreakData = {
  streakType: StreakType;
  currentStreak: number;
  bestStreak: number;
  lastActivityDate: string | null;
};

export type UserStreaks = {
  run: StreakData;
  gym: StreakData;
  hybrid: StreakData;
  general: StreakData;
};

/** Consecutive days ending on today or yesterday */
function computeCurrentStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const unique = [...new Set(dates.map((d) => d.slice(0, 10)))].sort().reverse();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  const yestStr = yest.toISOString().slice(0, 10);

  if (unique[0] !== todayStr && unique[0] !== yestStr) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(`${unique[i - 1]}T00:00:00Z`);
    const curr = new Date(`${unique[i]}T00:00:00Z`);
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

/** Longest historical consecutive-day streak */
function computeBestStreak(dates: string[]): number {
  const days = [...new Set(dates.map((d) => d.slice(0, 10)))].sort();
  if (days.length === 0) return 0;

  let best = 1;
  let current = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(`${days[i - 1]}T00:00:00`);
    const next = new Date(`${days[i]}T00:00:00`);
    const diff = Math.round((next.getTime() - prev.getTime()) / 86_400_000);
    current = diff === 1 ? current + 1 : 1;
    best = Math.max(best, current);
  }
  return best;
}

/**
 * Re-calculate streaks from raw activity data and upsert to the `streaks` table.
 * Returns the computed streak values for immediate use (e.g. feed events).
 */
export async function syncStreaksForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<UserStreaks> {
  const [runsRes, workoutsRes] = await Promise.all([
    supabase.from("runs").select("created_at").eq("user_id", userId),
    supabase.from("workouts").select("created_at").eq("user_id", userId),
  ]);

  const runDates: string[] = (runsRes.data ?? []).map((r: { created_at: string }) => r.created_at);
  const gymDates: string[] = (workoutsRes.data ?? []).map((w: { created_at: string }) => w.created_at);

  const runDaySet = new Set(runDates.map((d) => d.slice(0, 10)));
  const gymDaySet = new Set(gymDates.map((d) => d.slice(0, 10)));

  // Hybrid: days where the user did BOTH a run AND a workout
  const hybridDateStrs = [...runDaySet].filter((d) => gymDaySet.has(d));
  // General: any activity day
  const allDateStrs = [...new Set([...runDates.map((d) => d.slice(0, 10)), ...gymDates.map((d) => d.slice(0, 10))])];

  const latest = (arr: string[]) =>
    arr.length > 0 ? [...arr].sort().reverse()[0] : null;

  const result: UserStreaks = {
    run: {
      streakType: "run",
      currentStreak: computeCurrentStreak(runDates),
      bestStreak: computeBestStreak(runDates),
      lastActivityDate: latest(runDates.map((d) => d.slice(0, 10))),
    },
    gym: {
      streakType: "gym",
      currentStreak: computeCurrentStreak(gymDates),
      bestStreak: computeBestStreak(gymDates),
      lastActivityDate: latest(gymDates.map((d) => d.slice(0, 10))),
    },
    hybrid: {
      streakType: "hybrid",
      currentStreak: computeCurrentStreak(hybridDateStrs),
      bestStreak: computeBestStreak(hybridDateStrs),
      lastActivityDate: latest(hybridDateStrs),
    },
    general: {
      streakType: "general",
      currentStreak: computeCurrentStreak(allDateStrs),
      bestStreak: computeBestStreak(allDateStrs),
      lastActivityDate: latest(allDateStrs),
    },
  };

  const rows = Object.values(result).map((s) => ({
    user_id: userId,
    streak_type: s.streakType,
    current_streak: s.currentStreak,
    best_streak: s.bestStreak,
    last_activity_date: s.lastActivityDate,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("streaks")
    .upsert(rows, { onConflict: "user_id,streak_type" });

  if (error) console.error("[streaks] upsert error:", error.code, error.message);

  return result;
}

/** Read from the cached `streaks` table (fast path). Falls back to zeros. */
export async function getUserStreaks(
  supabase: SupabaseClient,
  userId: string
): Promise<UserStreaks> {
  const { data } = await supabase
    .from("streaks")
    .select("streak_type, current_streak, best_streak, last_activity_date")
    .eq("user_id", userId);

  const empty = (type: StreakType): StreakData => ({
    streakType: type,
    currentStreak: 0,
    bestStreak: 0,
    lastActivityDate: null,
  });

  const out: UserStreaks = {
    run: empty("run"),
    gym: empty("gym"),
    hybrid: empty("hybrid"),
    general: empty("general"),
  };

  for (const row of data ?? []) {
    const t = row.streak_type as StreakType;
    if (out[t]) {
      out[t] = {
        streakType: t,
        currentStreak: row.current_streak ?? 0,
        bestStreak: row.best_streak ?? 0,
        lastActivityDate: row.last_activity_date ?? null,
      };
    }
  }

  return out;
}

/** Returns true if the user completed BOTH a run AND a workout today. */
export async function checkHybridBonusToday(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [runsRes, workoutsRes] = await Promise.all([
    supabase
      .from("runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", `${todayStr}T00:00:00.000Z`)
      .lt("created_at", `${todayStr}T23:59:59.999Z`),
    supabase
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", `${todayStr}T00:00:00.000Z`)
      .lt("created_at", `${todayStr}T23:59:59.999Z`),
  ]);

  return (runsRes.count ?? 0) > 0 && (workoutsRes.count ?? 0) > 0;
}

/** Milestone streak values that trigger feed events */
export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365];

export function getNewMilestone(prev: number, next: number): number | null {
  return STREAK_MILESTONES.find((m) => prev < m && next >= m) ?? null;
}
