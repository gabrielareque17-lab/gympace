import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getFeedEvents } from "@/lib/feed";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const before = searchParams.get("before") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);

  const events = await getFeedEvents(supabase, user.id, limit, before);
  return NextResponse.json({ events });
}
