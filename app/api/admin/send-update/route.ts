import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sendGymPaceUpdate } from "@/lib/send-gympace-update";

const MAX_TITLE_LEN = 120;
const MAX_MSG_LEN = 500;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, message } = body as { title?: string; message?: string };

  if (!title?.trim())
    return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
  if (!message?.trim())
    return NextResponse.json({ error: "Mensagem obrigatória" }, { status: 400 });
  if (title.length > MAX_TITLE_LEN)
    return NextResponse.json(
      { error: `Título muito longo (máx ${MAX_TITLE_LEN} chars)` },
      { status: 400 }
    );
  if (message.length > MAX_MSG_LEN)
    return NextResponse.json(
      { error: `Mensagem muito longa (máx ${MAX_MSG_LEN} chars)` },
      { status: 400 }
    );

  const result = await sendGymPaceUpdate({
    title: title.trim(),
    message: message.trim(),
  });

  if (result.error)
    return NextResponse.json({ error: result.error }, { status: 500 });

  return NextResponse.json({ ok: true, sent: result.sent }, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
