import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);
  const before = searchParams.get("before") ?? undefined;

  let query = supabase
    .from("feed_comments")
    .select("id,user_id,content,created_at")
    .eq("feed_event_id", id)
    .order("created_at", { ascending: true })
    .limit(limit + 1);

  if (before) query = query.lt("created_at", before);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const comments = hasMore ? rows.slice(0, limit) : rows;

  const userIds = [...new Set(comments.map((c: { user_id: string }) => c.user_id))];
  let profileMap: Record<string, { username: string | null; display_name: string | null; avatar_id: string | null }> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id,username,display_name,avatar_id")
      .in("user_id", userIds);

    profileMap = Object.fromEntries(
      ((profiles ?? []) as { user_id: string; username: string | null; display_name: string | null; avatar_id: string | null }[])
        .map((p) => [p.user_id, { username: p.username, display_name: p.display_name, avatar_id: p.avatar_id }])
    );
  }

  const enriched = comments.map((c: { id: string; user_id: string; content: string; created_at: string }) => ({
    ...c,
    profile: profileMap[c.user_id] ?? null,
    can_manage: c.user_id === user.id,
  }));

  return NextResponse.json({ comments: enriched, hasMore });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const content = String((body as Record<string, unknown>)?.content ?? "").trim();
  if (!content || content.length > 500) {
    return NextResponse.json({ error: "Comentário inválido (1–500 caracteres)" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("feed_comments")
    .insert({ feed_event_id: id, user_id: user.id, content })
    .select("id,user_id,content,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("username,display_name,avatar_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    comment: {
      ...(data as { id: string; user_id: string; content: string; created_at: string }),
      profile: profile ?? null,
      can_manage: true,
    },
  }, { status: 201 });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const commentId = String((body as Record<string, unknown>)?.commentId ?? "");
  const content = String((body as Record<string, unknown>)?.content ?? "").trim();
  if (!commentId) return NextResponse.json({ error: "ComentÃ¡rio nÃ£o informado" }, { status: 400 });
  if (!content || content.length > 500) {
    return NextResponse.json({ error: "ComentÃ¡rio invÃ¡lido (1â€“500 caracteres)" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("feed_comments")
    .update({ content })
    .eq("id", commentId)
    .eq("feed_event_id", id)
    .eq("user_id", user.id)
    .select("id,user_id,content,created_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "ComentÃ¡rio nÃ£o encontrado" }, { status: 404 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("username,display_name,avatar_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    comment: {
      ...(data as { id: string; user_id: string; content: string; created_at: string }),
      profile: profile ?? null,
      can_manage: true,
    },
  });
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const commentId = String((body as Record<string, unknown>)?.commentId ?? "");
  if (!commentId) return NextResponse.json({ error: "ComentÃ¡rio nÃ£o informado" }, { status: 400 });

  const { error } = await supabase
    .from("feed_comments")
    .delete()
    .eq("id", commentId)
    .eq("feed_event_id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
