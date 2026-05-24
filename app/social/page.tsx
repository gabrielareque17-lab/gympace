import { redirect } from "next/navigation";
import { Medal } from "lucide-react";

import { AppShell } from "@/components/ui/layout/app-shell";
import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { SeasonLeagueBadge } from "@/components/seasons/season-league-badge";
import { WeeklyLeaderboard } from "@/components/social/WeeklyLeaderboard";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getActiveSeason, daysRemaining, seasonProgress } from "@/lib/seasons";
import { getGlobalLeaderboard, getFriendsLeaderboard, type LeaderboardEntry } from "@/lib/leaderboard";
import { calculateSeasonScores, getSeasonDateWindow, type SeasonActivityRun, type SeasonActivityWorkout, type SeasonScoreBreakdown } from "@/lib/season-points";
import { calculateLevelFromXP, getLevelProgress, getRankForLevel, syncUserXP } from "@/lib/xp";
import { getAthleteTitle } from "@/lib/athlete-title";
import { customAvatarRowToDefinition, type CustomAvatarRow } from "@/lib/custom-avatars";

export const dynamic = "force-dynamic";

const EMPTY_SEASON_BREAKDOWN: SeasonScoreBreakdown = { points: 0, runs: 0, workouts: 0, km: 0, activeDays: 0, hybridDays: 0 };

export default async function SocialPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const userId = user.id;

  const [activeSeason, profileRes] = await Promise.all([
    getActiveSeason(supabase),
    supabase
      .from("profiles")
      .select("username, display_name, avatar_id, rank, current_level, total_xp")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const profileMeta = profileRes.data as {
    username: string | null;
    display_name: string | null;
    avatar_id: string | null;
    rank: string | null;
    current_level: number | null;
    total_xp: number | null;
  } | null;
  const xpFeedback = await syncUserXP(supabase, userId);
  const totalXp = xpFeedback.totalXp;
  const currentLevel = calculateLevelFromXP(totalXp);
  const currentRank = getRankForLevel(currentLevel);
  const levelState = getLevelProgress(totalXp);

  const profile = profileMeta ? {
    username: profileMeta.username,
    display_name: profileMeta.display_name,
    avatar_id: profileMeta.avatar_id,
    rank: currentRank,
    current_level: currentLevel,
    total_xp: totalXp,
    xp_into_level: levelState.xpIntoLevel,
    xp_for_next_level: levelState.xpForNextLevel,
    level_progress: levelState.levelProgress,
  } : null;

  async function getCurrentUserSeasonScores(): Promise<Record<string, SeasonScoreBreakdown>> {
    if (!activeSeason) return {};

    const window = getSeasonDateWindow(activeSeason);
    const [runsResult, workoutsResult] = await Promise.all([
      supabase
        .from("runs")
        .select("user_id, distance, created_at")
        .eq("user_id", userId)
        .gte("created_at", window.start)
        .lte("created_at", window.end),
      supabase
        .from("workouts")
        .select("user_id, duration_minutes, created_at")
        .eq("user_id", userId)
        .gte("created_at", window.start)
        .lte("created_at", window.end),
    ]);

    const missingWorkouts =
      workoutsResult.error &&
      (workoutsResult.error.code === "42P01" ||
        workoutsResult.error.message?.toLowerCase().includes("workouts"));

    return calculateSeasonScores(
      activeSeason,
      (runsResult.data ?? []) as SeasonActivityRun[],
      missingWorkouts ? [] : ((workoutsResult.data ?? []) as SeasonActivityWorkout[])
    );
  }

  const [globalEntries, friendsEntries, mySeasonScores] = await Promise.all([
    getGlobalLeaderboard(supabase, "xp", activeSeason),
    getFriendsLeaderboard(supabase, userId, "xp", activeSeason),
    getCurrentUserSeasonScores(),
  ]);
  const mySeasonBreakdown = mySeasonScores[userId] ?? EMPTY_SEASON_BREAKDOWN;
  const { data: currentCustomAvatar } = profileMeta?.avatar_id?.startsWith("custom-")
    ? await supabase
        .from("custom_avatars")
        .select("id,name,type,category,label,description,primary_color,accent_color,secondary_color,background_color,outfit_color,hair_style,hair_color,face_style,accessory,glow_color,rarity,gender,unlock_kind,unlock_label,female,exclusive,trophy_id,assigned_to,is_active,metadata,created_at,updated_at")
        .eq("id", profileMeta.avatar_id)
        .eq("is_active", true)
        .maybeSingle()
    : { data: null };
  const currentAvatarDefinition = currentCustomAvatar
    ? customAvatarRowToDefinition(currentCustomAvatar as CustomAvatarRow)
    : null;

  // Garantir que a entrada do usuário atual reflita o XP recém-sincronizado.
  // profiles.total_xp pode estar defasado; xpFeedback.totalXp é a fonte de verdade.
  // Se o usuário não está no top 200 (pelo XP cacheado), injeta a entrada com dados frescos.
  const myUserId = userId;
  function injectOrPatchCurrentUser(entries: LeaderboardEntry[]): LeaderboardEntry[] {
    const idx = entries.findIndex((e) => e.userId === myUserId);
    if (idx === -1) {
      const injected: LeaderboardEntry = {
        userId: myUserId,
        username: profileMeta?.username ?? null,
        displayName: profileMeta?.display_name ?? null,
        avatarId: profileMeta?.avatar_id ?? null,
        avatarDefinition: currentAvatarDefinition,
        rank: currentRank,
        currentLevel,
        totalXp,
        weeklyKm: 0,
        weeklyWorkouts: 0,
        weeklyScore: 0,
        currentStreak: 0,
        seasonPoints: mySeasonBreakdown.points,
        seasonBreakdown: mySeasonBreakdown,
      };
      return [...entries, injected].sort((a, b) => b.totalXp - a.totalXp);
    }
    const patched = [...entries];
    patched[idx] = {
      ...patched[idx],
      totalXp,
      currentLevel,
      rank: currentRank,
      avatarDefinition: currentAvatarDefinition ?? patched[idx].avatarDefinition,
      seasonPoints: mySeasonBreakdown.points,
      seasonBreakdown: mySeasonBreakdown,
    };
    return patched.sort((a, b) => b.totalXp - a.totalXp);
  }
  const patchedGlobal = injectOrPatchCurrentUser(globalEntries);
  const patchedFriends = injectOrPatchCurrentUser(friendsEntries);

  const displayScore = totalXp;
  const scoreLabel = "XP total";

  const athleteTitle = getAthleteTitle(profile?.rank);
  const seasonDays = activeSeason ? daysRemaining(activeSeason) : 0;
  const seasonPct = activeSeason ? seasonProgress(activeSeason) : 0;
  const displayName = profile?.display_name ?? profile?.username ?? "Atleta";
  const initials = displayName[0]?.toUpperCase() ?? "?";

  return (
    <AppShell>
      <style>{`
        @keyframes gpSeasonPulse {
          0%, 100% {
            box-shadow: 0 0 0 rgba(182,255,0,0), inset 0 0 0 rgba(182,255,0,0);
            transform: translateY(0);
          }
          50% {
            box-shadow: 0 0 34px rgba(182,255,0,0.10), inset 0 0 22px rgba(182,255,0,0.035);
            transform: translateY(-1px);
          }
        }
        @keyframes gpSeasonSweep {
          0% { transform: translateX(-120%); opacity: 0; }
          18% { opacity: 0.45; }
          45% { opacity: 0.12; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        @media (prefers-reduced-motion: no-preference) {
          .gp-season-card {
            animation: gpSeasonPulse 3.8s ease-in-out infinite;
          }
          .gp-season-sweep {
            animation: gpSeasonSweep 4.8s ease-in-out infinite;
          }
        }
      `}</style>
      <div className="min-w-0 flex-1 px-4 pb-4 pt-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="mb-4 sm:mb-8">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
            Comunidade
          </p>
          <h1
            className="leading-none text-white"
            style={{ fontFamily: "var(--font-hero)", fontSize: "clamp(2rem, 4vw, 2.75rem)", letterSpacing: "0.04em" }}
          >
            Ranking
          </h1>
          <p className="mt-2 hidden max-w-lg text-sm leading-6 text-[#F5F5F5]/40 sm:block">
            {activeSeason
              ? "Ranking principal por XP total, com a temporada ativa acompanhando em paralelo."
              : "Ranking por XP, sequências e conquistas da comunidade."}
          </p>
        </header>

        <div className="max-w-4xl space-y-3 sm:space-y-5">
          {/* ── Season Banner ──────────────────────────────────────────────── */}
          {activeSeason && (
            <section
              className="gp-season-card relative overflow-hidden rounded-2xl p-5"
              style={{
                border: `1px solid ${activeSeason.color}30`,
                background: `linear-gradient(135deg, ${activeSeason.color}0C 0%, rgba(17,17,17,0) 60%)`,
              }}
            >
              <div
                className="gp-season-sweep pointer-events-none absolute inset-y-0 -left-1/3 w-1/2 rotate-12"
                style={{ background: `linear-gradient(90deg, transparent, ${activeSeason.color}16, transparent)` }}
              />
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
                    className="mt-2 leading-none"
                    style={{ fontFamily: "var(--font-hero)", fontSize: "1.5rem", letterSpacing: "0.04em", color: activeSeason.color }}
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
                  <p className="leading-none" style={{ fontFamily: "var(--font-hero)", fontSize: "2.5rem", letterSpacing: "0.04em", color: activeSeason.color }}>
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
          <section
            className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] px-4 py-3.5 sm:px-5 sm:py-4"
            style={{ boxShadow: "0 0 0 1px rgba(182,255,0,0.04) inset" }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B6FF00]/10 to-transparent" />
            <div className="flex items-center gap-3.5">
              <AvatarDisplay avatarId={profile?.avatar_id ?? null} definition={currentAvatarDefinition} initials={initials} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#F5F5F5]/92">{displayName}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span
                    className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.10em]"
                    style={{ background: `${athleteTitle.color}18`, color: athleteTitle.color }}
                  >
                    Nv {profile?.current_level ?? 1} · {athleteTitle.label}
                  </span>
                  {activeSeason && (
                    <SeasonLeagueBadge points={totalXp} seasonName={activeSeason.name} compact />
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-lg font-bold leading-none text-[#B6FF00]" style={{ textShadow: "0 0 16px rgba(182,255,0,0.35)" }}>
                  {displayScore.toLocaleString("pt-BR")}
                </p>
                <p className="mt-1 text-[9px] text-[#F5F5F5]/28">{scoreLabel}</p>
              </div>
            </div>
          </section>

          {/* ── Leaderboard ────────────────────────────────────────────────── */}
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="relative border-b border-white/[0.05] px-5 py-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
                Ranking
              </p>
              <h2 className="flex items-center gap-2 leading-none text-white" style={{ fontFamily: "var(--font-hero)", fontSize: "1.25rem", letterSpacing: "0.04em" }}>
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
                currentUserId={userId}
                mode="xp"
                hasSeason={!!activeSeason}
              />
            </div>
          </section>

        </div>
      </div>
    </AppShell>
  );
}
