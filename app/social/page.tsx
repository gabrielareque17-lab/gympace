import { redirect } from "next/navigation";
import { Medal } from "lucide-react";

import { AppShell } from "@/components/ui/layout/app-shell";
import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { WeeklyLeaderboard } from "@/components/social/WeeklyLeaderboard";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getActiveSeason, daysRemaining, seasonProgress } from "@/lib/seasons";
import { getGlobalLeaderboard, getFriendsLeaderboard } from "@/lib/leaderboard";
import { syncUserXP } from "@/lib/xp";

export const dynamic = "force-dynamic";

const RANK_COLORS: Record<string, string> = {
  rookie:   "#94A3B8",
  bronze:   "#CD7F32",
  silver:   "#A1A1AA",
  gold:     "#EAB308",
  platinum: "#22D3EE",
  elite:    "#B6FF00",
};

export default async function SocialPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [activeSeason, xpFeedback, profileRes] = await Promise.all([
    getActiveSeason(supabase),
    syncUserXP(supabase, user.id),
    supabase
      .from("profiles")
      .select("username, display_name, avatar_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const profileMeta = profileRes.data as {
    username: string | null;
    display_name: string | null;
    avatar_id: string | null;
  } | null;

  const profile = profileMeta ? {
    username: profileMeta.username,
    display_name: profileMeta.display_name,
    avatar_id: profileMeta.avatar_id,
    rank: xpFeedback.rank,
    current_level: xpFeedback.currentLevel,
    total_xp: xpFeedback.totalXp,
    xp_into_level: xpFeedback.xpIntoLevel,
    xp_for_next_level: xpFeedback.xpForNextLevel,
    level_progress: xpFeedback.levelProgress,
  } : null;

  const [globalEntries, friendsEntries] = await Promise.all([
    getGlobalLeaderboard(supabase, "xp"),
    getFriendsLeaderboard(supabase, user.id, "xp"),
  ]);

  // Garantir que a entrada do usuário atual no leaderboard reflita o XP recém-sincronizado.
  // profiles.total_xp pode estar defasado; xpFeedback.totalXp é a fonte de verdade.
  const myUserId = user.id;
  function patchCurrentUser<T extends { userId: string; totalXp: number; currentLevel: number; rank: string | null }>(entries: T[]): T[] {
    const idx = entries.findIndex((e) => e.userId === myUserId);
    if (idx === -1) return entries;
    const patched = [...entries];
    patched[idx] = { ...patched[idx], totalXp: xpFeedback.totalXp, currentLevel: xpFeedback.currentLevel, rank: xpFeedback.rank };
    return patched.sort((a, b) => b.totalXp - a.totalXp);
  }
  const patchedGlobal = patchCurrentUser(globalEntries);
  const patchedFriends = patchCurrentUser(friendsEntries);

  const displayScore = profile?.total_xp ?? 0;
  const scoreLabel = "XP total";

  const rankColor = RANK_COLORS[profile?.rank ?? "rookie"] ?? "#94A3B8";
  const seasonDays = activeSeason ? daysRemaining(activeSeason) : 0;
  const seasonPct = activeSeason ? seasonProgress(activeSeason) : 0;
  const displayName = profile?.display_name ?? profile?.username ?? "Atleta";
  const initials = displayName[0]?.toUpperCase() ?? "?";

  return (
    <AppShell>
      <div className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        {/* Header */}
        <header className="mb-6">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
            Comunidade
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Ranking</h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[#F5F5F5]/40">
            {activeSeason
              ? "Ranking principal por XP total, com a temporada ativa acompanhando em paralelo."
              : "Ranking por XP, sequências e conquistas da comunidade."}
          </p>
        </header>

        <div className="max-w-4xl space-y-5">
          {/* ── Season Banner ──────────────────────────────────────────────── */}
          {activeSeason && (
            <section
              className="relative overflow-hidden rounded-2xl p-5"
              style={{
                border: `1px solid ${activeSeason.color}30`,
                background: `linear-gradient(135deg, ${activeSeason.color}0C 0%, rgba(17,17,17,0) 60%)`,
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(to right, transparent, ${activeSeason.color}55, transparent)` }}
              />
              {/* Season glow */}
              <div
                className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full blur-[64px]"
                style={{ background: `${activeSeason.color}12` }}
              />

              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{ borderColor: `${activeSeason.color}40`, color: activeSeason.color, background: `${activeSeason.color}12` }}
                    >
                      Temporada Ativa
                    </span>
                    {activeSeason.xpMultiplier > 1 && (
                      <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                        ×{activeSeason.xpMultiplier} XP
                      </span>
                    )}
                  </div>
                  <h2
                    className="mt-2 font-display text-xl font-bold"
                    style={{ color: activeSeason.color }}
                  >
                    {activeSeason.name}
                  </h2>
                  {activeSeason.description && (
                    <p className="mt-1 text-xs leading-relaxed text-[#F5F5F5]/45">
                      {activeSeason.description}
                    </p>
                  )}
                </div>

                <div className="shrink-0 sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#F5F5F5]/30">
                    Restam
                  </p>
                  <p className="font-display text-3xl font-bold" style={{ color: activeSeason.color }}>
                    {seasonDays}
                  </p>
                  <p className="text-xs text-[#F5F5F5]/30">dias</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative mt-4">
                <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${seasonPct}%`,
                      background: activeSeason.color,
                      boxShadow: `0 0 8px ${activeSeason.color}88`,
                    }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-[#F5F5F5]/20">
                  {seasonPct}% concluída
                </p>
              </div>
            </section>
          )}

          {/* ── User Snapshot ──────────────────────────────────────────────── */}
          <section className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#111111] px-5 py-4">
            <AvatarDisplay avatarId={profile?.avatar_id ?? null} initials={initials} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#F5F5F5]/90">{displayName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
                  style={{ background: `${rankColor}20`, color: rankColor }}
                >
                  Nv {profile?.current_level ?? 1} · {(profile?.rank ?? "rookie")}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-lg font-bold text-[#B6FF00]">
                {displayScore.toLocaleString("pt-BR")}
              </p>
              <p className="text-[9px] text-[#F5F5F5]/28">{scoreLabel}</p>
            </div>
          </section>

          {/* ── Leaderboard ────────────────────────────────────────────────── */}
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="relative border-b border-white/[0.05] px-5 py-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
                Ranking
              </p>
              <h2 className="font-display text-base font-semibold flex items-center gap-2">
                <Medal className="size-4 text-[#EAB308]" strokeWidth={2} />
                Leaderboard
              </h2>
              <p className="mt-1 text-xs text-[#F5F5F5]/32">
                XP global acumulado em perfil, dashboard, feed e progressão.
              </p>
            </div>
            <div className="p-4">
              <WeeklyLeaderboard
                globalEntries={patchedGlobal}
                friendsEntries={patchedFriends}
                currentUserId={user.id}
                mode="xp"
              />
            </div>
          </section>

        </div>
      </div>
    </AppShell>
  );
}
