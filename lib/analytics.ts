// ─── Types ────────────────────────────────────────────────────────────────────
import { getMuscleGroupLabel, normalizeMuscleGroups } from "@/lib/muscles";

export type WeeklyVolumePoint = { label: string; km: number; runs: number };

export type PaceTrendPoint = {
  label: string;
  avgPaceSeconds: number | null;
  bestPaceSeconds: number | null;
};

export type HeatmapDay = {
  date: string;
  hasRun: boolean;
  hasWorkout: boolean;
  level: 0 | 1 | 2 | 3;
};

export type WorkoutGroup = {
  key: string;
  label: string;
  sessions: number;
  minutes: number;
};

export type WeeklyWorkoutPoint = { label: string; minutes: number; sessions: number };

export type PerformanceScoreData = {
  overall: number;
  consistency: number;
  volume: number;
  streak: number;
  level: number;
};

export type AnalyticsSummary = {
  totalKm: number;
  totalRuns: number;
  totalWorkouts: number;
  bestPaceSeconds: number | null;
  currentStreak: number;
  avgWeeklyKm: number;
};

export type ProfileInfo = { totalXp: number; currentLevel: number; rank: string };

export type AnalyticsData = {
  weeklyVolume: WeeklyVolumePoint[];
  paceTrends: PaceTrendPoint[];
  heatmap: HeatmapDay[];
  workoutGroups: WorkoutGroup[];
  weeklyWorkoutMinutes: WeeklyWorkoutPoint[];
  performanceScore: PerformanceScoreData;
  summary: AnalyticsSummary;
  profile: ProfileInfo;
};

// ─── Raw DB row types ─────────────────────────────────────────────────────────

export type RunRow = { distance: number | null; pace: string | null; created_at: string };
export type WorkoutRow = {
  muscle_group: string | null;
  muscle_groups: string[] | null;
  duration_minutes: number | null;
  created_at: string;
};
export type ProfileRow = {
  total_xp: number | null;
  current_level: number | null;
  rank: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

function paceToSeconds(pace: string | null): number | null {
  if (!pace) return null;
  const [m, s] = pace.split(":").map(Number);
  if (!Number.isFinite(m) || !Number.isFinite(s)) return null;
  return m * 60 + s;
}

function toDateKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function getWeekStart(base: Date, offsetWeeks: number): Date {
  const d = new Date(base);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calculateCurrentStreak(dates: string[]): number {
  const uniqueDays = [...new Set(dates.map(toDateKey))].sort().reverse();
  if (uniqueDays.length === 0) return 0;

  const today = toDateKey(new Date().toISOString());
  const yesterday = toDateKey(new Date(Date.now() - 86_400_000).toISOString());

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(`${uniqueDays[i - 1]}T00:00:00`);
    const curr = new Date(`${uniqueDays[i]}T00:00:00`);
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ─── Computation functions ────────────────────────────────────────────────────

function computeWeeklyVolume(runs: RunRow[]): WeeklyVolumePoint[] {
  const today = new Date();
  return Array.from({ length: 8 }, (_, i) => {
    const offset = -(7 - i);
    const weekStart = getWeekStart(today, offset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekRuns = runs.filter((r) => {
      const d = new Date(r.created_at);
      return d >= weekStart && d < weekEnd;
    });

    const km = weekRuns.reduce((sum, r) => sum + Number(r.distance ?? 0), 0);
    return {
      label: i === 7 ? "Atual" : `S-${7 - i}`,
      km: Math.round(km * 10) / 10,
      runs: weekRuns.length,
    };
  });
}

function computePaceTrends(runs: RunRow[]): PaceTrendPoint[] {
  const today = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const offset = -(5 - i);
    const monthStart = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + offset + 1, 1);

    const monthRuns = runs.filter((r) => {
      const d = new Date(r.created_at);
      return d >= monthStart && d < monthEnd;
    });

    const paces = monthRuns
      .map((r) => paceToSeconds(r.pace))
      .filter((p): p is number => p !== null);

    return {
      label: monthStart.toLocaleDateString("pt-BR", { month: "short" }),
      avgPaceSeconds: paces.length
        ? Math.round(paces.reduce((a, b) => a + b, 0) / paces.length)
        : null,
      bestPaceSeconds: paces.length ? Math.min(...paces) : null,
    };
  });
}

function computeHeatmap(runs: RunRow[], workouts: WorkoutRow[]): HeatmapDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const runDays = new Set(runs.map((r) => toDateKey(r.created_at)));
  const workoutDays = new Set(workouts.map((w) => toDateKey(w.created_at)));

  return Array.from({ length: 84 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (83 - i));
    const key = date.toISOString().slice(0, 10);

    const hasRun = runDays.has(key);
    const hasWorkout = workoutDays.has(key);
    const level = (hasRun && hasWorkout ? 3 : hasRun ? 2 : hasWorkout ? 1 : 0) as 0 | 1 | 2 | 3;

    return { date: key, hasRun, hasWorkout, level };
  });
}

function computeWorkoutGroups(workouts: WorkoutRow[]): WorkoutGroup[] {
  const groups: Record<string, { sessions: number; minutes: number }> = {};

  for (const w of workouts) {
    const keys = normalizeMuscleGroups(w.muscle_groups?.length ? w.muscle_groups : (w.muscle_group ? [w.muscle_group] : ["unknown"]));
    const mins = Number(w.duration_minutes ?? 0);
    for (const key of keys) {
      groups[key] ??= { sessions: 0, minutes: 0 };
      groups[key].sessions++;
      groups[key].minutes += mins;
    }
  }

  return Object.entries(groups)
    .map(([key, { sessions, minutes }]) => ({
      key,
      label: getMuscleGroupLabel(key),
      sessions,
      minutes,
    }))
    .sort((a, b) => b.sessions - a.sessions);
}

function computeWeeklyWorkoutMinutes(workouts: WorkoutRow[]): WeeklyWorkoutPoint[] {
  const today = new Date();
  return Array.from({ length: 8 }, (_, i) => {
    const offset = -(7 - i);
    const weekStart = getWeekStart(today, offset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekWorkouts = workouts.filter((w) => {
      const d = new Date(w.created_at);
      return d >= weekStart && d < weekEnd;
    });

    return {
      label: i === 7 ? "Atual" : `S-${7 - i}`,
      minutes: weekWorkouts.reduce((sum, w) => sum + Number(w.duration_minutes ?? 0), 0),
      sessions: weekWorkouts.length,
    };
  });
}

function computePerformanceScore(
  runs: RunRow[],
  workouts: WorkoutRow[],
  profile: ProfileRow | null
): PerformanceScoreData {
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 86_400_000);
  const eightWeeksAgo = new Date(now - 56 * 86_400_000);

  const activeDays = new Set([
    ...runs
      .filter((r) => new Date(r.created_at) >= thirtyDaysAgo)
      .map((r) => toDateKey(r.created_at)),
    ...workouts
      .filter((w) => new Date(w.created_at) >= thirtyDaysAgo)
      .map((w) => toDateKey(w.created_at)),
  ]);
  const consistency = Math.min(Math.round((activeDays.size / 30) * 100), 100);

  const recentKm = runs
    .filter((r) => new Date(r.created_at) >= eightWeeksAgo)
    .reduce((sum, r) => sum + Number(r.distance ?? 0), 0);
  const volume = Math.min(Math.round((recentKm / 8 / 50) * 100), 100);

  const allDates = [...runs.map((r) => r.created_at), ...workouts.map((w) => w.created_at)];
  const currentStreak = calculateCurrentStreak(allDates);
  const streak = Math.min(Math.round((currentStreak / 14) * 100), 100);

  const currentLevel = Number(profile?.current_level ?? 1);
  const levelScore = Math.min(Math.round((currentLevel / 30) * 100), 100);

  const overall = Math.round(consistency * 0.35 + volume * 0.25 + streak * 0.2 + levelScore * 0.2);

  return { overall, consistency, volume, streak, level: levelScore };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function computeAnalytics(
  runs: RunRow[],
  workouts: WorkoutRow[],
  profile: ProfileRow | null
): AnalyticsData {
  const totalKm = runs.reduce((sum, r) => sum + Number(r.distance ?? 0), 0);
  const paces = runs
    .map((r) => paceToSeconds(r.pace))
    .filter((p): p is number => p !== null);
  const bestPaceSeconds = paces.length ? Math.min(...paces) : null;

  const eightWeeksAgo = new Date(Date.now() - 56 * 86_400_000);
  const recentKm = runs
    .filter((r) => new Date(r.created_at) >= eightWeeksAgo)
    .reduce((sum, r) => sum + Number(r.distance ?? 0), 0);

  const allDates = [...runs.map((r) => r.created_at), ...workouts.map((w) => w.created_at)];
  const currentStreak = calculateCurrentStreak(allDates);

  return {
    weeklyVolume: computeWeeklyVolume(runs),
    paceTrends: computePaceTrends(runs),
    heatmap: computeHeatmap(runs, workouts),
    workoutGroups: computeWorkoutGroups(workouts),
    weeklyWorkoutMinutes: computeWeeklyWorkoutMinutes(workouts),
    performanceScore: computePerformanceScore(runs, workouts, profile),
    summary: {
      totalKm: Math.round(totalKm * 10) / 10,
      totalRuns: runs.length,
      totalWorkouts: workouts.length,
      bestPaceSeconds,
      currentStreak,
      avgWeeklyKm: Math.round((recentKm / 8) * 10) / 10,
    },
    profile: {
      totalXp: Number(profile?.total_xp ?? 0),
      currentLevel: Number(profile?.current_level ?? 1),
      rank: profile?.rank ?? "rookie",
    },
  };
}

export function buildEmptyAnalytics(): AnalyticsData {
  const today = new Date();
  return {
    weeklyVolume: Array.from({ length: 8 }, (_, i) => ({
      label: i === 7 ? "Atual" : `S-${7 - i}`,
      km: 0,
      runs: 0,
    })),
    paceTrends: Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
      return {
        label: d.toLocaleDateString("pt-BR", { month: "short" }),
        avgPaceSeconds: null,
        bestPaceSeconds: null,
      };
    }),
    heatmap: Array.from({ length: 84 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (83 - i));
      return {
        date: d.toISOString().slice(0, 10),
        hasRun: false,
        hasWorkout: false,
        level: 0 as const,
      };
    }),
    workoutGroups: [],
    weeklyWorkoutMinutes: Array.from({ length: 8 }, (_, i) => ({
      label: i === 7 ? "Atual" : `S-${7 - i}`,
      minutes: 0,
      sessions: 0,
    })),
    performanceScore: { overall: 0, consistency: 0, volume: 0, streak: 0, level: 0 },
    summary: {
      totalKm: 0,
      totalRuns: 0,
      totalWorkouts: 0,
      bestPaceSeconds: null,
      currentStreak: 0,
      avgWeeklyKm: 0,
    },
    profile: { totalXp: 0, currentLevel: 1, rank: "rookie" },
  };
}
