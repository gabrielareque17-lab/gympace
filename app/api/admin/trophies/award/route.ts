import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createOptionalSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { awardTrophy } from "@/lib/trophies";

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

  const supabase = createOptionalSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for awarding trophies." }, { status: 503 });
  }

  const result = await awardTrophy(supabase, {
    userId: user_id,
    trophyId: trophy_id,
    awardedBy: admin.id,
    note,
    feed: true,
    push: true,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (result.alreadyHad) {
    return NextResponse.json({ error: "Usuário já possui este troféu" }, { status: 409 });
  }

  await supabase.from("admin_events").insert({
    admin_id: admin.id,
    event_type: "award_trophy",
    target_user_id: user_id,
    payload: { trophy_id },
  });

  const { data: target } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", user_id)
    .maybeSingle();

  if (target?.username) revalidatePath(`/perfil/${target.username}`);

  return NextResponse.json({ grant: result.grant }, { status: 201 });
}
