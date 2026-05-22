import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { syncUserXP } from "@/lib/xp";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();
  return (profile as { is_admin?: boolean } | null)?.is_admin ? user : null;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const b = body as { user_id?: string; limit?: number };
  const userId = String(b.user_id ?? "").trim();

  const supabaseAdmin = createSupabaseAdminClient();

  if (userId) {
    const result = await syncUserXP(supabaseAdmin, userId);
    return NextResponse.json({
      mode: "single",
      user_id: userId,
      previous_xp: result.previousXp,
      total_xp: result.totalXp,
      gained_xp: result.gainedXp,
      current_level: result.currentLevel,
      rank: result.rank,
    });
  }

  const limit = Math.max(1, Math.min(Number(b.limit ?? 150), 1000));
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [runsRes, workoutsRes] = await Promise.all([
    supabaseAdmin.from("runs").select("user_id").gte("created_at", since).limit(5000),
    supabaseAdmin.from("workouts").select("user_id").gte("created_at", since).limit(5000),
  ]);

  const userIds = [...new Set([
    ...((runsRes.data ?? []) as { user_id: string }[]).map((r) => r.user_id),
    ...((workoutsRes.data ?? []) as { user_id: string }[]).map((w) => w.user_id),
  ])].slice(0, limit);

  const syncResults = await Promise.allSettled(userIds.map((id) => syncUserXP(supabaseAdmin, id)));
  const updated = syncResults.filter((r) => r.status === "fulfilled").length;
  const failed = syncResults.length - updated;

  return NextResponse.json({
    mode: "batch_recent_active",
    since,
    requested: userIds.length,
    updated,
    failed,
  });
}

