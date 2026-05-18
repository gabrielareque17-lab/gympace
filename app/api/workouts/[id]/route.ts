import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { updateActiveCompetitionProgressForUser } from "@/lib/competition-progress";
import { deleteFeedEvent } from "@/lib/feed";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { syncUserXP } from "@/lib/xp";

type Params = { params: Promise<{ id: string }> };

const VALID_GROUPS = ["peito", "costas", "pernas", "ombros", "bracos", "abdomen", "full-body", "biceps", "triceps", "cardio"] as const;
const VALID_INTENSITIES = ["leve", "moderado", "intenso"] as const;

async function revalidateAll(competitionIds: string[] = []) {
  revalidatePath("/");
  revalidatePath("/academia");
  revalidatePath("/feed");
  revalidatePath("/metas");
  revalidatePath("/competicoes");
  for (const id of competitionIds) {
    revalidatePath(`/competicoes/${id}`);
  }
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

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const t = String(body.title).trim();
    if (!t) return NextResponse.json({ error: "Nome do treino é obrigatório" }, { status: 400 });
    updates.title = t;
  }
  if (body.muscle_groups !== undefined) {
    const mgs: string[] = Array.isArray(body.muscle_groups)
      ? (body.muscle_groups as unknown[]).map((g) => String(g).trim()).filter(Boolean)
      : [];
    if (mgs.length === 0 || !mgs.every((g) => VALID_GROUPS.includes(g as (typeof VALID_GROUPS)[number]))) {
      return NextResponse.json({ error: "Grupo muscular inválido" }, { status: 400 });
    }
    updates.muscle_group = mgs[0];
    updates.muscle_groups = mgs;
  } else if (body.muscle_group !== undefined) {
    const mg = String(body.muscle_group).trim();
    if (!VALID_GROUPS.includes(mg as (typeof VALID_GROUPS)[number])) {
      return NextResponse.json({ error: "Grupo muscular inválido" }, { status: 400 });
    }
    updates.muscle_group = mg;
    updates.muscle_groups = [mg];
  }
  if (body.duration_minutes !== undefined) {
    const dm = Number(body.duration_minutes);
    if (!Number.isFinite(dm) || dm <= 0) {
      return NextResponse.json({ error: "Duração inválida" }, { status: 400 });
    }
    updates.duration_minutes = dm;
  }
  if (body.intensity !== undefined) {
    const int = String(body.intensity).trim();
    updates.intensity = VALID_INTENSITIES.includes(int as (typeof VALID_INTENSITIES)[number]) ? int : null;
  }
  if (body.notes !== undefined) updates.notes = String(body.notes).trim() || null;

  const { data, error } = await supabase
    .from("workouts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id,title,muscle_group,muscle_groups,duration_minutes,intensity,notes,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const progressUpdates = await updateActiveCompetitionProgressForUser(supabase, user.id);
  const xpFeedback = await syncUserXP(supabase, user.id);

  await revalidateAll(progressUpdates.map((u) => u.competitionId));

  return NextResponse.json({ workout: data, progressUpdates, xpFeedback });
}
