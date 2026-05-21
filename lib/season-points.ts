import { getLocalDateKey } from "@/lib/date-utils";
import type { Season } from "@/lib/seasons";

export const SEASON_POINT_RULES = {
  runBase: 10,
  runPerKm: 3,
  longRunBonusKm: 10,
  longRunBonus: 10,
  workoutBase: 12,
  workoutPer15Minutes: 2,
  longWorkoutBonusMinutes: 60,
  longWorkoutBonus: 8,
  activeDayBonus: 5,
  hybridDayBonus: 15,
} as const;

export type SeasonActivityRun = {
  user_id: string;
  distance: number | null;
  created_at: string;
};

export type SeasonActivityWorkout = {
  user_id: string;
  duration_minutes: number | null;
  created_at: string;
};

export type SeasonScoreBreakdown = {
  points: number;
  runs: number;
  workouts: number;
  km: number;
  activeDays: number;
  hybridDays: number;
};

export function getSeasonDateWindow(season: Season) {
  return {
    start: `${season.startDate}T00:00:00.000-04:00`,
    end: `${season.endDate}T23:59:59.999-04:00`,
  };
}

function isInsideSeason(date: string, season: Season) {
  const key = getLocalDateKey(date);
  return key >= season.startDate && key <= season.endDate;
}

function emptyBreakdown(): SeasonScoreBreakdown {
  return {
    points: 0,
    runs: 0,
    workouts: 0,
    km: 0,
    activeDays: 0,
    hybridDays: 0,
  };
}

export function calculateSeasonScores(
  season: Season | null,
  runs: SeasonActivityRun[],
  workouts: SeasonActivityWorkout[]
): Record<string, SeasonScoreBreakdown> {
  if (!season) return {};

  const scores: Record<string, SeasonScoreBreakdown> = {};
  const runDays: Record<string, Set<string>> = {};
  const workoutDays: Record<string, Set<string>> = {};

  function getScore(userId: string) {
    scores[userId] ??= emptyBreakdown();
    return scores[userId];
  }

  for (const run of runs) {
    if (!isInsideSeason(run.created_at, season)) continue;

    const score = getScore(run.user_id);
    const distance = Number(run.distance ?? 0);
    const day = getLocalDateKey(run.created_at);

    score.runs += 1;
    score.km += distance;
    score.points += SEASON_POINT_RULES.runBase;
    score.points += Math.round(distance * SEASON_POINT_RULES.runPerKm);
    if (distance >= SEASON_POINT_RULES.longRunBonusKm) {
      score.points += SEASON_POINT_RULES.longRunBonus;
    }

    runDays[run.user_id] ??= new Set<string>();
    runDays[run.user_id].add(day);
  }

  for (const workout of workouts) {
    if (!isInsideSeason(workout.created_at, season)) continue;

    const score = getScore(workout.user_id);
    const duration = Number(workout.duration_minutes ?? 0);
    const day = getLocalDateKey(workout.created_at);

    score.workouts += 1;
    score.points += SEASON_POINT_RULES.workoutBase;
    score.points += Math.floor(duration / 15) * SEASON_POINT_RULES.workoutPer15Minutes;
    if (duration >= SEASON_POINT_RULES.longWorkoutBonusMinutes) {
      score.points += SEASON_POINT_RULES.longWorkoutBonus;
    }

    workoutDays[workout.user_id] ??= new Set<string>();
    workoutDays[workout.user_id].add(day);
  }

  for (const userId of Object.keys(scores)) {
    const activeDays = new Set<string>([
      ...(runDays[userId] ?? []),
      ...(workoutDays[userId] ?? []),
    ]);
    const hybridDays = [...(runDays[userId] ?? [])].filter((day) => workoutDays[userId]?.has(day));

    scores[userId].km = Math.round(scores[userId].km * 10) / 10;
    scores[userId].activeDays = activeDays.size;
    scores[userId].hybridDays = hybridDays.length;
    scores[userId].points += activeDays.size * SEASON_POINT_RULES.activeDayBonus;
    scores[userId].points += hybridDays.length * SEASON_POINT_RULES.hybridDayBonus;
  }

  return scores;
}
