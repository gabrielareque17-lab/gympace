import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { updateActiveCompetitionProgressForUser } from "@/lib/competition-progress";
import { insertFeedEvent } from "@/lib/feed";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { syncUserXP } from "@/lib/xp";

export const dynamic = "force-dynamic";

const VALID_RUN_TYPES = ["leve", "intervalado", "longao", "regenerativo", "prova", "ritmo"] as const;

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("runs")
    .select("id,distance,pace,duration,run_type,notes,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ runs: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const distance = Number(body?.distance);
  const pace = String(body?.pace ?? "").trim();
  const duration = String(body?.duration ?? "").trim();
  const runType = String(body?.run_type ?? "leve").trim();
  const notes = String(body?.notes ?? "").trim() || null;

  if (!Number.isFinite(distance) || distance <= 0) {
    return NextResponse.json({ error: "Distância inválida" }, { status: 400 });
  }
  if (!pace || !duration) {
    return NextResponse.json({ error: "Pace e duração são obrigatórios" }, { status: 400 });
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
    })
    .select("id,distance,pace,duration,run_type,notes,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const progressUpdates = await updateActiveCompetitionProgressForUser(supabase, user.id);
  const xpFeedback = await syncUserXP(supabase, user.id);

  await insertFeedEvent(supabase, user.id, "run", {
    id: data.id,
    distance: data.distance,
    pace: data.pace ?? undefined,
    run_type: data.run_type ?? undefined,
  });
  if (xpFeedback.leveledUp) {
    await insertFeedEvent(supabase, user.id, "level_up", {
      new_level: xpFeedback.currentLevel,
      new_rank: xpFeedback.rank,
      total_xp: xpFeedback.totalXp,
    });
  }

  revalidatePath("/");
  revalidatePath("/corridas");
  revalidatePath("/feed");
  revalidatePath("/metas");
  revalidatePath("/competicoes");
  for (const update of progressUpdates) {
    revalidatePath(`/competicoes/${update.competitionId}`);
  }

  return NextResponse.json({ run: data, progressUpdates, xpFeedback }, { status: 201 });
}
