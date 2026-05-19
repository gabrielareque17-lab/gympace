import { notFound } from "next/navigation";
import Link from "next/link";
import { Swords } from "lucide-react";

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
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getLevelProgress } from "@/lib/xp";

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
  const uniqueDates = Array.from(new Set(dates.map((d) => d.split("T")[0]))).sort().reverse();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  const yestStr = yest.toISOString().split("T")[0];

  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yestStr) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1] + "T00:00:00Z");
    const curr = new Date(uniqueDates[i] + "T00:00:00Z");
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

function hasPerfectWeek(isoDates: string[]): boolean {
  const weeks: Record<string, Set<string>> = {};
  for (const d of isoDates) {
    const date = new Date(d);
    if (isNaN(date.getTime())) continue;
    const day = date.getDay();
    const ws = new Date(date);
    ws.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
    ws.setHours(0, 0, 0, 0);
    const key = ws.toISOString().slice(0, 10);
    if (!weeks[key]) weeks[key] = new Set();
    weeks[key].add(d.split("T")[0]);
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
    gymChestSessions: workouts.filter((w) => w.muscle_group === "peito").length,
    gymLegSessions: workouts.filter((w) => w.muscle_group === "pernas").length,
    gymStreak: computeStreak(workouts.map((w) => w.created_at)),
    gymHasPersonalRecord: false,
    hasPerfectWeek: hasPerfectWeek(workouts.map((w) => w.created_at)),
  };

  const achievements = ACHIEVEMENT_REGISTRY.map((def) => ({
    ...def,
    unlocked: def.check(achievementStats),
  }));
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const achievementCards: AchievementCardData[] = achievements.map((a) => ({
    id: a.id,
    category: a.category,
    name: a.name,
    description: a.description,
    iconKey: a.iconKey,
    accentHex: a.accentHex,
    rarity: a.rarity,
    unlocked: a.unlocked,
    progress: a.getProgress ? a.getProgress(achievementStats) : undefined,
  }));

  const accentColor = avatarDef?.accentColor ?? "#B6FF00";

  return (
    <AppShell>
      <div className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        <header className="mb-6">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
            Atleta
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">{displayName}</h1>
          <p className="mt-1 text-sm text-[#F5F5F5]/35">@{profile.username}</p>
        </header>

        <div className="max-w-3xl space-y-4">
          {/* ── Hero Card ── */}
          <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
            {avatarDef && (
              <div
                className="pointer-events-none absolute -left-8 -top-8 size-56 rounded-full blur-[80px]"
                style={{ background: accentColor + "18" }}
              />
            )}

            <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:gap-8 sm:p-8">
              <div className="shrink-0">
                <AvatarDisplay avatarId={profile.avatar_id} initials={initials} size="lg" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">{displayName}</h2>
                  {profile.username && (
                    <p className="mt-0.5 text-xs font-medium text-[#F5F5F5]/30">
                      @{profile.username}
                    </p>
                  )}

                  {/* Follower / following counts */}
                  <div className="mt-2 flex items-center gap-1">
                    <Link
                      href={`/perfil/${profile.username}/seguidores`}
                      className="group inline-flex items-baseline gap-1 rounded-lg px-2.5 py-2 text-xs text-[#F5F5F5]/45 transition-all duration-150 hover:bg-white/[0.05] hover:text-[#F5F5F5]/80 active:scale-95 active:opacity-60"
                    >
                      <span className="font-bold text-[#F5F5F5]/80 transition-colors group-hover:text-[#F5F5F5]">{followersCount ?? 0}</span>
                      seguidores
                    </Link>
                    <span className="text-[10px] text-[#F5F5F5]/15">·</span>
                    <Link
                      href={`/perfil/${profile.username}/seguindo`}
                      className="group inline-flex items-baseline gap-1 rounded-lg px-2.5 py-2 text-xs text-[#F5F5F5]/45 transition-all duration-150 hover:bg-white/[0.05] hover:text-[#F5F5F5]/80 active:scale-95 active:opacity-60"
                    >
                      <span className="font-bold text-[#F5F5F5]/80 transition-colors group-hover:text-[#F5F5F5]">{followingCount ?? 0}</span>
                      seguindo
                    </Link>
                  </div>

                  {profile.bio && (
                    <p className="mt-2 text-sm leading-relaxed text-[#F5F5F5]/50">{profile.bio}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                </div>

                {/* Level bar */}
                <div className="max-w-xs">
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
                  <div className="h-[5px] overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${xpLevelProgress}%`, background: rankStyle.color }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex shrink-0 flex-row gap-4 sm:flex-col sm:items-end">
                <div className="text-right">
                  <p className="font-display text-xl font-bold tabular-nums">
                    {totalKm.toFixed(1)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#F5F5F5]/35">km</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-bold tabular-nums">{totalRuns}</p>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#F5F5F5]/35">
                    corridas
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-bold tabular-nums">{currentStreak}</p>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#F5F5F5]/35">
                    dias seguidos
                  </p>
                </div>
              </div>
            </div>
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

