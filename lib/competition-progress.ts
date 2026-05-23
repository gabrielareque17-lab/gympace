import type { SupabaseClient } from "@supabase/supabase-js";

import { getLocalDateKey } from "@/lib/date-utils";
import { createOptionalSupabaseAdminClient } from "@/lib/supabase-admin";

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
    target_value: number;
    start_date: string;
    end_date: string;
    status: "active" | "finished" | "canceled" | null;
    winner_id: string | null;
    finished_at: string | null;
  } | null;
};

export type CompetitionRow = {
  id: string;
  title: string;
  type: CompetitionType;
  target_value: number;
  start_date: string;
  end_date: string;
  status?: "active" | "finished" | "canceled" | null;
  winner_id?: string | null;
  finished_at?: string | null;
};

export type CompetitionLeaderboardEntry = {
  user_id: string;
  progress: number;
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
    .select("competition_id, progress, competitions(id, title, type, target_value, start_date, end_date, status, winner_id, finished_at)")
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
    if ((competition.status ?? "active") !== "active") return false;
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
  const writeSupabase = createOptionalSupabaseAdminClient();
  if (!writeSupabase) {
    console.warn("[competition-progress] SUPABASE_SERVICE_ROLE_KEY is not configured; progress updates were skipped.");
    return updates;
  }

  for (const row of activeRows) {
    const competition = row.competitions!;
    const windowRuns = runs.filter((run) => isWithin(run.created_at, competition.start_date, competition.end_date));
    const windowWorkouts = workouts.filter((workout) =>
      isWithin(workout.created_at, competition.start_date, competition.end_date)
    );

    const nextProgress = calculateCompetitionProgress(competition.type, windowRuns, windowWorkouts);
    const previousProgress = Number(row.progress ?? 0);

    if (Math.abs(nextProgress - previousProgress) < 0.001) continue;

    const { error: updateErr } = await writeSupabase
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

  for (const row of activeRows) {
    const competition = row.competitions!;
    const { data: participants, error: participantsError } = await writeSupabase
      .from("competition_participants")
      .select("user_id, progress")
      .eq("competition_id", competition.id);

    if (participantsError) {
      console.error("[competition] participants lookup failed:", participantsError.code, participantsError.message);
      continue;
    }

    await finalizeCompetitionVictory(
      writeSupabase,
      {
        id: competition.id,
        title: competition.title,
        type: competition.type,
        target_value: Number(competition.target_value),
        start_date: competition.start_date,
        end_date: competition.end_date,
        status: competition.status,
        winner_id: competition.winner_id,
        finished_at: competition.finished_at,
      },
      ((participants ?? []) as { user_id: string; progress: number | null }[]).map((participant) => ({
        user_id: participant.user_id,
        progress: Number(participant.progress ?? 0),
      }))
    );
  }

  return updates;
}

export async function finalizeCompetitionVictory(
  supabase: SupabaseClient,
  competition: CompetitionRow,
  leaderboard: CompetitionLeaderboardEntry[]
) {
  if ((competition.status ?? "active") !== "active" || competition.winner_id) {
    return { finalized: false };
  }

  const winner = resolveCompetitionWinner(competition, leaderboard);
  if (!winner) return { finalized: false };

  const { data: updated, error: updateError } = await supabase
    .from("competitions")
    .update({ status: "finished", winner_id: winner.user_id, finished_at: new Date().toISOString() })
    .eq("id", competition.id)
    .neq("status", "finished")
    .is("winner_id", null)
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("[competition] finish failed:", updateError.code, updateError.message);
    return { finalized: false };
  }
  if (!updated) return { finalized: false };

  const trophy = await ensureCompetitionVictoryTrophy(supabase, competition);
  if (trophy?.id) {
    const { error: grantError } = await supabase
      .from("user_trophies")
      .insert({
        user_id: winner.user_id,
        trophy_id: trophy.id,
        awarded_by: null,
        note: `Venceu "${competition.title}" com ${formatCompetitionProgress(winner.progress, competition.type)}.`,
      });

    if (grantError && grantError.code !== "23505") {
      console.error("[competition] trophy grant failed:", grantError.code, grantError.message);
    }
  }

  await supabase.from("notifications").insert({
    user_id: winner.user_id,
    type: "competition_won",
    title: "Competição vencida",
    message: `Você venceu "${competition.title}" e recebeu um troféu exclusivo.`,
    data: { competition_id: competition.id, trophy_id: trophy?.id ?? null },
  });

  await insertCompetitionWonFeedEvent(supabase, winner.user_id, competition, trophy);

  return { finalized: true, winnerId: winner.user_id, trophyId: trophy?.id ?? null };
}

export function resolveCompetitionWinner(
  competition: CompetitionRow,
  leaderboard: CompetitionLeaderboardEntry[]
) {
  const sorted = [...leaderboard].sort((a, b) => b.progress - a.progress);
  const leader = sorted[0];
  if (!leader) return null;

  const runnerUp = sorted[1];
  const target = Number(competition.target_value);
  const reachedTarget = leader.progress >= target;
  const endedByDate = new Date(competition.end_date) < new Date();

  if (!reachedTarget && !endedByDate) return null;
  if (runnerUp && runnerUp.progress === leader.progress) return null;
  if (leader.progress <= 0) return null;

  return leader;
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

export function formatCompetitionProgress(value: number, type: CompetitionType) {
  return `${roundMetric(value)} ${TYPE_UNIT[type]}`;
}

async function ensureCompetitionVictoryTrophy(supabase: SupabaseClient, competition: CompetitionRow) {
  const slug = `competicao-${competition.id}`;
  const { data, error } = await supabase
    .from("exclusive_trophies")
    .upsert(
      {
        slug,
        name: "Campeão de Competição",
        description: `Venceu a competição "${competition.title}".`,
        rarity: "legendary",
        visual: "trophy",
        is_unique: true,
      },
      { onConflict: "slug" }
    )
    .select("id,name")
    .single();

  if (error) {
    console.error("[competition] trophy ensure failed:", error.code, error.message);
    return null;
  }

  return data as { id: string; name: string };
}

async function insertCompetitionWonFeedEvent(
  supabase: SupabaseClient,
  userId: string,
  competition: CompetitionRow,
  trophy: { id: string; name: string } | null
) {
  const dedupeKey = `competition_won:${competition.id}`;
  const payload = {
    competition_id: competition.id,
    trophy_id: trophy?.id ?? null,
    trophy_name: trophy?.name ?? "Campeão de Competição",
    rarity: "legendary",
    visual: "trophy",
    dedupe_key: dedupeKey,
  };

  const { data: existing, error: existingError } = await supabase
    .from("activities_feed")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", "competition_won")
    .filter("payload->>dedupe_key", "eq", dedupeKey)
    .maybeSingle();

  if (existingError) {
    console.error("[competition] feed dedupe lookup failed:", existingError.code, existingError.message);
  }
  if (existing?.id) return;

  const { error } = await supabase.from("activities_feed").insert({
    user_id: userId,
    event_type: "competition_won",
    payload,
  });

  if (error) {
    console.error("[competition] feed event failed:", error.code, error.message);
  }
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
  const startQuery = new Date(new Date(start).getTime() - 36 * 60 * 60 * 1000).toISOString();
  const endQuery = new Date(new Date(end).getTime() + 36 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("runs")
    .select("distance, created_at")
    .eq("user_id", userId)
    .gte("created_at", startQuery)
    .lte("created_at", endQuery);

  if (error) throw error;
  return (data ?? []) as RunActivity[];
}

async function fetchWorkoutsInWindow(
  supabase: SupabaseClient,
  userId: string,
  start: string,
  end: string
): Promise<WorkoutActivity[]> {
  const startQuery = new Date(new Date(start).getTime() - 36 * 60 * 60 * 1000).toISOString();
  const endQuery = new Date(new Date(end).getTime() + 36 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("workouts")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", startQuery)
    .lte("created_at", endQuery);

  if (error) {
    const missingTable = error.code === "42P01" || error.message.toLowerCase().includes("workouts");
    if (missingTable) return [];
    throw error;
  }

  return (data ?? []) as WorkoutActivity[];
}

function isWithin(value: string, start: string, end: string) {
  const valueKey = getLocalDateKey(value);
  const startKey = getLocalDateKey(start);
  const endKey = getLocalDateKey(end);
  return valueKey >= startKey && valueKey <= endKey;
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
  return getLocalDateKey(value);
}
