import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { updateActiveCompetitionProgressForUser } from "@/lib/competition-progress";
import { createFeedEvent } from "@/lib/feed";
import { checkAndUpdatePersonalRecords, PR_LABELS } from "@/lib/personal-records";
import { isRateLimited } from "@/lib/security";
import { syncStreaksForUser, checkHybridBonusToday, getNewMilestone } from "@/lib/streaks";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { awardXP } from "@/lib/xp";

export const dynamic = "force-dynamic";

const VALID_RUN_TYPES = ["leve", "intervalado", "longao", "regenerativo", "prova", "ritmo", "caminhada", "esteira"] as const;
const MAX_ROUTE_POINTS = 2000;
const MAX_RUN_DISTANCE_KM = 200;
const MAX_RUN_DURATION_SECONDS = 24 * 60 * 60;

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("runs")
    .select("id,distance,pace,duration,duration_seconds,avg_speed,calories,run_type,notes,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ runs: data ?? [] });
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

    const b = body as Record<string, unknown>;
    const distance = Number(b?.distance);
    const pace = String(b?.pace ?? "").trim();
    const duration = String(b?.duration ?? "").trim();
    const runType = String(b?.run_type ?? "leve").trim();
    const notes = String(b?.notes ?? "").trim() || null;

    const durationSeconds = b?.duration_seconds != null ? Number(b.duration_seconds) : null;
    const avgSpeed = b?.avg_speed != null ? Number(b.avg_speed) : null;
    const calories = b?.calories != null ? Number(b.calories) : null;
    const rawPoints = Array.isArray(b?.route_points) ? b.route_points : null;
    const routePoints = rawPoints && rawPoints.length <= MAX_ROUTE_POINTS ? rawPoints : null;

    if (await isRateLimited(supabase, {
      table: "runs",
      userColumn: "user_id",
      userId: user.id,
      max: 4,
      windowSeconds: 60,
    })) {
      return NextResponse.json({ error: "Muitas corridas registradas em pouco tempo." }, { status: 429 });
    }

    if (!Number.isFinite(distance) || distance <= 0 || distance > MAX_RUN_DISTANCE_KM) {
      return NextResponse.json({ error: "Distância inválida" }, { status: 400 });
    }
    if (!pace || !duration) {
      return NextResponse.json({ error: "Pace e duração são obrigatórios" }, { status: 400 });
    }
    if (Number.isFinite(durationSeconds) && (durationSeconds! <= 0 || durationSeconds! > MAX_RUN_DURATION_SECONDS)) {
      return NextResponse.json({ error: "Duração inválida" }, { status: 400 });
    }
    if (Number.isFinite(avgSpeed) && (avgSpeed! <= 0 || avgSpeed! > 45)) {
      return NextResponse.json({ error: "Velocidade média inválida" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("runs")
      .insert({
        distance,
        pace,
        duration,
        run_type: VALID_RUN_TYPES.includes(runType as (typeof VALID_RUN_TYPES)[number]) ? runType : "leve",
        notes,
        user_id: user.id,
        ...(Number.isFinite(durationSeconds) && durationSeconds! > 0 ? { duration_seconds: Math.round(durationSeconds!) } : {}),
        ...(Number.isFinite(avgSpeed) && avgSpeed! > 0 ? { avg_speed: avgSpeed } : {}),
        ...(Number.isFinite(calories) && calories! > 0 ? { calories: Math.round(calories!) } : {}),
        ...(routePoints ? { route_points: routePoints } : {}),
      })
      .select("id,distance,pace,duration,duration_seconds,avg_speed,calories,run_type,notes,created_at")
      .single();

    if (error) {
      console.error("[runs] INSERT FAILED — code:", error.code, "| msg:", error.message, "| details:", error.details, "| hint:", error.hint);
      return NextResponse.json({ error: error.message || "Erro ao salvar no banco de dados" }, { status: 500 });
    }

    console.log("[runs] inserted:", data.id, "distance:", data.distance, "km");

    let progressUpdates: Awaited<ReturnType<typeof updateActiveCompetitionProgressForUser>> = [];
    let xpFeedback: Awaited<ReturnType<typeof awardXP>> | null = null;
    let newPersonalRecords: string[] = [];
    let streakMilestone: number | null = null;
    let hybridBonus = false;

    try {
      progressUpdates = await updateActiveCompetitionProgressForUser(supabase, user.id);
    } catch (err) {
      console.error("[runs] competition progress failed:", err);
    }

    try {
      xpFeedback = await awardXP(supabase, { userId: user.id, source: "run", sourceId: data.id });
    } catch (err) {
      console.error("[runs] xp sync failed:", err);
    }

    // Streak sync — capture prev general streak before update
    try {
      const { data: prevStreakRow } = await supabase
        .from("streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .eq("streak_type", "general")
        .maybeSingle();

      const prevStreak = (prevStreakRow as { current_streak?: number } | null)?.current_streak ?? 0;
      const newStreaks = await syncStreaksForUser(supabase, user.id);
      const newGeneral = newStreaks.general.currentStreak;
      streakMilestone = getNewMilestone(prevStreak, newGeneral);
    } catch (err) {
      console.error("[runs] streak sync failed:", err);
    }

    // Personal records
    try {
      const broken = await checkAndUpdatePersonalRecords(supabase, user.id, {
        id: data.id,
        distance: Number(data.distance),
        pace: data.pace ?? null,
      });
      newPersonalRecords = broken;
    } catch (err) {
      console.error("[runs] personal records failed:", err);
    }

    // Hybrid bonus — check if user also has a workout today
    try {
      hybridBonus = await checkHybridBonusToday(supabase, user.id);
    } catch (err) {
      console.error("[runs] hybrid bonus check failed:", err);
    }

    // ── Feed events ──────────────────────────────────────────────────────────

    await createFeedEvent(supabase, {
      userId: user.id,
      eventType: "run",
      payload: {
        id: data.id,
        distance: data.distance,
        pace: data.pace ?? undefined,
        duration: data.duration ?? undefined,
        avg_speed: (data.avg_speed as number | null) ?? undefined,
        calories: (data.calories as number | null) ?? undefined,
        run_type: data.run_type ?? undefined,
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

    for (const prType of newPersonalRecords) {
      await createFeedEvent(supabase, {
        userId: user.id,
        eventType: "personal_record",
        dedupeKey: `pr:${prType}:${data.id}`,
        payload: {
          record_type: prType,
          label: PR_LABELS[prType as keyof typeof PR_LABELS],
          distance: data.distance,
          pace: data.pace ?? undefined,
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
          run_id: data.id,
          distance: data.distance,
        },
      });
    }

    revalidatePath("/");
    revalidatePath("/corridas");
    revalidatePath("/treinos");
    revalidatePath("/feed");
    revalidatePath("/metas");
    revalidatePath("/competicoes");
    revalidatePath("/desafios-competicoes");
    revalidatePath("/social");
    revalidatePath("/perfil");
    for (const update of progressUpdates) {
      revalidatePath(`/competicoes/${update.competitionId}`);
    }

    return NextResponse.json(
      { run: data, progressUpdates, xpFeedback, newPersonalRecords, hybridBonus },
      { status: 201 }
    );
  } catch (err) {
    console.error("[runs] UNHANDLED ERROR:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message || "Erro interno inesperado" }, { status: 500 });
  }
}
