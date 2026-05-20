import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sendPushNotification } from "@/lib/send-push";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();
  return profile?.is_admin ? user : null;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { user_id, trophy_id, note } = body as { user_id?: string; trophy_id?: string; note?: string };
  if (!user_id || !trophy_id) {
    return NextResponse.json({ error: "user_id e trophy_id são obrigatórios" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("user_id, username, onesignal_player_id")
    .eq("user_id", user_id)
    .maybeSingle();
  if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const { data: trophy } = await supabase
    .from("exclusive_trophies")
    .select("id, name")
    .eq("id", trophy_id)
    .maybeSingle();
  if (!trophy) return NextResponse.json({ error: "Troféu não encontrado" }, { status: 404 });

  const { data, error } = await supabase
    .from("user_trophies")
    .insert({
      user_id,
      trophy_id,
      awarded_by: admin.id,
      note: note?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Usuário já possui este troféu" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("notifications").insert({
    user_id,
    type: "exclusive_trophy",
    title: "Troféu exclusivo recebido",
    message: `Você recebeu: ${trophy.name}`,
    data: { trophy_id },
  });

  if (target.onesignal_player_id) {
    await sendPushNotification({
      playerIds: [target.onesignal_player_id],
      title: "Troféu exclusivo recebido",
      message: `Você recebeu: ${trophy.name}`,
      data: { type: "exclusive_trophy", trophy_id },
    });
  }

  await supabase.from("admin_events").insert({
    admin_id: admin.id,
    event_type: "award_trophy",
    target_user_id: user_id,
    payload: { trophy_id, trophy_name: trophy.name },
  });

  if (target.username) revalidatePath(`/perfil/${target.username}`);
  return NextResponse.json({ grant: data }, { status: 201 });
}
