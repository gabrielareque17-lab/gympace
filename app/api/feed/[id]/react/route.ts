import { NextResponse } from "next/server";

import { isRateLimited } from "@/lib/security";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** POST — toggle like on a feed event */
export async function POST(_req: Request, { params }: Params) {
  const { id: feedEventId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (await isRateLimited(supabase, {
    table: "feed_reactions",
    userColumn: "user_id",
    userId: user.id,
    max: 30,
    windowSeconds: 60,
  })) {
    return NextResponse.json({ error: "Muitas reações em pouco tempo." }, { status: 429 });
  }

  const { data: feedEvent } = await supabase
    .from("activities_feed")
    .select("id")
    .eq("id", feedEventId)
    .maybeSingle();
  if (!feedEvent) return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 });

  // Check if already reacted
  const { data: existing } = await supabase
    .from("feed_reactions")
    .select("id")
    .eq("feed_event_id", feedEventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Un-like
    await supabase
      .from("feed_reactions")
      .delete()
      .eq("feed_event_id", feedEventId)
      .eq("user_id", user.id);
    return NextResponse.json({ reacted: false });
  }

  // Like
  const { error: insertError } = await supabase
    .from("feed_reactions")
    .insert({ feed_event_id: feedEventId, user_id: user.id, reaction_type: "like" });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ reacted: true });
}

/** GET — get reaction count + whether current user liked */
export async function GET(_req: Request, { params }: Params) {
  const { id: feedEventId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [countRes, userRes] = await Promise.all([
    supabase
      .from("feed_reactions")
      .select("id", { count: "exact", head: true })
      .eq("feed_event_id", feedEventId),
    supabase
      .from("feed_reactions")
      .select("id")
      .eq("feed_event_id", feedEventId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    count: countRes.count ?? 0,
    reacted: !!userRes.data,
  });
}
