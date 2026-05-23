import type { SupabaseClient } from "@supabase/supabase-js";

import { createFeedEvent } from "@/lib/feed";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GoalType =
  | "runs_count"
  | "distance_km"
  | "gym_sessions"
  | "total_workouts";

export type ChallengeStatus =
  | "pending"
  | "accepted"
  | "active"
  | "finished"
  | "declined"
  | "canceled";

export interface ChallengeProfile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_id: string | null;
}

export interface ChallengeRow {
  id: string;
  creator_id: string;
  challenged_id: string;
  title: string;
  description: string | null;
  goal_type: GoalType;
  target_value: number;
  duration_days: number;
  start_date: string | null;
  end_date: string | null;
  status: ChallengeStatus;
  winner_id: string | null;
  created_at: string;
}

type FinalizeChallengeInput = {
  challenge: ChallengeRow;
  winnerId: string | null;
  winnerProgress: number;
  targetProgress: number;
};

export type ChallengeVictoryUpdate = {
  challengeId: string;
  winnerId: string;
  trophyId: string | null;
};

// ─── Config ───────────────────────────────────────────────────────────────────

export const GOAL_CONFIG: Record<
  GoalType,
  { label: string; unit: string; color: string; description: string }
> = {
  runs_count:     { label: "Corridas",       unit: "corridas", color: "#B6FF00", description: "Total de corridas realizadas" },
  distance_km:    { label: "Distância",      unit: "km",       color: "#22D3EE", description: "Quilômetros percorridos correndo" },
  gym_sessions:   { label: "Academia",       unit: "sessões",  color: "#A78BFA", description: "Sessões de treino na academia" },
  total_workouts: { label: "Treinos Totais", unit: "treinos",  color: "#FB923C", description: "Corridas + treinos de academia somados" },
};

export const STATUS_CONFIG: Record<
  ChallengeStatus,
  { label: string; color: string; bg: string }
> = {
  pending:  { label: "Pendente",   color: "#EAB308", bg: "rgba(234,179,8,0.12)"  },
  accepted: { label: "Aceito",     color: "#22D3EE", bg: "rgba(34,211,238,0.12)" },
  active:   { label: "Ativo",      color: "#B6FF00", bg: "rgba(182,255,0,0.12)"  },
  finished: { label: "Finalizado", color: "#A78BFA", bg: "rgba(167,139,250,0.12)"},
  declined: { label: "Recusado",   color: "#F87171", bg: "rgba(248,113,113,0.12)"},
  canceled: { label: "Cancelado",  color: "#71717A", bg: "rgba(113,113,122,0.12)"},
};

// ─── Progress calculation ─────────────────────────────────────────────────────

/**
 * Returns a user's current progress value for a challenge window.
 * Uses the provided supabase client (pass admin client to bypass RLS for
 * reading another user's activities).
 */
export async function getChallengeProgress(
  supabase: SupabaseClient,
  userId: string,
  goalType: GoalType,
  startDate: string,
  endDate: string
): Promise<number> {
  const needsRuns =
    goalType === "runs_count" ||
    goalType === "distance_km" ||
    goalType === "total_workouts";

  const needsWorkouts =
    goalType === "gym_sessions" || goalType === "total_workouts";

  const [runsResult, workoutsResult] = await Promise.all([
    needsRuns
      ? supabase
          .from("runs")
          .select(goalType === "distance_km" ? "distance" : "id")
          .eq("user_id", userId)
          .gte("created_at", startDate)
          .lte("created_at", endDate)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),

    needsWorkouts
      ? supabase
          .from("workouts")
          .select("id")
          .eq("user_id", userId)
          .gte("created_at", startDate)
          .lte("created_at", endDate)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
  ]);

  const runs = runsResult.data ?? [];
  // Gracefully handle missing workouts table
  const workoutsErr = workoutsResult.error;
  const workoutsMissing =
    workoutsErr &&
    (workoutsErr.code === "42P01" ||
      workoutsErr.message?.toLowerCase().includes("workouts"));
  const workouts = workoutsMissing ? [] : (workoutsResult.data ?? []);

  switch (goalType) {
    case "runs_count":
      return runs.length;

    case "distance_km":
      return (
        Math.round(
          runs.reduce(
            (sum, r) => sum + Number((r as { distance?: number }).distance ?? 0),
            0
          ) * 10
        ) / 10
      );

    case "gym_sessions":
      return workouts.length;

    case "total_workouts":
      return runs.length + workouts.length;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function daysLeft(endDate: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000)
  );
}

export function formatProgress(value: number, goalType: GoalType): string {
  if (goalType === "distance_km") return `${value.toFixed(1)} km`;
  const unit = GOAL_CONFIG[goalType].unit;
  return `${value} ${unit}`;
}

export async function finalizeChallengeVictory(
  supabase: SupabaseClient,
  { challenge, winnerId, winnerProgress, targetProgress }: FinalizeChallengeInput
) {
  if (!winnerId || challenge.status !== "active" || challenge.winner_id) {
    return { finalized: false };
  }

  const { data: updated, error: updateError } = await supabase
    .from("challenges")
    .update({ status: "finished", winner_id: winnerId })
    .eq("id", challenge.id)
    .eq("status", "active")
    .is("winner_id", null)
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("[challenge] finish failed:", updateError.code, updateError.message);
    return { finalized: false };
  }
  if (!updated) return { finalized: false };

  const trophy = await ensureChallengeVictoryTrophy(supabase, challenge);
  if (trophy?.id) {
    const { error: grantError } = await supabase
      .from("user_trophies")
      .insert({
        user_id: winnerId,
        trophy_id: trophy.id,
        awarded_by: null,
        note: `Venceu "${challenge.title}" com ${formatProgress(winnerProgress, challenge.goal_type)} de ${formatProgress(targetProgress, challenge.goal_type)}.`,
      });

    if (grantError && grantError.code !== "23505") {
      console.error("[challenge] trophy grant failed:", grantError.code, grantError.message);
    }
  }

  await supabase.from("notifications").insert({
    user_id: winnerId,
    type: "challenge_won",
    title: "Duelo vencido",
    message: `Você venceu "${challenge.title}" e recebeu um troféu exclusivo.`,
    data: { challenge_id: challenge.id, trophy_id: trophy?.id ?? null },
  });

  await createFeedEvent(supabase, {
    userId: winnerId,
    eventType: "challenge_won",
    dedupeKey: `challenge_won:${challenge.id}`,
    payload: {
      challenge_id: challenge.id,
      title: challenge.title,
      trophy_id: trophy?.id ?? null,
      progress: winnerProgress,
      target: targetProgress,
      goal_type: challenge.goal_type,
    },
  });

  return { finalized: true, trophyId: trophy?.id ?? null };
}

export async function updateActiveChallengesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<ChallengeVictoryUpdate[]> {
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("status", "active")
    .or(`creator_id.eq.${userId},challenged_id.eq.${userId}`);

  if (error) {
    console.error("[challenge] active challenge lookup failed:", error.code, error.message);
    return [];
  }

  const updates: ChallengeVictoryUpdate[] = [];

  for (const challenge of (data ?? []) as ChallengeRow[]) {
    if (!challenge.start_date || !challenge.end_date) continue;

    const [creatorProgress, challengedProgress] = await Promise.all([
      getChallengeProgress(supabase, challenge.creator_id, challenge.goal_type, challenge.start_date, challenge.end_date),
      getChallengeProgress(supabase, challenge.challenged_id, challenge.goal_type, challenge.start_date, challenge.end_date),
    ]);

    const target = Number(challenge.target_value);
    const creatorReached = creatorProgress >= target;
    const challengedReached = challengedProgress >= target;
    const winnerId = creatorReached && challengedReached
      ? creatorProgress === challengedProgress
        ? null
        : creatorProgress > challengedProgress
          ? challenge.creator_id
          : challenge.challenged_id
      : creatorReached
        ? challenge.creator_id
        : challengedReached
          ? challenge.challenged_id
          : null;

    if (!winnerId) continue;

    const result = await finalizeChallengeVictory(supabase, {
      challenge,
      winnerId,
      winnerProgress: winnerId === challenge.creator_id ? creatorProgress : challengedProgress,
      targetProgress: target,
    });

    if (result.finalized) {
      updates.push({ challengeId: challenge.id, winnerId, trophyId: result.trophyId ?? null });
    }
  }

  return updates;
}

async function ensureChallengeVictoryTrophy(supabase: SupabaseClient, challenge: ChallengeRow) {
  const slug = `duelo-1x1-${challenge.id}`;
  const { data, error } = await supabase
    .from("exclusive_trophies")
    .upsert(
      {
        slug,
        name: "Vencedor de Duelo 1x1",
        description: `Venceu o duelo "${challenge.title}".`,
        rarity: "epic",
        visual: "trophy",
        is_unique: true,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (error) {
    console.error("[challenge] trophy ensure failed:", error.code, error.message);
    return null;
  }

  return data as { id: string };
}
