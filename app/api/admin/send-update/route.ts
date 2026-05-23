import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/security";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sendGymPaceUpdate } from "@/lib/send-gympace-update";

const MAX_TITLE_LEN = 120;
const MAX_MSG_LEN = 500;
const MAX_FEATURES_LEN = 2000;
const UPDATE_TYPES = ["feature", "bugfix", "season", "announcement"] as const;
type UpdateType = (typeof UPDATE_TYPES)[number];

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

  const { title, message, features, updateType } = body as {
    title?: string;
    message?: string;
    features?: string;
    updateType?: string;
  };
  const resolvedUpdateType: UpdateType = UPDATE_TYPES.includes(updateType as UpdateType)
    ? (updateType as UpdateType)
    : "feature";

  if (!title?.trim()) {
    return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
  }
  if (!message?.trim()) {
    return NextResponse.json({ error: "Mensagem obrigatória" }, { status: 400 });
  }
  if (!features?.trim()) {
    return NextResponse.json({ error: "Detalhes da atualização obrigatórios" }, { status: 400 });
  }
  if (title.length > MAX_TITLE_LEN) {
    return NextResponse.json(
      { error: `Titulo muito longo (max ${MAX_TITLE_LEN} chars)` },
      { status: 400 }
    );
  }
  if (message.length > MAX_MSG_LEN) {
    return NextResponse.json(
      { error: `Mensagem muito longa (max ${MAX_MSG_LEN} chars)` },
      { status: 400 }
    );
  }
  if (features.length > MAX_FEATURES_LEN) {
    return NextResponse.json(
      { error: `Detalhes muito longos (max ${MAX_FEATURES_LEN} chars)` },
      { status: 400 }
    );
  }
  if (await isRateLimited(supabase, {
    table: "app_updates",
    userColumn: "created_by",
    userId: user.id,
    max: 3,
    windowSeconds: 300,
  })) {
    return NextResponse.json({ error: "Muitos updates enviados em pouco tempo" }, { status: 429 });
  }

  const result = await sendGymPaceUpdate({
    title: title.trim(),
    message: message.trim(),
    features: features.trim(),
    updateType: resolvedUpdateType,
    createdBy: user.id,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, sent: result.sent },
    { headers: { "Content-Type": "application/json; charset=utf-8" } }
  );
}
