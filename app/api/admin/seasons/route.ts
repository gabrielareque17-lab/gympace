import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getAllSeasons } from "@/lib/seasons";

export const dynamic = "force-dynamic";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!(profile as { is_admin?: boolean } | null)?.is_admin) return null;
  return user;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const user = await requireAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const seasons = await getAllSeasons(supabase);
  return NextResponse.json({ seasons });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const user = await requireAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const name = String(b?.name ?? "").trim();
  const theme = String(b?.theme ?? "ascension").trim();
  const description = String(b?.description ?? "").trim() || null;
  const color = String(b?.color ?? "#B6FF00").trim();
  const xpMultiplier = Number(b?.xp_multiplier ?? 1.0);
  const startDate = String(b?.start_date ?? "").trim();
  const endDate = String(b?.end_date ?? "").trim();
  const isActive = Boolean(b?.is_active ?? false);

  if (!name || !startDate || !endDate) {
    return NextResponse.json({ error: "name, start_date e end_date são obrigatórios" }, { status: 400 });
  }

  // If activating this season, deactivate all others
  if (isActive) {
    await supabase.from("seasons").update({ is_active: false }).neq("id", "placeholder");
  }

  const { data, error } = await supabase
    .from("seasons")
    .insert({
      name, theme, description, color,
      xp_multiplier: xpMultiplier,
      start_date: startDate,
      end_date: endDate,
      is_active: isActive,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/social");
  revalidatePath("/admin/seasons");
  return NextResponse.json({ season: data }, { status: 201 });
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient();
  const user = await requireAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const id = String(b?.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (b.name !== undefined) updates.name = String(b.name).trim();
  if (b.description !== undefined) updates.description = String(b.description).trim() || null;
  if (b.color !== undefined) updates.color = String(b.color).trim();
  if (b.xp_multiplier !== undefined) updates.xp_multiplier = Number(b.xp_multiplier);
  if (b.start_date !== undefined) updates.start_date = String(b.start_date).trim();
  if (b.end_date !== undefined) updates.end_date = String(b.end_date).trim();
  if (b.is_active !== undefined) {
    updates.is_active = Boolean(b.is_active);
    // Deactivate others when activating
    if (Boolean(b.is_active)) {
      await supabase.from("seasons").update({ is_active: false }).neq("id", id);
    }
  }

  const { data, error } = await supabase
    .from("seasons")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/social");
  revalidatePath("/admin/seasons");
  return NextResponse.json({ season: data });
}
