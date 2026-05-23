import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
