import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { updateActiveCompetitionProgressForUser } from "@/lib/competition-progress";
import { insertFeedEvent } from "@/lib/feed";
import { normalizeMuscleGroups, VALID_MUSCLE_DETAILS, VALID_MUSCLE_GROUPS } from "@/lib/muscles";
import { syncStreaksForUser, checkHybridBonusToday, getNewMilestone } from "@/lib/streaks";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { syncUserXP } from "@/lib/xp";

export const dynamic = "force-dynamic";

const VALID_INTENSITIES = ["leve", "moderado", "intenso"] as const;
const VALID_SPLITS = ["push", "pull", "legs", "upper", "lower", "full-body", "custom"] as const;

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("workouts")
    .select("id,title,muscle_group,muscle_groups,muscle_details,workout_split,duration_minutes,intensity,notes,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workouts: data ?? [] });
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
    }

    const b = body as Record<string, unknown> | null ?? {};
    const title = String(b.title ?? "").trim();
    const durationMinutes = Number(b.duration_minutes);
    const intensity = String(b.intensity ?? "").trim() || null;
    const notes = String(b.notes ?? "").trim() || null;
    const workoutSplit = String(b.workout_split ?? "custom").trim();
    const rawMuscleGroups = Array.isArray(b.muscle_groups)
      ? (b.muscle_groups as unknown[]).map((g) => String(g).trim()).filter(Boolean)
      : b.muscle_group
        ? [String(b.muscle_group).trim()]
        : [];
    const muscleGroups = normalizeMuscleGroups(rawMuscleGroups);
    const muscleDetails = Array.isArray(b.muscle_details)
      ? [...new Set((b.muscle_details as unknown[]).map((g) => String(g).trim()).filter(Boolean))]
      : [];

    if (!title) return NextResponse.json({ error: "Nome do treino é obrigatório" }, { status: 400 });
    if (muscleGroups.length === 0 || !muscleGroups.every((g) => VALID_MUSCLE_GROUPS.has(g))) {
      return NextResponse.json({ error: "Grupo muscular inválido" }, { status: 400 });
    }
    if (!muscleDetails.every((detail) => VALID_MUSCLE_DETAILS.has(detail))) {
      return NextResponse.json({ error: "Músculo específico inválido" }, { status: 400 });
    }
    if (!VALID_SPLITS.includes(workoutSplit as (typeof VALID_SPLITS)[number])) {
      return NextResponse.json({ error: "Divisão de treino inválida" }, { status: 400 });
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return NextResponse.json({ error: "Duração inválida" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("workouts")
      .insert({
        title,
        muscle_group: muscleGroups[0],
        muscle_groups: muscleGroups,
        muscle_details: muscleDetails,
        workout_split: workoutSplit,
        duration_minutes: durationMinutes,
        intensity: intensity && VALID_INTENSITIES.includes(intensity as (typeof VALID_INTENSITIES)[number]) ? intensity : null,
        notes,
        user_id: user.id,
      })
      .select("id,title,muscle_group,muscle_groups,muscle_details,workout_split,duration_minutes,intensity,notes,created_at")
      .single();

    if (error) {
      console.error("[workouts] INSERT FAILED:", error.code, error.message, error.details, error.hint);
      return NextResponse.json({ error: error.message || "Erro ao salvar no banco de dados" }, { status: 500 });
    }

    let progressUpdates: Awaited<ReturnType<typeof updateActiveCompetitionProgressForUser>> = [];
    let xpFeedback: Awaited<ReturnType<typeof syncUserXP>> | null = null;
    let streakMilestone: number | null = null;
    let hybridBonus = false;

    try {
      progressUpdates = await updateActiveCompetitionProgressForUser(supabase, user.id);
    } catch (err) {
      console.error("[workouts] competition progress failed:", err);
    }

    try {
      xpFeedback = await syncUserXP(supabase, user.id);
    } catch (err) {
      console.error("[workouts] xp sync failed:", err);
    }

    try {
      const { data: prevStreakRow } = await supabase
        .from("streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .eq("streak_type", "general")
        .maybeSingle();

      const prevStreak = (prevStreakRow as { current_streak?: number } | null)?.current_streak ?? 0;
      const newStreaks = await syncStreaksForUser(supabase, user.id);
      streakMilestone = getNewMilestone(prevStreak, newStreaks.general.currentStreak);
    } catch (err) {
      console.error("[workouts] streak sync failed:", err);
    }

    try {
      hybridBonus = await checkHybridBonusToday(supabase, user.id);
    } catch (err) {
      console.error("[workouts] hybrid bonus check failed:", err);
    }

    await insertFeedEvent(supabase, user.id, "workout", {
      id: data.id,
      title: data.title ?? undefined,
      muscle_group: data.muscle_group ?? undefined,
      muscle_groups: (data.muscle_groups as string[] | null)?.length ? data.muscle_groups : undefined,
      muscle_details: (data.muscle_details as string[] | null)?.length ? data.muscle_details : undefined,
      workout_split: data.workout_split ?? undefined,
      duration_minutes: data.duration_minutes ?? undefined,
      intensity: data.intensity ?? undefined,
    });

    if (xpFeedback?.leveledUp) {
      await insertFeedEvent(supabase, user.id, "level_up", {
        new_level: xpFeedback.currentLevel,
        new_rank: xpFeedback.rank,
        total_xp: xpFeedback.totalXp,
      });
    }

    if (streakMilestone !== null) {
      await insertFeedEvent(supabase, user.id, "streak_milestone", {
        streak_days: streakMilestone,
        streak_type: "general",
      });
    }

    if (hybridBonus) {
      await insertFeedEvent(supabase, user.id, "hybrid_bonus", {
        workout_id: data.id,
        workout_title: data.title,
      });
    }

    revalidatePath("/");
    revalidatePath("/academia");
    revalidatePath("/treinos");
    revalidatePath("/feed");
    revalidatePath("/metas");
    revalidatePath("/competicoes");
    revalidatePath("/desafios-competicoes");
    revalidatePath("/social");
    revalidatePath("/perfil");
    for (const update of progressUpdates) revalidatePath(`/competicoes/${update.competitionId}`);

    return NextResponse.json({ workout: data, progressUpdates, xpFeedback, hybridBonus }, { status: 201 });
  } catch (err) {
    console.error("[workouts] UNHANDLED ERROR:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message || "Erro interno inesperado" }, { status: 500 });
  }
}
