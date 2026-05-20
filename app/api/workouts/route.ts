import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { updateActiveCompetitionProgressForUser } from "@/lib/competition-progress";
import { createFeedEvent } from "@/lib/feed";
import { normalizeMuscleGroups, VALID_MUSCLE_DETAILS, VALID_MUSCLE_GROUPS } from "@/lib/muscles";
import { isRateLimited } from "@/lib/security";
import { syncStreaksForUser, checkHybridBonusToday, getNewMilestone } from "@/lib/streaks";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { awardXP } from "@/lib/xp";

export const dynamic = "force-dynamic";

const VALID_INTENSITIES = ["leve", "moderado", "intenso"] as const;
const VALID_SPLITS = ["push", "pull", "legs", "upper", "lower", "full-body", "custom"] as const;
const MAX_WORKOUT_DURATION_MINUTES = 360;

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

    if (await isRateLimited(supabase, {
      table: "workouts",
      userColumn: "user_id",
      userId: user.id,
      max: 5,
      windowSeconds: 60,
    })) {
      return NextResponse.json({ error: "Muitos treinos registrados em pouco tempo." }, { status: 429 });
    }

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
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > MAX_WORKOUT_DURATION_MINUTES) {
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
    let xpFeedback: Awaited<ReturnType<typeof awardXP>> | null = null;
    let streakMilestone: number | null = null;
    let hybridBonus = false;

    try {
      progressUpdates = await updateActiveCompetitionProgressForUser(supabase, user.id);
    } catch (err) {
      console.error("[workouts] competition progress failed:", err);
    }

    try {
      xpFeedback = await awardXP(supabase, { userId: user.id, source: "workout", sourceId: data.id });
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

    await createFeedEvent(supabase, {
      userId: user.id,
      eventType: "workout",
      payload: {
        id: data.id,
        title: data.title ?? undefined,
        muscle_group: data.muscle_group ?? undefined,
        muscle_groups: (data.muscle_groups as string[] | null)?.length ? data.muscle_groups : undefined,
        muscle_details: (data.muscle_details as string[] | null)?.length ? data.muscle_details : undefined,
        workout_split: data.workout_split ?? undefined,
        duration_minutes: data.duration_minutes ?? undefined,
        intensity: data.intensity ?? undefined,
      },
    });

    if (xpFeedback?.leveledUp) {
      await createFeedEvent(supabase, {
        userId: user.id,
        eventType: "level_up",
        dedupeKey: `level:${xpFeedback.currentLevel}`,
        payload: {
          new_level: xpFeedback.currentLevel,
          new_rank: xpFeedback.rank,
        },
      });
    }

    if (streakMilestone !== null) {
      await createFeedEvent(supabase, {
        userId: user.id,
        eventType: "streak_milestone",
        dedupeKey: `streak:general:${streakMilestone}`,
        payload: {
          streak_days: streakMilestone,
          streak_type: "general",
        },
      });
    }

    if (hybridBonus) {
      await createFeedEvent(supabase, {
        userId: user.id,
        eventType: "hybrid_bonus",
        dedupeKey: `hybrid:${data.id}`,
        payload: {
          workout_id: data.id,
          workout_title: data.title,
        },
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
