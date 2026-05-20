import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserStreaks, syncStreaksForUser } from "@/lib/streaks";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const streaks = await getUserStreaks(supabase, user.id);
  return NextResponse.json({ streaks });
}

/** POST /api/streaks — force-recalculate (admin/debug use) */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const streaks = await syncStreaksForUser(supabase, user.id);
  return NextResponse.json({ streaks });
}
