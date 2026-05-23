import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { updateActiveChallengesForUser } from "@/lib/challenge-progress";
import { updateActiveCompetitionProgressForUser } from "@/lib/competition-progress";
import { deleteFeedEvent, insertFeedEvent } from "@/lib/feed";
import { normalizeMuscleGroups, VALID_MUSCLE_DETAILS, VALID_MUSCLE_GROUPS } from "@/lib/muscles";
import { createOptionalSupabaseAdminClient } from "@/lib/supabase-admin";
import { syncStreaksForUser } from "@/lib/streaks";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { syncUserXP } from "@/lib/xp";

type Params = { params: Promise<{ id: string }> };

const VALID_INTENSITIES = ["leve", "moderado", "intenso"] as const;
const VALID_SPLITS = ["push", "pull", "legs", "upper", "lower", "full-body", "custom"] as const;
const MAX_WORKOUT_DURATION_MINUTES = 360;

async function revalidateAll(competitionIds: string[] = [], challengeIds: string[] = []) {
  revalidatePath("/");
  revalidatePath("/academia");
  revalidatePath("/treinos");
  revalidatePath("/feed");
  revalidatePath("/metas");
  revalidatePath("/desafios");
  revalidatePath("/competicoes");
  revalidatePath("/desafios-competicoes");
  revalidatePath("/social");
  revalidatePath("/perfil");
  for (const id of competitionIds) revalidatePath(`/competicoes/${id}`);
  for (const id of challengeIds) revalidatePath(`/desafios/${id}`);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: workout } = await supabase
    .from("workouts")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!workout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabase.from("workouts").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await deleteFeedEvent(supabase, user.id, "workout", id);

  const progressUpdates = await updateActiveCompetitionProgressForUser(supabase, user.id);
  const xpFeedback = await syncUserXP(supabase, user.id);
  await syncStreaksForUser(supabase, user.id);

  await revalidateAll(progressUpdates.map((u) => u.competitionId));
  return NextResponse.json({ ok: true, progressUpdates, xpFeedback });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabase
    .from("workouts")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "Nome do treino é obrigatório" }, { status: 400 });
    updates.title = title;
  }

  if (body.muscle_groups !== undefined || body.muscle_group !== undefined) {
    const rawGroups = Array.isArray(body.muscle_groups)
      ? (body.muscle_groups as unknown[]).map((g) => String(g).trim()).filter(Boolean)
      : body.muscle_group
        ? [String(body.muscle_group).trim()]
        : [];
    const groups = normalizeMuscleGroups(rawGroups);
    if (groups.length === 0 || !groups.every((g) => VALID_MUSCLE_GROUPS.has(g))) {
      return NextResponse.json({ error: "Grupo muscular inválido" }, { status: 400 });
    }
    updates.muscle_group = groups[0];
    updates.muscle_groups = groups;
  }

  if (body.muscle_details !== undefined) {
    const details = Array.isArray(body.muscle_details)
      ? [...new Set((body.muscle_details as unknown[]).map((g) => String(g).trim()).filter(Boolean))]
      : [];
    if (!details.every((detail) => VALID_MUSCLE_DETAILS.has(detail))) {
      return NextResponse.json({ error: "Músculo específico inválido" }, { status: 400 });
    }
    updates.muscle_details = details;
  }

  if (body.workout_split !== undefined) {
    const split = String(body.workout_split).trim();
    if (!VALID_SPLITS.includes(split as (typeof VALID_SPLITS)[number])) {
      return NextResponse.json({ error: "Divisão de treino inválida" }, { status: 400 });
    }
    updates.workout_split = split;
  }

  if (body.duration_minutes !== undefined) {
    const duration = Number(body.duration_minutes);
    if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_WORKOUT_DURATION_MINUTES) {
      return NextResponse.json({ error: "Duração inválida" }, { status: 400 });
    }
    updates.duration_minutes = duration;
  }

  if (body.intensity !== undefined) {
    const intensity = String(body.intensity).trim();
    updates.intensity = VALID_INTENSITIES.includes(intensity as (typeof VALID_INTENSITIES)[number]) ? intensity : null;
  }
  if (body.notes !== undefined) updates.notes = String(body.notes).trim() || null;

  if (body.created_at !== undefined) {
    const createdAt = new Date(String(body.created_at));
    if (Number.isNaN(createdAt.getTime())) {
      return NextResponse.json({ error: "Data e horário do treino inválidos" }, { status: 400 });
    }
    updates.created_at = createdAt.toISOString();
  }

  const { data, error } = await supabase
    .from("workouts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id,title,muscle_group,muscle_groups,muscle_details,workout_split,duration_minutes,intensity,notes,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await deleteFeedEvent(supabase, user.id, "workout", id);
  await insertFeedEvent(supabase, user.id, "workout", {
    id: data.id,
    title: data.title ?? undefined,
    muscle_group: data.muscle_group ?? undefined,
    muscle_groups: (data.muscle_groups as string[] | null)?.length ? data.muscle_groups : undefined,
    muscle_details: (data.muscle_details as string[] | null)?.length ? data.muscle_details : undefined,
    workout_split: data.workout_split ?? undefined,
    duration_minutes: data.duration_minutes ?? undefined,
    intensity: data.intensity ?? undefined,
    created_at: data.created_at ?? undefined,
  }, data.created_at ?? undefined);

  const progressUpdates = await updateActiveCompetitionProgressForUser(supabase, user.id);
  const adminSupabase = createOptionalSupabaseAdminClient();
  const challengeUpdates = adminSupabase ? await updateActiveChallengesForUser(adminSupabase, user.id) : [];
  const xpFeedback = await syncUserXP(supabase, user.id);

  await revalidateAll(progressUpdates.map((u) => u.competitionId), challengeUpdates.map((u) => u.challengeId));
  return NextResponse.json({ workout: data, progressUpdates, challengeUpdates, xpFeedback });
}
