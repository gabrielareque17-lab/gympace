import { NextResponse } from "next/server";

import { sendPushNotification } from "@/lib/send-push";
import { createOptionalSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const MAX_TITLE_LEN = 120;
const MAX_MSG_LEN = 500;

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

  const { user_id, title, message } = body as { user_id?: string; title?: string; message?: string };
  const cleanTitle = title?.trim() ?? "";
  const cleanMessage = message?.trim() ?? "";

  if (!user_id) return NextResponse.json({ error: "Usuário obrigatório" }, { status: 400 });
  if (!cleanTitle) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
  if (!cleanMessage) return NextResponse.json({ error: "Mensagem obrigatória" }, { status: 400 });
  if (cleanTitle.length > MAX_TITLE_LEN) return NextResponse.json({ error: "Título muito longo" }, { status: 400 });
  if (cleanMessage.length > MAX_MSG_LEN) return NextResponse.json({ error: "Mensagem muito longa" }, { status: 400 });

  const supabase = createOptionalSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for admin notifications." }, { status: 503 });
  }
  const { data: target } = await supabase
    .from("profiles")
    .select("user_id, onesignal_player_id")
    .eq("user_id", user_id)
    .maybeSingle();

  if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const { error } = await supabase.from("notifications").insert({
    user_id,
    type: "admin_update",
    title: cleanTitle,
    message: cleanMessage,
    data: { admin_id: admin.id },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("admin_events").insert({
    admin_id: admin.id,
    event_type: "notify_user",
    target_user_id: user_id,
    payload: { title: cleanTitle },
  });

  if (target.onesignal_player_id) {
    await sendPushNotification({
      playerIds: [target.onesignal_player_id],
      title: cleanTitle,
      message: cleanMessage,
      data: { type: "admin_update" },
    });
  }

  return NextResponse.json({ ok: true });
}
