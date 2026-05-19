import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json({ results: [] });

  const { data } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, avatar_id")
    .neq("user_id", user.id)
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(8);

  return NextResponse.json({ results: data ?? [] });
}
