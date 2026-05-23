import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/ui/layout/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase-admin";
import { FollowList, type FollowUser } from "@/components/social/follow-list";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ username: string }> };

export default async function SeguidoresPage({ params }: Props) {
  const { username } = await params;
  const supabase = await createSupabaseServerClient();
  const dataSupabase = hasSupabaseAdminEnv() ? createSupabaseAdminClient() : supabase;

  const { data: profile } = await dataSupabase
    .from("profiles")
    .select("user_id, username, display_name")
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data: followRows } = await dataSupabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", profile.user_id);

  const followerIds = (followRows ?? []).map((r) => r.follower_id as string);

  let users: FollowUser[] = [];

  if (followerIds.length > 0) {
    const [{ data: profiles }, viewerFollows] = await Promise.all([
      dataSupabase
        .from("profiles")
        .select("user_id, username, display_name, bio, avatar_id")
        .in("user_id", followerIds),
      currentUser
        ? supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", currentUser.id)
            .in("following_id", followerIds)
        : Promise.resolve({ data: null }),
    ]);

    const viewingSet = new Set(
      (viewerFollows.data ?? []).map((r) => r.following_id as string)
    );

    users = (profiles ?? []).map((p) => ({
      user_id: p.user_id,
      username: p.username,
      display_name: p.display_name,
      bio: p.bio,
      avatar_id: p.avatar_id,
      isFollowingThem: viewingSet.has(p.user_id),
      isCurrentUser: currentUser?.id === p.user_id,
    }));
  }

  const displayName = profile.display_name || profile.username || "Atleta";
  const count = users.length;

  return (
    <AppShell>
      <div className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        <div className="max-w-lg">
          <div className="mb-6">
            <Link
              href={`/perfil/${username}`}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F5F5F5]/35 transition-colors hover:text-[#F5F5F5]/65"
            >
              <ArrowLeft className="size-3.5" strokeWidth={2} />
              {displayName}
            </Link>
            <h1 className="font-display text-2xl font-bold tracking-tight">Seguidores</h1>
            <p className="mt-0.5 text-sm text-[#F5F5F5]/35">
              {count === 0
                ? `Nenhum seguidor ainda`
                : count === 1
                ? `1 pessoa segue ${displayName}`
                : `${count} pessoas seguem ${displayName}`}
            </p>
          </div>

          <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
            <FollowList
              users={users}
              emptyText="Nenhum seguidor ainda."
              showFollowButtons={!!currentUser}
            />
          </section>
        </div>
      </div>
    </AppShell>
  );
}
