import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sendPushNotification } from "@/lib/send-push";
import { GOAL_CONFIG, type GoalType } from "@/lib/challenge-progress";

const VALID_GOAL_TYPES = Object.keys(GOAL_CONFIG) as GoalType[];
const MAX_DURATION = 90;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { challenged_id, title, description, goal_type, target_value, duration_days } =
    body as {
      challenged_id?: string;
      title?: string;
      description?: string;
      goal_type?: string;
      target_value?: number;
      duration_days?: number;
    };

  // ── Validations ──────────────────────────────────────────────────────────────
  if (!challenged_id || typeof challenged_id !== "string")
    return NextResponse.json({ error: "challenged_id required" }, { status: 400 });

  if (challenged_id === user.id)
    return NextResponse.json({ error: "Você não pode se desafiar" }, { status: 400 });

  if (!title || typeof title !== "string" || title.trim().length < 3)
    return NextResponse.json(
      { error: "Título deve ter no mínimo 3 caracteres" },
      { status: 400 }
    );

  if (!goal_type || !VALID_GOAL_TYPES.includes(goal_type as GoalType))
    return NextResponse.json({ error: "Modalidade inválida" }, { status: 400 });

  if (typeof target_value !== "number" || target_value <= 0)
    return NextResponse.json({ error: "Meta deve ser maior que zero" }, { status: 400 });

  if (
    typeof duration_days !== "number" ||
    duration_days < 1 ||
    duration_days > MAX_DURATION
  )
    return NextResponse.json(
      { error: `Duração deve ser entre 1 e ${MAX_DURATION} dias` },
      { status: 400 }
    );

  // ── Insert ───────────────────────────────────────────────────────────────────
  const { data: challenge, error } = await supabase
    .from("challenges")
    .insert({
      creator_id: user.id,
      challenged_id,
      title: title.trim(),
      description: description?.trim() ?? null,
      goal_type,
      target_value,
      duration_days,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505")
      return NextResponse.json(
        { error: "Já existe um desafio ativo entre vocês" },
        { status: 409 }
      );
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  const { data: creatorProfile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("user_id", user.id)
    .single();

  const creatorName =
    creatorProfile?.display_name || creatorProfile?.username || "Alguém";

  await supabase.from("notifications").insert({
    user_id: challenged_id,
    type: "challenge_received",
    title: "Novo desafio!",
    message: `${creatorName} te desafiou: "${title.trim()}"`,
    data: {
      challenge_id: challenge.id,
      challenger_id: user.id,
      challenger_username: creatorProfile?.username ?? null,
    },
  });

  const { data: challengedProfile } = await supabase
    .from("profiles")
    .select("onesignal_player_id")
    .eq("user_id", challenged_id)
    .single();

  if (challengedProfile?.onesignal_player_id) {
    await sendPushNotification({
      playerIds: [challengedProfile.onesignal_player_id],
      title: `${creatorName} te desafiou! 🔥`,
      message: `"${title.trim()}" – aceite o duelo!`,
      data: { type: "challenge_received", challenge_id: challenge.id },
    });
  }

  revalidatePath("/desafios-competicoes");
  revalidatePath("/desafios");

  return NextResponse.json({ id: challenge.id }, { status: 201 });
}
