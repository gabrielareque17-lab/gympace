import type { AchievementCardData } from "@/components/profile/achievement-grid";
import { getLocalDateKey } from "@/lib/date-utils";

type Activity = {
  created_at: string;
};

type RunActivity = Activity & {
  distance: number;
  pace: string | null;
};

type WorkoutActivity = Activity & {
  muscle_group?: string | null;
  muscle_groups?: string[] | null;
};

type AchievementUnlockInputs = {
  runs: RunActivity[];
  workouts: WorkoutActivity[];
  achievements: AchievementCardData[];
  normalizeWorkoutGroups: (workout: WorkoutActivity) => string[];
};

function parsePaceToSeconds(value: string | null): number | null {
  if (!value) return null;
  const [min, sec] = value.split(":").map(Number);
  if (!isFinite(min) || !isFinite(sec)) return null;
  return min * 60 + sec;
}

function timeOf(activity: Activity): number {
  return new Date(activity.created_at).getTime();
}

function oldestDate(activities: Activity[]): string | undefined {
  return activities
    .filter((activity) => !Number.isNaN(timeOf(activity)))
    .sort((a, b) => timeOf(a) - timeOf(b))[0]?.created_at;
}

function firstRunMeeting(runs: RunActivity[], check: (run: RunActivity) => boolean): string | undefined {
  return oldestDate(runs.filter(check));
}

function firstWorkoutMeeting(
  workouts: WorkoutActivity[],
  check: (workout: WorkoutActivity) => boolean
): string | undefined {
  return oldestDate(workouts.filter(check));
}

function firstCumulativeRunDate(runs: RunActivity[], targetKm: number): string | undefined {
  let total = 0;
  for (const run of [...runs].sort((a, b) => timeOf(a) - timeOf(b))) {
    total += Number(run.distance ?? 0);
    if (total >= targetKm) return run.created_at;
  }
  return undefined;
}

function firstCumulativeWorkoutDate(workouts: WorkoutActivity[], targetSessions: number): string | undefined {
  const sorted = [...workouts].sort((a, b) => timeOf(a) - timeOf(b));
  return sorted[targetSessions - 1]?.created_at;
}

function firstPerfectWeekDate(workouts: WorkoutActivity[]): string | undefined {
  const weeks: Record<string, Activity[]> = {};

  for (const workout of workouts) {
    const dayKey = getLocalDateKey(workout.created_at);
    const date = new Date(`${dayKey}T12:00:00`);

    const day = date.getDay();
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));

    const key = getLocalDateKey(weekStart);
    weeks[key] ??= [];
    weeks[key].push(workout);
  }

  const unlockDates = Object.values(weeks)
    .map((weekWorkouts) => {
      const uniqueDays = Array.from(
        new Map(
          weekWorkouts
            .sort((a, b) => timeOf(a) - timeOf(b))
            .map((workout) => [getLocalDateKey(workout.created_at), workout])
        ).values()
      );
      return uniqueDays[4]?.created_at;
    })
    .filter((date): date is string => Boolean(date));

  return oldestDate(unlockDates.map((created_at) => ({ created_at })));
}

function firstStreakDate(activities: Activity[], targetDays: number): string | undefined {
  const dayMap = new Map<string, Activity>();

  for (const activity of [...activities].sort((a, b) => timeOf(a) - timeOf(b))) {
    const day = getLocalDateKey(activity.created_at);
    if (!dayMap.has(day)) dayMap.set(day, activity);
  }

  const days = [...dayMap.keys()].sort();
  let streak = 0;
  let previous: Date | null = null;

  for (const day of days) {
    const current = new Date(`${day}T00:00:00Z`);
    const isConsecutive =
      previous !== null && Math.round((current.getTime() - previous.getTime()) / 86_400_000) === 1;

    streak = isConsecutive ? streak + 1 : 1;
    previous = current;

    if (streak >= targetDays) return dayMap.get(day)?.created_at;
  }

  return undefined;
}

export function addAchievementUnlockDates({
  runs,
  workouts,
  achievements,
  normalizeWorkoutGroups,
}: AchievementUnlockInputs): AchievementCardData[] {
  const unlockDateById: Record<string, string | undefined> = {
    "first-run": firstRunMeeting(runs, () => true),
    "5k": firstRunMeeting(runs, (run) => Number(run.distance ?? 0) >= 5),
    "10k": firstRunMeeting(runs, (run) => Number(run.distance ?? 0) >= 10),
    "half-marathon": firstRunMeeting(runs, (run) => Number(run.distance ?? 0) >= 21.1),
    "50km-total": firstCumulativeRunDate(runs, 50),
    "100km-total": firstCumulativeRunDate(runs, 100),
    sub5: firstRunMeeting(runs, (run) => {
      const paceSeconds = parsePaceToSeconds(run.pace);
      return paceSeconds !== null && paceSeconds <= 300;
    }),
    "run-streak": firstStreakDate(runs, 7),
    "first-gym": firstWorkoutMeeting(workouts, () => true),
    "first-chest": firstWorkoutMeeting(workouts, (workout) =>
      normalizeWorkoutGroups(workout).includes("peito")
    ),
    "first-legs": firstWorkoutMeeting(workouts, (workout) =>
      normalizeWorkoutGroups(workout).some((group) =>
        ["quadriceps", "posterior-coxa", "gluteos", "panturrilhas"].includes(group)
      )
    ),
    "7-active": firstCumulativeWorkoutDate(workouts, 7),
    "30-sessions": firstCumulativeWorkoutDate(workouts, 30),
    "gym-streak": firstStreakDate(workouts, 7),
    "perfect-week": firstPerfectWeekDate(workouts),
  };

  return achievements.map((achievement) => ({
    ...achievement,
    unlockedAt: achievement.unlocked ? unlockDateById[achievement.id] : undefined,
  }));
}
