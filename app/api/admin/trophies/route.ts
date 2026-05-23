import { NextResponse } from "next/server";

import { createOptionalSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const RARITIES = ["common", "rare", "epic", "legendary", "mythic"];

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
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for admin trophies." }, { status: 503 });
  }
  const [{ data: trophies, error }, { data: grants }] = await Promise.all([
    supabase.from("exclusive_trophies").select("*").order("created_at", { ascending: false }),
    supabase
      .from("user_trophies")
      .select("id,user_id,trophy_id,awarded_at,awarded_by,note,exclusive_trophies(name,rarity,visual)")
      .order("awarded_at", { ascending: false })
      .limit(50),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trophies: trophies ?? [], grants: grants ?? [] });
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
  const name = String(b.name ?? "").trim();
  const description = String(b.description ?? "").trim() || null;
  const rarity = String(b.rarity ?? "rare").trim();
  const visual = String(b.visual ?? "trophy").trim();
  const isUnique = b.is_unique === undefined ? true : Boolean(b.is_unique);
  const slug = String(b.slug ?? name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  if (!slug) return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
  if (!RARITIES.includes(rarity)) return NextResponse.json({ error: "Raridade inválida" }, { status: 400 });

  const supabase = createOptionalSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for admin trophies." }, { status: 503 });
  }
  const { data, error } = await supabase
    .from("exclusive_trophies")
    .insert({
      slug,
      name,
      description,
      rarity,
      visual,
      is_unique: isUnique,
      created_by: admin.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Troféu já existe" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("admin_events").insert({
    admin_id: admin.id,
    event_type: "create_trophy",
    payload: { trophy_id: data.id, name },
  });

  return NextResponse.json({ trophy: data }, { status: 201 });
}
