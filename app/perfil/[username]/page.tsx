import { notFound } from "next/navigation";
import Link from "next/link";
import { Flame, Medal, Swords, Trophy } from "lucide-react";

import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { FollowButton } from "@/components/social/follow-button";
import { AppShell } from "@/components/ui/layout/app-shell";
import { getAvatarById } from "@/lib/avatar-registry";
import {
  ACHIEVEMENT_REGISTRY,
  CATEGORIES,
  type AchievementStats,
} from "@/lib/achievements";
import {
  AchievementGrid,
  type AchievementCardData,
} from "@/components/profile/achievement-grid";
import {
  LatestTrophiesSection,
  type TrophyGrant,
} from "@/components/profile/latest-trophies-section";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { normalizeMuscleGroups } from "@/lib/muscles";
import { getLevelProgress } from "@/lib/xp";
import { addAchievementUnlockDates } from "@/lib/achievement-timeline";
import { getLocalDateKey } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ username: string }> };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RANK_STYLES: Record<string, { label: string; color: string }> = {
  rookie:   { label: "Rookie",   color: "#94A3B8" },
  bronze:   { label: "Bronze",   color: "#CD7F32" },
  silver:   { label: "Silver",   color: "#A1A1AA" },
  gold:     { label: "Gold",     color: "#EAB308" },
  platinum: { label: "Platinum", color: "#22D3EE" },
  elite:    { label: "Elite",    color: "#B6FF00" },
};

function parsePaceToSeconds(value: string | null): number | null {
  if (!value) return null;
  const [min, sec] = value.split(":").map(Number);
  if (!isFinite(min) || !isFinite(sec)) return null;
  return min * 60 + sec;
}

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const uniqueDates = Array.from(new Set(dates.map(getLocalDateKey))).sort().reverse();

  const todayStr = getLocalDateKey(new Date());
  const yest = new Date(`${todayStr}T12:00:00`);
  yest.setDate(yest.getDate() - 1);
  const yestStr = getLocalDateKey(yest);

  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yestStr) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1] + "T00:00:00");
    const curr = new Date(uniqueDates[i] + "T00:00:00");
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

function hasPerfectWeek(isoDates: string[]): boolean {
  const weeks: Record<string, Set<string>> = {};
  for (const d of isoDates) {
    const dayKey = getLocalDateKey(d);
    const date = new Date(`${dayKey}T12:00:00`);
    const day = date.getDay();
    const ws = new Date(date);
    ws.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
    const key = getLocalDateKey(ws);
    if (!weeks[key]) weeks[key] = new Set();
    weeks[key].add(dayKey);
  }
  return Object.values(weeks).some((days) => days.size >= 5);
}

const ATHLETE_LABELS: Record<string, string> = {
  runner: "Corredor",
  gym_rat: "Atleta de Academia",
  hybrid_athlete: "Atleta Híbrido",
  power_athlete: "Atleta de Força",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, bio, avatar_id, avatar_type, total_xp, current_level, rank")
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  const isOwnProfile = currentUser?.id === profile.user_id

  const adminSupabase = createSupabaseAdminClient();

  const [
    { data: followRow },
    { count: followersCount },
    { count: followingCount },
    { data: publicStreaks },
    trophiesResult,
  ] = await Promise.all([
    currentUser && !isOwnProfile
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", currentUser.id)
          .eq("following_id", profile.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    adminSupabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.user_id),
    adminSupabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.user_id),
    adminSupabase
      .from("streaks")
      .select("streak_type,current_streak,best_streak,last_activity_date")
      .eq("user_id", profile.user_id),
    adminSupabase
      .from("user_trophies")
      .select("id,awarded_at,awarded_by,note,exclusive_trophies(name,description,rarity,visual)")
      .eq("user_id", profile.user_id)
      .order("awarded_at", { ascending: false }),
  ])

  const isFollowing = !!followRow

  type RunRow = { distance: number; pace: string | null; created_at: string };
  type GymRow = { muscle_group: string | null; muscle_groups: string[] | null; created_at: string };

  const [{ data: rawRuns }, workoutsResult] = await Promise.all([
    adminSupabase
      .from("runs")
      .select("distance, pace, created_at")
      .eq("user_id", profile.user_id),
    adminSupabase
      .from("workouts")
      .select("muscle_group, muscle_groups, created_at")
      .eq("user_id", profile.user_id),
  ]);

  const runs: RunRow[] = (rawRuns ?? []) as RunRow[];
  const workouts: GymRow[] = (
    workoutsResult.error &&
    (workoutsResult.error.code === "42P01" ||
      workoutsResult.error.message?.toLowerCase().includes("workouts"))
      ? []
      : ((workoutsResult.data ?? []) as GymRow[])
  );

  const totalRuns = runs.length;
  const totalKm = runs.reduce((acc, r) => acc + Number(r.distance ?? 0), 0);
  const longestRun = runs.reduce((max, r) => Math.max(max, Number(r.distance ?? 0)), 0);
  const allPaceSeconds = runs
    .map((r) => parsePaceToSeconds(r.pace))
    .filter((p): p is number => p !== null);
  const bestPaceSeconds = allPaceSeconds.length > 0 ? Math.min(...allPaceSeconds) : null;
  const currentStreak = computeStreak(runs.map((r) => r.created_at));

  const profileTotalXp = Number(profile.total_xp ?? 0);
  const profileLevel = Number(profile.current_level ?? 1);
  const rankStyle = RANK_STYLES[profile.rank ?? "rookie"] ?? RANK_STYLES.rookie;
  const { levelProgress: xpLevelProgress } = getLevelProgress(profileTotalXp);

  const avatarDef = profile.avatar_id ? getAvatarById(profile.avatar_id) : undefined;
  const athleteLabel = ATHLETE_LABELS[profile.avatar_type ?? ""] ?? "Atleta";
  const displayName = profile.display_name || profile.username || "Atleta";
  const initials = displayName[0]?.toUpperCase() ?? "?";

  const achievementStats: AchievementStats = {
    totalRuns,
    totalKm,
    longestRun,
    currentStreak,
    bestPaceSeconds,
    gymTotalSessions: workouts.length,
    gymChestSessions: workouts.filter((w) => normalizeMuscleGroups(w.muscle_groups?.length ? w.muscle_groups : (w.muscle_group ? [w.muscle_group] : [])).includes("peito")).length,
    gymLegSessions: workouts.filter((w) => {
      const groups = normalizeMuscleGroups(w.muscle_groups?.length ? w.muscle_groups : (w.muscle_group ? [w.muscle_group] : []));
      return groups.some((g) => ["quadriceps", "posterior-coxa", "gluteos", "panturrilhas"].includes(g));
    }).length,
    gymStreak: computeStreak(workouts.map((w) => w.created_at)),
    gymHasPersonalRecord: false,
    hasPerfectWeek: hasPerfectWeek(workouts.map((w) => w.created_at)),
  };

  const achievements = ACHIEVEMENT_REGISTRY.map((def) => ({
    ...def,
    unlocked: def.check(achievementStats),
  }));
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const achievementCards: AchievementCardData[] = addAchievementUnlockDates({
    runs,
    workouts,
    achievements: achievements.map((a) => ({
      id: a.id,
      category: a.category,
      name: a.name,
      description: a.description,
      iconKey: a.iconKey,
      accentHex: a.accentHex,
      rarity: a.rarity,
      unlocked: a.unlocked,
      progress: a.getProgress ? a.getProgress(achievementStats) : undefined,
    })),
    normalizeWorkoutGroups: (workout) =>
      normalizeMuscleGroups(
        workout.muscle_groups?.length
          ? workout.muscle_groups
          : workout.muscle_group
          ? [workout.muscle_group]
          : []
      ),
  });

  const accentColor = avatarDef?.accentColor ?? "#B6FF00";
  const exclusiveTrophies: TrophyGrant[] = trophiesResult.error
    ? []
    : ((trophiesResult.data ?? []) as unknown as TrophyGrant[]);
  const streakRows = publicStreaks ?? [];

  return (
    <AppShell>
      <div className="min-w-0 flex-1 px-3.5 pb-4 pt-4 sm:p-8 lg:p-10">
        <header className="mb-4 sm:mb-6">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
            Atleta
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{displayName}</h1>
          <p className="mt-1 text-sm text-[#F5F5F5]/35">@{profile.username}</p>
        </header>

        <div className="max-w-3xl space-y-3.5 sm:space-y-4">
          {/* ── Hero Card ── */}
          <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
            {avatarDef && (
              <div
                className="pointer-events-none absolute -left-8 -top-8 size-56 rounded-full blur-[80px]"
                style={{ background: accentColor + "18" }}
              />
            )}

            <div className="relative flex flex-col gap-4 p-3.5 sm:flex-row sm:items-start sm:gap-8 sm:p-8">
              <div className="shrink-0">
                <AvatarDisplay avatarId={profile.avatar_id} initials={initials} size="lg" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">{displayName}</h2>
                  {profile.username && (
                    <p className="mt-0.5 text-xs font-medium text-[#F5F5F5]/34">
                      @{profile.username}
                    </p>
                  )}

                  {/* Follower / following counts */}
                  <div className="hidden">
                    <Link
                      href={`/perfil/${profile.username}/seguidores`}
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.035] px-2.5 py-1.5 text-xs font-semibold text-[#F5F5F5]/55 transition-all duration-150 hover:border-[#B6FF00]/25 hover:bg-[#B6FF00]/[0.06] hover:text-[#B6FF00]"
                    >
                      <span className="font-bold text-[#F5F5F5]/80 transition-colors group-hover:text-[#F5F5F5]">{followersCount ?? 0}</span>
                      Ver seguidores
                    </Link>
                    <Link
                      href={`/perfil/${profile.username}/seguindo`}
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.035] px-2.5 py-1.5 text-xs font-semibold text-[#F5F5F5]/55 transition-all duration-150 hover:border-[#22D3EE]/25 hover:bg-[#22D3EE]/[0.06] hover:text-[#22D3EE]"
                    >
                      <span className="font-bold text-[#F5F5F5]/80 transition-colors group-hover:text-[#F5F5F5]">{followingCount ?? 0}</span>
                      Ver seguindo
                    </Link>
                  </div>

                  {profile.bio && (
                    <p className="mt-2 text-sm leading-relaxed text-[#F5F5F5]/52">{profile.bio}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/perfil/${profile.username}/seguidores`}
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.035] px-2.5 py-1.5 text-xs font-semibold text-[#F5F5F5]/55 transition-all duration-150 hover:border-[#B6FF00]/25 hover:bg-[#B6FF00]/[0.06] hover:text-[#B6FF00]"
                    >
                      <span className="font-bold text-[#F5F5F5]/82 transition-colors group-hover:text-[#F5F5F5]">{followersCount ?? 0}</span>
                      seguidores
                    </Link>
                    <Link
                      href={`/perfil/${profile.username}/seguindo`}
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.035] px-2.5 py-1.5 text-xs font-semibold text-[#F5F5F5]/55 transition-all duration-150 hover:border-[#22D3EE]/25 hover:bg-[#22D3EE]/[0.06] hover:text-[#22D3EE]"
                    >
                      <span className="font-bold text-[#F5F5F5]/82 transition-colors group-hover:text-[#F5F5F5]">{followingCount ?? 0}</span>
                      seguindo
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className="w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        borderColor: accentColor + "40",
                        color: accentColor,
                        background: accentColor + "0F",
                      }}
                    >
                      {athleteLabel}
                    </span>
                    <Link
                      href={`/perfil/${profile.username}/trofeus`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAB308]/25 bg-[#EAB308]/[0.08] px-3 py-1.5 text-[11px] font-bold text-[#EAB308]/90 shadow-[0_0_18px_rgba(234,179,8,0.08)] transition-all duration-150 hover:border-[#EAB308]/35 hover:bg-[#EAB308]/[0.11] active:scale-95"
                    >
                      <Trophy className="size-3.5" strokeWidth={2} />
                      Ver troféus
                    </Link>
                    {currentUser && !isOwnProfile && (
                      <>
                        <FollowButton
                          targetUserId={profile.user_id}
                          initialIsFollowing={isFollowing}
                        />
                        <Link
                          href={`/desafios/novo?userId=${profile.user_id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-[#F5F5F5]/60 transition-all duration-150 hover:border-[#FB923C]/30 hover:bg-[#FB923C]/[0.06] hover:text-[#FB923C]/90 active:scale-95"
                        >
                          <Swords className="size-3.5" strokeWidth={2} />
                          Desafiar
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                <div className="hidden">
                  <span
                    className="w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{
                      borderColor: accentColor + "40",
                      color: accentColor,
                      background: accentColor + "0F",
                    }}
                  >
                    {athleteLabel}
                  </span>

                  {/* Follow + Challenge buttons — only for authenticated viewers of other profiles */}
                  {currentUser && !isOwnProfile && (
                    <>
                      <FollowButton
                        targetUserId={profile.user_id}
                        initialIsFollowing={isFollowing}
                      />
                      <Link
                        href={`/desafios/novo?userId=${profile.user_id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-[#F5F5F5]/60 transition-all duration-150 hover:border-[#FB923C]/30 hover:bg-[#FB923C]/[0.06] hover:text-[#FB923C]/90 active:scale-95"
                      >
                        <Swords className="size-3.5" strokeWidth={2} />
                        Desafiar
                      </Link>
                    </>
                  )}
                  <Link
                    href={`/perfil/${profile.username}/trofeus`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAB308]/25 bg-[#EAB308]/[0.08] px-3 py-1.5 text-[11px] font-bold text-[#EAB308]/90 shadow-[0_0_18px_rgba(234,179,8,0.08)] transition-all duration-150 hover:border-[#EAB308]/35 hover:bg-[#EAB308]/[0.11] active:scale-95"
                  >
                    <Trophy className="size-3.5" strokeWidth={2} />
                    Ver troféus
                  </Link>
                </div>

                {/* Level bar */}
                <div className="max-w-sm rounded-xl border border-white/[0.055] bg-white/[0.025] p-3">
                  <div className="mb-1.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                        style={{ background: rankStyle.color + "20", color: rankStyle.color }}
                      >
                        Nível {profileLevel}
                      </span>
                      <span className="text-xs font-semibold text-[#F5F5F5]/70">{rankStyle.label}</span>
                    </div>
                  </div>
                  <div className="h-[4px] overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${xpLevelProgress}%`, background: rankStyle.color }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid shrink-0 grid-cols-3 gap-1.5 sm:flex sm:flex-col sm:items-end sm:gap-4">
                <div className="rounded-xl border border-white/[0.055] bg-white/[0.025] px-2.5 py-2 text-right sm:border-0 sm:bg-transparent sm:p-0">
                  <p className="font-display text-lg font-bold tabular-nums sm:text-xl">
                    {totalKm.toFixed(1)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#F5F5F5]/35">km</p>
                </div>
                <div className="rounded-xl border border-white/[0.055] bg-white/[0.025] px-2.5 py-2 text-right sm:border-0 sm:bg-transparent sm:p-0">
                  <p className="font-display text-lg font-bold tabular-nums sm:text-xl">{totalRuns}</p>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#F5F5F5]/35">
                    corridas
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.055] bg-white/[0.025] px-2.5 py-2 text-right sm:border-0 sm:bg-transparent sm:p-0">
                  <p className="font-display text-lg font-bold tabular-nums sm:text-xl">{currentStreak}</p>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#F5F5F5]/35">
                    dias seguidos
                  </p>
                </div>
              </div>
            </div>
          </section>

          <LatestTrophiesSection
            achievements={achievementCards}
            exclusiveTrophies={exclusiveTrophies}
          />

          {/* ── Troféus exclusivos ── */}
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="relative border-b border-white/[0.05] px-5 py-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
                    Perfil
                  </p>
                  <h2 className="flex items-center gap-2 font-display text-base font-semibold">
                    <Medal className="size-4 text-[#EAB308]" />
                    Troféus exclusivos
                  </h2>
                </div>
                <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-xs font-semibold tabular-nums text-[#F5F5F5]/50">
                  {exclusiveTrophies.length}
                </span>
              </div>
            </div>
            {exclusiveTrophies.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#F5F5F5]/30">Nenhum troféu exclusivo ainda.</p>
            ) : (
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                {exclusiveTrophies.map((grant) => {
                  const trophy = Array.isArray(grant.exclusive_trophies)
                    ? grant.exclusive_trophies[0]
                    : grant.exclusive_trophies;
                  if (!trophy) return null;
                  return (
                    <article key={grant.id} className="rounded-2xl border border-[#EAB308]/20 bg-[#EAB308]/[0.05] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#EAB308]/70">{trophy.rarity}</p>
                      <h3 className="mt-1 font-display text-base font-bold text-[#F5F5F5]/90">{trophy.name}</h3>
                      {trophy.description && <p className="mt-1 text-xs leading-5 text-[#F5F5F5]/42">{trophy.description}</p>}
                      <p className="mt-3 text-[10px] text-[#F5F5F5]/25">Entregue em {new Date(grant.awarded_at).toLocaleDateString("pt-BR")}</p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Streaks públicas ── */}
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="relative border-b border-white/[0.05] px-5 py-4">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold">
                <Flame className="size-4 text-[#FB923C]" />
                Streaks públicas
              </h2>
            </div>
            {streakRows.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#F5F5F5]/30">Nenhuma sequência registrada ainda.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
                {streakRows.map((streak) => (
                  <div key={streak.streak_type} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/30">{streak.streak_type}</p>
                    <p className="mt-2 font-display text-2xl font-bold text-[#FB923C]">{streak.current_streak ?? 0}</p>
                    <p className="text-xs text-[#F5F5F5]/35">melhor: {streak.best_streak ?? 0}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Conquistas ── */}
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="relative border-b border-white/[0.05] px-5 py-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
                    Gamificação
                  </p>
                  <h2 className="font-display text-base font-semibold">Conquistas</h2>
                </div>
                <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-xs font-semibold tabular-nums text-[#F5F5F5]/50">
                  {unlockedCount}/{achievements.length}
                </span>
              </div>
            </div>

            <AchievementGrid achievements={achievementCards} categories={CATEGORIES} />
          </section>
        </div>
      </div>
    </AppShell>
  );
}
