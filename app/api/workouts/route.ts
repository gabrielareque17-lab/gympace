import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { updateActiveCompetitionProgressForUser } from "@/lib/competition-progress";
import { insertFeedEvent } from "@/lib/feed";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { syncUserXP } from "@/lib/xp";

export const dynamic = "force-dynamic";

const VALID_GROUPS = ["peito", "costas", "pernas", "ombros", "bracos", "abdomen", "full-body"] as const;
const VALID_INTENSITIES = ["leve", "moderado", "intenso"] as const;

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("workouts")
    .select("id,title,muscle_group,duration_minutes,intensity,notes,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ workouts: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const title = String(body?.title ?? "").trim();
  const muscleGroup = String(body?.muscle_group ?? "").trim();
  const durationMinutes = Number(body?.duration_minutes);
  const intensity = String(body?.intensity ?? "").trim() || null;
  const notes = String(body?.notes ?? "").trim() || null;

  if (!title) return NextResponse.json({ error: "Nome do treino é obrigatório" }, { status: 400 });
  if (!VALID_GROUPS.includes(muscleGroup as (typeof VALID_GROUPS)[number])) {
    return NextResponse.json({ error: "Grupo muscular inválido" }, { status: 400 });
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return NextResponse.json({ error: "Duração inválida" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("workouts")
    .insert({
      title,
      muscle_group: muscleGroup,
      duration_minutes: durationMinutes,
      intensity: intensity && VALID_INTENSITIES.includes(intensity as (typeof VALID_INTENSITIES)[number]) ? intensity : null,
      notes,
      user_id: user.id,
    })
    .select("id,title,muscle_group,duration_minutes,intensity,notes,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const progressUpdates = await updateActiveCompetitionProgressForUser(supabase, user.id);
  const xpFeedback = await syncUserXP(supabase, user.id);

  await insertFeedEvent(supabase, user.id, "workout", {
    id: data.id,
    title: data.title ?? undefined,
    muscle_group: data.muscle_group ?? undefined,
    duration_minutes: data.duration_minutes ?? undefined,
    intensity: data.intensity ?? undefined,
  });
  if (xpFeedback.leveledUp) {
    await insertFeedEvent(supabase, user.id, "level_up", {
      new_level: xpFeedback.currentLevel,
      new_rank: xpFeedback.rank,
      total_xp: xpFeedback.totalXp,
    });
  }

  revalidatePath("/");
  revalidatePath("/academia");
  revalidatePath("/feed");
  revalidatePath("/metas");
  revalidatePath("/competicoes");
  for (const update of progressUpdates) {
    revalidatePath(`/competicoes/${update.competitionId}`);
  }

  return NextResponse.json({ workout: data, progressUpdates, xpFeedback }, { status: 201 });
}
