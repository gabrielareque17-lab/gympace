import type { SupabaseClient } from "@supabase/supabase-js";

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
