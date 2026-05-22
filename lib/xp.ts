import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ACHIEVEMENT_REGISTRY,
  type AchievementStats,
} from "@/lib/achievements";
import { calculateLongestActivityStreak } from "@/lib/competition-progress";
import { getLocalDateKey } from "@/lib/date-utils";
import { normalizeMuscleGroups } from "@/lib/muscles";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export type XPRank = "rookie" | "bronze" | "silver" | "gold" | "platinum" | "elite";

export type XPFeedback = {
  previousXp: number;
  totalXp: number;
  netXpDelta: number;
  gainedXp: number;
  previousLevel: number;
  currentLevel: number;
  leveledUp: boolean;
  rank: XPRank;
  levelProgress: number;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
  xpRemainingForNextLevel: number;
  currentLevelXp: number;
  nextLevelXp: number | null;
  nextLevels: XPLevelMilestone[];
};

export type XPLevelMilestone = {
  level: number;
  totalXpRequired: number;
  xpFromPreviousLevel: number;
  xpRemaining: number;
  rank: XPRank;
};

export type AwardXPSource =
  | "run"
  | "workout"
  | "challenge"
  | "competition"
  | "streak"
  | "hybrid_bonus"
  | "season"
  | "trophy"
  | "manual";

export type AwardXPInput = {
  userId: string;
  source: AwardXPSource;
  sourceId?: string;
  reason?: string;
};

type RunRow = {
  distance: number | null;
  pace: string | null;
  created_at: string;
};

type WorkoutRow = {
  muscle_group: string | null;
  muscle_groups: string[] | null;
  duration_minutes: number | null;
  created_at: string;
};

type CompetitionParticipantRow = {
  progress: number | null;
  competitions: {
    type: string | null;
    end_date: string | null;
  } | null;
};

export const XP_RULES = {
  levelBaseXp: 150,
  levelGrowth: 1.16,
  runBaseXp: 20,
  runXpPerKm: 6,
  workoutBaseXp: 30,
  workoutDurationXpPerMinute: 0.3,
  workoutDurationXpCap: 30,
  streakXpPerDay: 8,
  competitionBaseXp: 40,
  competitionProgressXp: 2,
  competitionFinishBonusXp: 60,
} as const;

const ACHIEVEMENT_XP_BY_RARITY = {
  comum: 60,
  raro: 100,
  epico: 160,
  lendario: 260,
} as const;

export async function syncUserXP(
  supabase: SupabaseClient,
  userId: string
): Promise<XPFeedback> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp, current_level, level, rank")
    .eq("user_id", userId)
    .maybeSingle();

  const previousXp = Number(profile?.total_xp ?? 0);
  const previousLevel = Number(profile?.current_level ?? profile?.level ?? 1);
  const totalXp = await calculateTotalXPForUser(supabase, userId);
  const currentLevel = calculateLevelFromXP(totalXp);
  const rank = getRankForLevel(currentLevel);
  const levelState = getLevelProgress(totalXp);

  const adminSupabase = createSupabaseAdminClient();
  const { error } = await adminSupabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        total_xp: totalXp,
        current_level: currentLevel,
        level: currentLevel,
        rank,
      },
      { onConflict: "user_id" }
    );

  if (error) console.error("[xp] profile upsert error:", error.code, error.message, error.details);

  return {
    previousXp,
    totalXp,
    netXpDelta: totalXp - previousXp,
    gainedXp: Math.max(totalXp - previousXp, 0),
    previousLevel,
    currentLevel,
    leveledUp: currentLevel > previousLevel,
    rank,
    ...levelState,
  };
}

/**
 * Central XP engine.
 * Today XP is derived from persisted activity state to avoid duplicate awards.
 * This wrapper is the single integration point for all flows that can affect XP.
 */
export async function awardXP(
  supabase: SupabaseClient,
  input: AwardXPInput
): Promise<XPFeedback> {
  const feedback = await syncUserXP(supabase, input.userId);
  const adminSupabase = createSupabaseAdminClient();

  if (feedback.netXpDelta !== 0 || feedback.leveledUp) {
    console.info("[xp] awarded", {
      userId: input.userId,
      source: input.source,
      sourceId: input.sourceId,
      gainedXp: feedback.gainedXp,
      totalXp: feedback.totalXp,
      level: feedback.currentLevel,
    });
    await adminSupabase.from("admin_events").insert({
      admin_id: null,
      event_type: "xp_awarded",
      target_user_id: input.userId,
      payload: {
        source: input.source,
        source_id: input.sourceId ?? null,
        reason: input.reason ?? null,
        net_xp_delta: feedback.netXpDelta,
        gained_xp: feedback.gainedXp,
        total_xp: feedback.totalXp,
        current_level: feedback.currentLevel,
      },
    });
  }

  return feedback;
}

export async function calculateTotalXPForUser(
  supabase: SupabaseClient,
  userId: string
) {
  const [runs, workouts, participants] = await Promise.all([
    fetchRuns(supabase, userId),
    fetchWorkouts(supabase, userId),
    fetchCompetitionParticipants(supabase, userId),
  ]);

  const stats = buildAchievementStats(runs, workouts);
  const achievementXp = ACHIEVEMENT_REGISTRY.reduce(
    (sum, achievement) =>
      achievement.check(stats)
        ? sum + ACHIEVEMENT_XP_BY_RARITY[achievement.rarity]
        : sum,
    0
  );

  const runXp = runs.reduce(
    (sum, run) => sum + XP_RULES.runBaseXp + Math.round(Number(run.distance ?? 0) * XP_RULES.runXpPerKm),
    0
  );
  const workoutXp = workouts.reduce(
    (sum, workout) =>
      sum +
      XP_RULES.workoutBaseXp +
      Math.min(
        Math.round(Number(workout.duration_minutes ?? 0) * XP_RULES.workoutDurationXpPerMinute),
        XP_RULES.workoutDurationXpCap
      ),
    0
  );
  const streakXp = Math.max(stats.currentStreak, stats.gymStreak) * XP_RULES.streakXpPerDay;
  const competitionXp = participants.reduce((sum, participant) => {
    const progress = Number(participant.progress ?? 0);
    const isEnded = participant.competitions?.end_date
      ? new Date(participant.competitions.end_date) < new Date()
      : false;

    return (
      sum +
      XP_RULES.competitionBaseXp +
      Math.round(progress * XP_RULES.competitionProgressXp) +
      (isEnded ? XP_RULES.competitionFinishBonusXp : 0)
    );
  }, 0);

  return runXp + workoutXp + streakXp + achievementXp + competitionXp;
}

export function calculateLevelFromXP(totalXp: number) {
  let level = 1;

  while (totalXp >= getXPRequiredForLevel(level + 1)) {
    level += 1;
  }

  return level;
}

export function getLevelProgress(totalXp: number) {
  const currentLevel = calculateLevelFromXP(totalXp);
  const currentThreshold = getXPRequiredForLevel(currentLevel);
  const nextThreshold = getXPRequiredForLevel(currentLevel + 1);
  const span = nextThreshold - currentThreshold;
  const xpIntoLevel = Math.max(totalXp - currentThreshold, 0);
  const xpRemainingForNextLevel = Math.max(nextThreshold - totalXp, 0);

  return {
    levelProgress: Math.min(Math.round((xpIntoLevel / span) * 100), 100),
    xpIntoLevel,
    xpForNextLevel: span,
    xpRemainingForNextLevel,
    currentLevelXp: currentThreshold,
    nextLevelXp: nextThreshold,
    nextLevels: getUpcomingLevelMilestones(totalXp, 5),
  };
}

export function getRankForLevel(level: number): XPRank {
  if (level >= 30) return "elite";
  if (level >= 22) return "platinum";
  if (level >= 15) return "gold";
  if (level >= 8) return "silver";
  if (level >= 3) return "bronze";
  return "rookie";
}

export function getXPRequiredForLevel(level: number) {
  if (level <= 1) return 0;

  let total = 0;
  for (let current = 2; current <= level; current += 1) {
    total += Math.round(XP_RULES.levelBaseXp * Math.pow(XP_RULES.levelGrowth, current - 2));
  }

  return total;
}

export function getUpcomingLevelMilestones(totalXp: number, count = 5): XPLevelMilestone[] {
  const currentLevel = calculateLevelFromXP(totalXp);

  return Array.from({ length: count }, (_, index) => {
    const level = currentLevel + index + 1;
    const totalXpRequired = getXPRequiredForLevel(level);
    const previousLevelXp = getXPRequiredForLevel(level - 1);

    return {
      level,
      totalXpRequired,
      xpFromPreviousLevel: totalXpRequired - previousLevelXp,
      xpRemaining: Math.max(totalXpRequired - totalXp, 0),
      rank: getRankForLevel(level),
    };
  });
}

function buildAchievementStats(
  runs: RunRow[],
  workouts: WorkoutRow[]
): AchievementStats {
  const totalKm = runs.reduce((sum, run) => sum + Number(run.distance ?? 0), 0);
  const longestRun = runs.reduce(
    (max, run) => Math.max(max, Number(run.distance ?? 0)),
    0
  );
  const paces = runs
    .map((run) => paceToSeconds(run.pace))
    .filter((pace): pace is number => pace !== null);
  const gymDates = workouts.map((workout) => workout.created_at);

  return {
    totalRuns: runs.length,
    totalKm,
    longestRun,
    currentStreak: calculateLongestActivityStreak(runs.map((run) => run.created_at)),
    bestPaceSeconds: paces.length > 0 ? Math.min(...paces) : null,
    gymTotalSessions: workouts.length,
    gymChestSessions: workouts.filter((w) => {
      const keys = normalizeMuscleGroups(w.muscle_groups?.length ? w.muscle_groups : (w.muscle_group ? [w.muscle_group] : []));
      return keys.includes("peito");
    }).length,
    gymLegSessions: workouts.filter((w) => {
      const keys = normalizeMuscleGroups(w.muscle_groups?.length ? w.muscle_groups : (w.muscle_group ? [w.muscle_group] : []));
      return keys.some((key) => ["quadriceps", "posterior-coxa", "gluteos", "panturrilhas"].includes(key));
    }).length,
    gymStreak: calculateLongestActivityStreak(gymDates),
    gymHasPersonalRecord: false,
    hasPerfectWeek: hasFiveSessionsInAWeek(workouts),
  };
}

async function fetchRuns(supabase: SupabaseClient, userId: string): Promise<RunRow[]> {
  const { data, error } = await supabase
    .from("runs")
    .select("distance, pace, created_at")
    .eq("user_id", userId);

  if (error) {
    const missing = error.code === "42P01" || error.message?.toLowerCase().includes("runs");
    if (missing) return [];
    console.error("[xp] fetchRuns error:", error.code, error.message);
    return [];
  }
  return (data ?? []) as RunRow[];
}

async function fetchWorkouts(
  supabase: SupabaseClient,
  userId: string
): Promise<WorkoutRow[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("muscle_group, muscle_groups, duration_minutes, created_at")
    .eq("user_id", userId);

  if (error) {
    const missingTable = error.code === "42P01" || error.message.toLowerCase().includes("workouts");
    if (missingTable) return [];
    throw error;
  }

  return (data ?? []) as WorkoutRow[];
}

async function fetchCompetitionParticipants(
  supabase: SupabaseClient,
  userId: string
): Promise<CompetitionParticipantRow[]> {
  const { data, error } = await supabase
    .from("competition_participants")
    .select("progress, competitions(type, end_date)")
    .eq("user_id", userId);

  if (error) {
    const missing = error.code === "42P01" || error.message?.toLowerCase().includes("competition_participants");
    if (missing) return [];
    console.error("[xp] fetchCompetitionParticipants error:", error.code, error.message);
    return [];
  }

  return ((data ?? []) as unknown as CompetitionParticipantRow[]).map((row) => ({
    ...row,
    competitions: Array.isArray(row.competitions)
      ? row.competitions[0] ?? null
      : row.competitions,
  }));
}

function paceToSeconds(pace: string | null) {
  if (!pace) return null;
  const [minutes, seconds] = pace.split(":").map(Number);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
  return minutes * 60 + seconds;
}

function hasFiveSessionsInAWeek(workouts: WorkoutRow[]) {
  const weeks: Record<string, Set<string>> = {};

  for (const workout of workouts) {
    const dayKey = getLocalDateKey(workout.created_at);
    const date = new Date(`${dayKey}T12:00:00`);

    const weekKey = `${date.getFullYear()}-${getWeekNumber(date)}`;
    weeks[weekKey] ??= new Set();
    weeks[weekKey].add(dayKey);
  }

  return Object.values(weeks).some((days) => days.size >= 5);
}

function getWeekNumber(date: Date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() + 4 - day);
  const yearStart = new Date(copy.getFullYear(), 0, 1, 12);
  return Math.ceil(((copy.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}
