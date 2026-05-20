import { NextResponse } from "next/server";

import { createFeedEvent } from "@/lib/feed";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sendPushNotification } from "@/lib/send-push";

type Action = "accept" | "decline" | "cancel";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action } = body as { action?: Action };
  if (!action || !["accept", "decline", "cancel"].includes(action))
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });

  // ── Fetch challenge ──────────────────────────────────────────────────────────
  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, creator_id, challenged_id, status, duration_days, title")
    .eq("id", id)
    .single();

  if (!challenge)
    return NextResponse.json({ error: "Desafio não encontrado" }, { status: 404 });

  const isCreator = challenge.creator_id === user.id;
  const isChallenged = challenge.challenged_id === user.id;

  // ── Permission checks ────────────────────────────────────────────────────────
  if (action === "accept" || action === "decline") {
    if (!isChallenged)
      return NextResponse.json({ error: "Apenas o desafiado pode responder" }, { status: 403 });
    if (challenge.status !== "pending")
      return NextResponse.json({ error: "Desafio não está pendente" }, { status: 409 });
  }

  if (action === "cancel") {
    if (!isCreator && !isChallenged)
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    if (!["pending", "active"].includes(challenge.status))
      return NextResponse.json({ error: "Não é possível cancelar" }, { status: 409 });
  }

  // ── Build update ─────────────────────────────────────────────────────────────
  const now = new Date();
  let updates: Record<string, unknown>;

  if (action === "accept") {
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + Number(challenge.duration_days));
    updates = {
      status: "active",
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
    };
  } else if (action === "decline") {
    updates = { status: "declined" };
  } else {
    updates = { status: "canceled" };
  }

  const { error } = await supabase.from("challenges").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Notify the other party on accept ────────────────────────────────────────
  if (action === "accept") {
    const notifyUserId = challenge.creator_id;

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("user_id", user.id)
      .single();

    const myName = myProfile?.display_name || myProfile?.username || "Alguém";

    const adminSupabase = createSupabaseAdminClient();
    await adminSupabase.from("notifications").insert({
      user_id: notifyUserId,
      type: "challenge_accepted",
      title: "Desafio aceito!",
      message: `${myName} aceitou seu desafio "${challenge.title}". O duelo começa agora!`,
      data: { challenge_id: id },
    });

    const { data: creatorProfile } = await adminSupabase
      .from("profiles")
      .select("onesignal_player_id")
      .eq("user_id", notifyUserId)
      .single();

    if (creatorProfile?.onesignal_player_id) {
      await sendPushNotification({
        playerIds: [creatorProfile.onesignal_player_id],
        title: "Desafio aceito! ⚡",
        message: `${myName} aceitou. O duelo começou!`,
        data: { type: "challenge_accepted", challenge_id: id },
      });
    }

    await createFeedEvent(supabase, {
      userId: user.id,
      eventType: "challenge_accepted",
      dedupeKey: `challenge_accepted:${id}`,
      payload: { challenge_id: id },
    });
  }

  return NextResponse.json({ ok: true });
}
