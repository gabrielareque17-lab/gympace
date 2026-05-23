import { NextResponse } from "next/server";

import { AVATAR_REGISTRY, getAvatarById } from "@/lib/avatar-registry";
import { createOptionalSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createOptionalSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for admin avatars." }, { status: 503 });
  }
  const { data: unlocks, error } = await supabase
    .from("user_avatar_unlocks")
    .select("id,user_id,avatar_id,source,source_ref,unlocked_at")
    .order("unlocked_at", { ascending: false })
    .limit(80);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    avatars: AVATAR_REGISTRY,
    unlocks: unlocks ?? [],
  });
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

  const b = body as Record<string, unknown>;
  const userId = String(b.user_id ?? "");
  const avatarId = String(b.avatar_id ?? "");
  const source = String(b.source ?? "admin");
  const sourceRef = String(b.source_ref ?? "").trim() || null;

  if (!userId || !avatarId) {
    return NextResponse.json({ error: "user_id e avatar_id sao obrigatorios" }, { status: 400 });
  }
  if (!["season", "trophy", "achievement", "admin"].includes(source)) {
    return NextResponse.json({ error: "Origem invalida" }, { status: 400 });
  }

  const avatar = getAvatarById(avatarId);
  if (!avatar) return NextResponse.json({ error: "Avatar desconhecido" }, { status: 400 });
  if (avatar.unlock.kind === "free") {
    return NextResponse.json({ error: "Este avatar já é livre para todos" }, { status: 400 });
  }

  const supabase = createOptionalSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for admin avatars." }, { status: 503 });
  }
  const { data, error } = await supabase
    .from("user_avatar_unlocks")
    .insert({
      user_id: userId,
      avatar_id: avatar.id,
      source,
      source_ref: sourceRef,
      unlocked_by: admin.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Usuário já possui este avatar" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("admin_events").insert({
    admin_id: admin.id,
    event_type: "unlock_avatar",
    target_user_id: userId,
    payload: { avatar_id: avatar.id, source },
  });

  return NextResponse.json({ unlock: data }, { status: 201 });
}
