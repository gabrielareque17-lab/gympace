import type { SupabaseClient } from "@supabase/supabase-js";

export type CompetitionType = "corrida" | "academia" | "streak" | "hibrido";

export type CompetitionProgressUpdate = {
  competitionId: string;
  title: string;
  type: CompetitionType;
  previousProgress: number;
  nextProgress: number;
  delta: number;
  unit: string;
};

type ParticipantRow = {
  competition_id: string;
  progress: number | null;
  competitions: {
    id: string;
    title: string;
    type: CompetitionType;
    start_date: string;
    end_date: string;
  } | null;
};

type RunActivity = {
  distance: number | null;
  created_at: string;
};

type WorkoutActivity = {
  created_at: string;
};

const TYPE_UNIT: Record<CompetitionType, string> = {
  corrida: "km",
  academia: "sessões",
  streak: "dias",
  hibrido: "pts",
};

export async function updateActiveCompetitionProgressForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<CompetitionProgressUpdate[]> {
  const now = new Date();

  const { data: participantRows, error: participantErr } = await supabase
    .from("competition_participants")
    .select("competition_id, progress, competitions(id, title, type, start_date, end_date)")
    .eq("user_id", userId);

  if (participantErr) {
    // Gracefully handle missing table (not yet migrated)
    const missing = participantErr.code === "42P01" || participantErr.message?.toLowerCase().includes("competition_participants");
    if (missing) return [];
    throw participantErr;
  }

  const rows: ParticipantRow[] = ((participantRows ?? []) as unknown as ParticipantRow[]).map((row) => ({
    ...row,
    competitions: Array.isArray(row.competitions) ? row.competitions[0] ?? null : row.competitions,
  }));

  const activeRows = rows.filter((row) => {
    const competition = row.competitions;
    if (!competition) return false;
    return new Date(competition.start_date) <= now && new Date(competition.end_date) >= now;
  });

  if (activeRows.length === 0) return [];

  const start = minIso(activeRows.map((row) => row.competitions!.start_date));
  const end = maxIso(activeRows.map((row) => row.competitions!.end_date));
  const [runs, workouts] = await Promise.all([
    fetchRunsInWindow(supabase, userId, start, end),
    fetchWorkoutsInWindow(supabase, userId, start, end),
  ]);

  const updates: CompetitionProgressUpdate[] = [];

  for (const row of activeRows) {
    const competition = row.competitions!;
    const windowRuns = runs.filter((run) => isWithin(run.created_at, competition.start_date, competition.end_date));
    const windowWorkouts = workouts.filter((workout) =>
      isWithin(workout.created_at, competition.start_date, competition.end_date)
    );

    const nextProgress = calculateCompetitionProgress(competition.type, windowRuns, windowWorkouts);
    const previousProgress = Number(row.progress ?? 0);

    if (Math.abs(nextProgress - previousProgress) < 0.001) continue;

    const { error: updateErr } = await supabase
      .from("competition_participants")
      .update({ progress: nextProgress })
      .eq("competition_id", competition.id)
      .eq("user_id", userId);

    if (updateErr) {
      console.error("[competition-progress] update failed:", updateErr.code, updateErr.message);
      continue;
    }

    updates.push({
      competitionId: competition.id,
      title: competition.title,
      type: competition.type,
      previousProgress,
      nextProgress,
      delta: roundMetric(nextProgress - previousProgress),
      unit: TYPE_UNIT[competition.type],
    });
  }

  return updates;
}

export function calculateCompetitionProgress(
  type: CompetitionType,
  runs: RunActivity[],
  workouts: WorkoutActivity[]
) {
  const distance = roundMetric(runs.reduce((sum, run) => sum + Number(run.distance ?? 0), 0));
  const workoutCount = workouts.length;
  const streak = calculateLongestActivityStreak([
    ...runs.map((run) => run.created_at),
    ...workouts.map((workout) => workout.created_at),
  ]);

  if (type === "corrida") return distance;
  if (type === "academia") return workoutCount;
  if (type === "streak") return streak;

  return roundMetric(distance + workoutCount * 2 + streak * 3);
}

export function calculateLongestActivityStreak(activityDates: string[]) {
  const days = [...new Set(activityDates.map(toDateKey))].sort();
  if (days.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let index = 1; index < days.length; index += 1) {
    const previous = new Date(`${days[index - 1]}T00:00:00`);
    const next = new Date(`${days[index]}T00:00:00`);
    const diffDays = Math.round((next.getTime() - previous.getTime()) / 86_400_000);

    current = diffDays === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }

  return longest;
}

async function fetchRunsInWindow(
  supabase: SupabaseClient,
  userId: string,
  start: string,
  end: string
): Promise<RunActivity[]> {
  const { data, error } = await supabase
    .from("runs")
    .select("distance, created_at")
    .eq("user_id", userId)
    .gte("created_at", start)
    .lte("created_at", end);

  if (error) throw error;
  return (data ?? []) as RunActivity[];
}

async function fetchWorkoutsInWindow(
  supabase: SupabaseClient,
  userId: string,
  start: string,
  end: string
): Promise<WorkoutActivity[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", start)
    .lte("created_at", end);

  if (error) {
    const missingTable = error.code === "42P01" || error.message.toLowerCase().includes("workouts");
    if (missingTable) return [];
    throw error;
  }

  return (data ?? []) as WorkoutActivity[];
}

function isWithin(value: string, start: string, end: string) {
  const time = new Date(value).getTime();
  return time >= new Date(start).getTime() && time <= new Date(end).getTime();
}

function minIso(values: string[]) {
  return values.reduce((min, value) => (new Date(value) < new Date(min) ? value : min));
}

function maxIso(values: string[]) {
  return values.reduce((max, value) => (new Date(value) > new Date(max) ? value : max));
}

function roundMetric(value: number) {
  return Math.round(value * 10) / 10;
}

function toDateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}
