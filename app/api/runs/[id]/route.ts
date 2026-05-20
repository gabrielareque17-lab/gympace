import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { updateActiveCompetitionProgressForUser } from "@/lib/competition-progress";
import { deleteFeedEvent } from "@/lib/feed";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { syncStreaksForUser } from "@/lib/streaks";
import { syncUserXP } from "@/lib/xp";

type Params = { params: Promise<{ id: string }> };

const VALID_RUN_TYPES = ["leve", "intervalado", "longao", "regenerativo", "prova", "ritmo", "caminhada", "esteira"] as const;
const MAX_RUN_DISTANCE_KM = 200;

async function revalidateAll(competitionIds: string[] = []) {
  revalidatePath("/");
  revalidatePath("/corridas");
  revalidatePath("/treinos");
  revalidatePath("/feed");
  revalidatePath("/metas");
  revalidatePath("/perfil");
  revalidatePath("/social");
  revalidatePath("/competicoes");
  revalidatePath("/desafios-competicoes");
  for (const id of competitionIds) {
    revalidatePath(`/competicoes/${id}`);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: run } = await supabase
    .from("runs")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabase.from("runs").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await deleteFeedEvent(supabase, user.id, "run", id);

  const [progressUpdates, xpFeedback] = await Promise.all([
    updateActiveCompetitionProgressForUser(supabase, user.id),
    syncUserXP(supabase, user.id),
    syncStreaksForUser(supabase, user.id),
  ]);

  await revalidateAll(progressUpdates.map((u) => u.competitionId));

  return NextResponse.json({ ok: true, progressUpdates, xpFeedback });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabase
    .from("runs")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.distance !== undefined) {
    const dist = Number(body.distance);
    if (!Number.isFinite(dist) || dist <= 0 || dist > MAX_RUN_DISTANCE_KM) {
      return NextResponse.json({ error: "Distância inválida" }, { status: 400 });
    }
    updates.distance = dist;
  }
  if (body.pace !== undefined) updates.pace = String(body.pace).trim();
  if (body.duration !== undefined) updates.duration = String(body.duration).trim();
  if (body.run_type !== undefined) {
    const rt = String(body.run_type).trim();
    updates.run_type = VALID_RUN_TYPES.includes(rt as (typeof VALID_RUN_TYPES)[number]) ? rt : "leve";
  }
  if (body.notes !== undefined) updates.notes = String(body.notes).trim() || null;

  const { data, error } = await supabase
    .from("runs")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id,distance,pace,duration,run_type,notes,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const progressUpdates = await updateActiveCompetitionProgressForUser(supabase, user.id);
  const xpFeedback = await syncUserXP(supabase, user.id);

  await revalidateAll(progressUpdates.map((u) => u.competitionId));

  return NextResponse.json({ run: data, progressUpdates, xpFeedback });
}
