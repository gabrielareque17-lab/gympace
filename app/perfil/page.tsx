import Link from "next/link";
import { Dumbbell, Flame, Medal, Timer, Trophy } from "lucide-react";
import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { AvatarSelectorLazy } from "@/components/profile/avatar-selector-lazy";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { StreakCard } from "@/components/social/StreakCard";
import { SeasonLeagueBadge } from "@/components/seasons/season-league-badge";
import { AppShell } from "@/components/ui/layout/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { normalizeMuscleGroups } from "@/lib/muscles";
import { getAvatarById } from "@/lib/avatar-registry";
import { customAvatarRowToDefinition, type CustomAvatarRow } from "@/lib/custom-avatars";
import { calculateLevelFromXP, getLevelProgress, getRankForLevel } from "@/lib/xp";
import { getUserStreaks } from "@/lib/streaks";
import { getLocalDateKey, formatDateLabel } from "@/lib/date-utils";
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
import { MonthlyActivityCalendar } from "@/components/profile/monthly-activity-calendar";
import { addAchievementUnlockDates } from "@/lib/achievement-timeline";
import { getAthleteTitle } from "@/lib/athlete-title";

export const dynamic = "force-dynamic";

// ─── Types ───────────────────────────────────────────────────────────────────

type Run = {
  user_id: string;
  distance: number;
  pace: string | null;
  created_at: string;
};

type Workout = {
  user_id: string;
  muscle_group: string | null;
  muscle_groups: string[] | null;
  duration_minutes: number | null;
  created_at: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parsePaceToSeconds(value: string | null): number | null {
  if (!value) return null;
  const [min, sec] = value.split(":").map(Number);
  if (!isFinite(min) || !isFinite(sec)) return null;
  return min * 60 + sec;
}

function formatPace(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDecimal(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: n % 1 === 0 ? 0 : 1,
  }).format(n);
}

function getNickname(email: string): string {
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function computeStreak(isoDates: string[]): number {
  if (isoDates.length === 0) return 0;
  const unique = Array.from(new Set(isoDates.map(getLocalDateKey))).sort().reverse();

  const todayStr = getLocalDateKey(new Date());
  const yest = new Date(`${todayStr}T12:00:00`);
  yest.setDate(yest.getDate() - 1);
  const yestStr = getLocalDateKey(yest);

  if (unique[0] !== todayStr && unique[0] !== yestStr) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1] + "T00:00:00");
    const curr = new Date(unique[i] + "T00:00:00");
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

// ─── Achievement definitions → lib/achievements.ts ───────────────────────────

// ─── Athlete labels ───────────────────────────────────────────────────────────

const ATHLETE_LABELS: Record<string, string> = {
  runner:          "Corredor",
  gym_rat:         "Atleta de Academia",
  hybrid_athlete:  "Atleta Híbrido",
  power_athlete:   "Atleta de Força",
};

const ATHLETE_BIOS: Record<string, string> = {
  runner:          "Focado em velocidade, resistência e performance nas pistas",
  gym_rat:         "Dedicado à força máxima e evolução muscular consistente",
  hybrid_athlete:  "Equilibrando potência, mobilidade e performance total",
  power_athlete:   "Explosão e força como filosofia de treino",
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function PerfilPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const email = user?.email ?? "";
  const nickname = email ? getNickname(email) : "Atleta";
  const initials = email ? email[0].toUpperCase() : "?";

  const profileRes = user
    ? await supabase
        .from("profiles")
        .select("avatar_id, avatar_type, username, display_name, bio, total_xp")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };
  const profile = profileRes.data as {
    avatar_id: string | null;
    avatar_type: string | null;
    username: string | null;
    display_name: string | null;
    bio: string | null;
    total_xp: number | null;
  } | null;

  const [
    { data: rawRuns },
    workoutsResult,
    { count: followersCount },
    { count: followingCount },
    userStreaks,
    trophiesResult,
  ] = await Promise.all([
    user
      ? supabase
          .from("runs")
          .select("user_id, distance, pace, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("workouts")
          .select("user_id, muscle_group, muscle_groups, duration_minutes, created_at")
          .eq("user_id", user.id)
      : Promise.resolve({ data: null, error: null }),
    user
      ? supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id)
      : Promise.resolve({ count: 0 }),
    user
      ? supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id)
      : Promise.resolve({ count: 0 }),
    user
      ? getUserStreaks(supabase, user.id)
      : Promise.resolve(null),
    user
      ? supabase
          .from("user_trophies")
          .select("id,awarded_at,awarded_by,note,exclusive_trophies(name,description,rarity,visual)")
          .eq("user_id", user.id)
          .order("awarded_at", { ascending: false })
      : Promise.resolve({ data: null, error: null }),
  ]);

  const runs: Run[] = (rawRuns ?? []) as Run[];
  const workouts: Workout[] = (
    workoutsResult.error &&
    (workoutsResult.error.code === "42P01" ||
      workoutsResult.error.message?.toLowerCase().includes("workouts"))
      ? []
      : ((workoutsResult.data ?? []) as Workout[])
  );

  // ── Compute stats ──
  const totalRuns = runs.length;
  const totalKm = runs.reduce((acc, r) => acc + Number(r.distance ?? 0), 0);
  const longestRun = runs.reduce((max, r) => Math.max(max, Number(r.distance ?? 0)), 0);

  const allPaceSeconds = runs
    .map((r) => parsePaceToSeconds(r.pace))
    .filter((p): p is number => p !== null);
  const avgPaceSeconds =
    allPaceSeconds.length > 0
      ? Math.round(allPaceSeconds.reduce((a, b) => a + b, 0) / allPaceSeconds.length)
      : null;
  const bestPaceSeconds = allPaceSeconds.length > 0 ? Math.min(...allPaceSeconds) : null;

  // Best pace for 5K+ and 10K+ runs
  const paceFor5k = runs
    .filter((r) => r.distance >= 5)
    .map((r) => parsePaceToSeconds(r.pace))
    .filter((p): p is number => p !== null);
  const best5kPace = paceFor5k.length > 0 ? Math.min(...paceFor5k) : null;

  const paceFor10k = runs
    .filter((r) => r.distance >= 10)
    .map((r) => parsePaceToSeconds(r.pace))
    .filter((p): p is number => p !== null);
  const best10kPace = paceFor10k.length > 0 ? Math.min(...paceFor10k) : null;

  const currentStreak = computeStreak(runs.map((r) => r.created_at));

  const totalXp = Number(profile?.total_xp ?? 0);
  const dbLevel = calculateLevelFromXP(totalXp);
  const dbRank = getRankForLevel(dbLevel);
  const rankStyle = getAthleteTitle(dbRank);
  const xpState = getLevelProgress(totalXp);
  const xpLevelProgress = xpState.levelProgress;
  const xpIntoLevel = xpState.xpIntoLevel;
  const xpForNextLevel = xpState.xpForNextLevel;
  const { data: selectedCustomAvatar } = profile?.avatar_id?.startsWith("custom-")
    ? await supabase
        .from("custom_avatars")
        .select("id,name,type,category,label,description,primary_color,accent_color,secondary_color,background_color,outfit_color,hair_style,hair_color,face_style,accessory,glow_color,rarity,gender,unlock_kind,unlock_label,female,exclusive,trophy_id,assigned_to,is_active,metadata,created_at,updated_at")
        .eq("id", profile.avatar_id)
        .eq("is_active", true)
        .maybeSingle()
    : { data: null };
  const avatarDef = selectedCustomAvatar
    ? customAvatarRowToDefinition(selectedCustomAvatar as CustomAvatarRow)
    : profile?.avatar_id
      ? getAvatarById(profile.avatar_id)
      : undefined;
  const athleteType = profile?.avatar_type ?? "runner";
  const athleteLabel = ATHLETE_LABELS[athleteType] ?? "Atleta";
  const athleteBio = ATHLETE_BIOS[athleteType] ?? "Sempre em busca da próxima marca pessoal";

  const achievementStats: AchievementStats = {
    totalRuns,
    totalKm,
    longestRun,
    currentStreak,
    bestPaceSeconds,
    gymTotalSessions: workouts.length,
    gymChestSessions: workouts.filter((w) => {
      const keys = normalizeMuscleGroups(w.muscle_groups?.length ? w.muscle_groups : (w.muscle_group ? [w.muscle_group] : []));
      return keys.includes("peito");
    }).length,
    gymLegSessions: workouts.filter((w) => {
      const keys = normalizeMuscleGroups(w.muscle_groups?.length ? w.muscle_groups : (w.muscle_group ? [w.muscle_group] : []));
      return keys.some((key) => ["quadriceps", "posterior-coxa", "gluteos", "panturrilhas"].includes(key));
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
  const exclusiveTrophies: TrophyGrant[] = trophiesResult.error
    ? []
    : ((trophiesResult.data ?? []) as unknown as TrophyGrant[]);

  // Recent activities (runs + workouts combined, latest 8)
  type RecentActivity =
    | { kind: "run"; date: string; distance: number; pace: string | null }
    | { kind: "workout"; date: string; muscles: string[] };

  const recentActivities: RecentActivity[] = [
    ...runs.map((r) => ({ kind: "run" as const, date: r.created_at, distance: r.distance, pace: r.pace })),
    ...workouts.map((w) => ({
      kind: "workout" as const,
      date: w.created_at,
      muscles: (w.muscle_groups?.length ? w.muscle_groups : w.muscle_group ? [w.muscle_group] : [])
        .map((m) => m.charAt(0).toUpperCase() + m.slice(1)),
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  // Streak active-day sets for mini-timelines
  const runActiveDays = runs.map((r) => getLocalDateKey(r.created_at));
  const gymActiveDays = workouts.map((w) => getLocalDateKey(w.created_at));
  const gymDaySet = new Set(gymActiveDays);
  const hybridActiveDays = runActiveDays.filter((d) => gymDaySet.has(d));
  const allActiveDays = [...new Set([...runActiveDays, ...gymActiveDays])];

  return (
    <AppShell>
      <div className="min-w-0 flex-1 px-4 pb-4 pt-4 sm:p-6 lg:p-10">
        <header className="mb-4">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
            Atleta
          </p>
          <h1
            className="leading-none text-white"
            style={{ fontFamily: "var(--font-hero)", fontSize: "clamp(2rem, 4vw, 2.75rem)", letterSpacing: "0.04em" }}
          >
            Perfil
          </h1>
          <p className="mt-1.5 hidden max-w-lg text-sm leading-6 text-[#F5F5F5]/40 sm:block">
            Identidade, marcas pessoais e evolução de treinos.
          </p>
        </header>

        <div className="max-w-4xl space-y-3.5 sm:space-y-4">
          {/* ── Hero Card ── */}
          <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            {/* Top shimmer — rank-colored */}
            <div className="absolute inset-x-0 top-0 h-[1.5px]" style={{ background: `linear-gradient(to right, transparent, ${rankStyle.color}48, transparent)` }} />
            {/* Avatar glow blob — always visible */}
            <div
              className="pointer-events-none absolute -left-12 -top-12 size-72 rounded-full blur-[100px]"
              style={{ background: avatarDef ? avatarDef.accentColor + "20" : rankStyle.color + "14" }}
            />

            <div className="relative p-5 sm:p-6">
              {/* Avatar + info row */}
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="shrink-0">
                  <AvatarDisplay
                    avatarId={profile?.avatar_id ?? null}
                    definition={avatarDef}
                    initials={initials}
                    size="lg"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                  <EditProfileForm
                    initialDisplayName={profile?.display_name ?? null}
                    initialBio={profile?.bio ?? null}
                    initialUsername={profile?.username ?? null}
                    fallbackName={nickname}
                    fallbackBio={athleteBio}
                  />
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {profile?.username ? (
                        <>
                          <Link
                            href={`/perfil/${profile.username}/seguidores`}
                            prefetch
                            className="mobile-tap group inline-flex items-baseline gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[#F5F5F5]/55 transition-transform duration-100 hover:bg-white/[0.05] hover:text-[#F5F5F5]/80 active:scale-[0.97] active:opacity-80"
                          >
                            <span className="font-bold text-[#F5F5F5]/82 transition-colors group-hover:text-[#F5F5F5]">{followersCount ?? 0}</span>
                            seguidores
                          </Link>
                          <Link
                            href={`/perfil/${profile.username}/seguindo`}
                            prefetch
                            className="mobile-tap group inline-flex items-baseline gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[#F5F5F5]/55 transition-transform duration-100 hover:bg-white/[0.05] hover:text-[#F5F5F5]/80 active:scale-[0.97] active:opacity-80"
                          >
                            <span className="font-bold text-[#F5F5F5]/82 transition-colors group-hover:text-[#F5F5F5]">{followingCount ?? 0}</span>
                            seguindo
                          </Link>
                        </>
                      ) : (
                        <>
                          <span className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[#F5F5F5]/55">
                            <span className="font-bold text-[#F5F5F5]/82">{followersCount ?? 0}</span> seguidores
                          </span>
                          <span className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-xs text-[#F5F5F5]/55">
                            <span className="font-bold text-[#F5F5F5]/82">{followingCount ?? 0}</span> seguindo
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className="inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                        style={{
                          borderColor: rankStyle.color + "55",
                          color: rankStyle.color,
                          background: rankStyle.color + "1A",
                        }}
                      >
                        {athleteLabel}
                      </span>
                      {profile?.username && (
                        <Link
                          href={`/perfil/${profile.username}/trofeus`}
                          prefetch
                          className="mobile-tap inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#EAB308]/25 bg-[#EAB308]/[0.08] px-3 py-1 text-xs font-bold text-[#EAB308]/90 shadow-[0_0_18px_rgba(234,179,8,0.08)] transition-transform duration-100 hover:border-[#EAB308]/35 hover:bg-[#EAB308]/[0.11] active:scale-[0.97] active:opacity-80"
                        >
                          <Trophy className="size-3" strokeWidth={2} />
                          Troféus
                        </Link>
                      )}
                      <SeasonLeagueBadge points={totalXp} compact />
                    </div>
                  </div>
                </div>
              </div>

              {/* XP bar — full width below avatar row */}
              <div
                className="mt-4 rounded-xl border p-3.5 sm:p-4"
                style={{ borderColor: rankStyle.color + "25", background: rankStyle.color + "07" }}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ background: rankStyle.color + "22", color: rankStyle.color, boxShadow: `0 0 12px ${rankStyle.color}30` }}
                    >
                      Nível {dbLevel}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: rankStyle.color + "cc" }}>
                      {rankStyle.label}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-[#F5F5F5]/50">
                    {totalXp.toLocaleString("pt-BR")} XP
                  </span>
                </div>
                <div className="h-[5px] overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${xpLevelProgress}%`,
                      background: rankStyle.color,
                      boxShadow: `0 0 12px ${rankStyle.color}66`,
                    }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-[#F5F5F5]/34">
                  <span>Progresso do nível</span>
                  <span className="font-mono tabular-nums text-[#F5F5F5]/44">
                    {xpIntoLevel.toLocaleString("pt-BR")} / {xpForNextLevel?.toLocaleString("pt-BR") ?? "max"} XP
                  </span>
                </div>
              </div>

              {/* Quick stats grid */}
              <div className="mt-3.5 grid grid-cols-3 gap-2.5 sm:gap-3">
                <QuickStat label="km" value={formatDecimal(totalKm)} unit="km" />
                <QuickStat label="Treinos" value={String(totalRuns)} unit="" />
                <QuickStat
                  label="Pace"
                  value={avgPaceSeconds ? formatPace(avgPaceSeconds) : "—"}
                  unit={avgPaceSeconds ? "/km" : ""}
                />
              </div>
            </div>
          </section>

          {/* ── Recent Activities ── */}
          {recentActivities.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
              <div className="relative border-b border-white/[0.05] px-5 py-4">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
                  Histórico
                </p>
                <h2 className="leading-none text-white" style={{ fontFamily: "var(--font-hero)", fontSize: "1.25rem", letterSpacing: "0.04em" }}>Últimas atividades</h2>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {recentActivities.map((activity, i) => (
                  <RecentActivityRow key={i} activity={activity} />
                ))}
              </div>
            </section>
          )}

          <LatestTrophiesSection
            achievements={achievementCards}
            exclusiveTrophies={exclusiveTrophies}
          />

          {/* ── Troféus exclusivos ── */}
          {exclusiveTrophies.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
              <div className="relative border-b border-white/[0.05] px-5 py-4">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
                      Conquistas
                    </p>
                    <h2 className="flex items-center gap-2 leading-none text-white" style={{ fontFamily: "var(--font-hero)", fontSize: "1.25rem", letterSpacing: "0.04em" }}>
                      <Medal className="size-4 text-[#EAB308]" />
                      Troféus exclusivos
                    </h2>
                  </div>
                  <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-xs font-semibold tabular-nums text-[#F5F5F5]/50">
                    {exclusiveTrophies.length}
                  </span>
                </div>
              </div>
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
            </section>
          )}

          {/* ── Avatar Customization ── */}
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="relative border-b border-white/[0.05] px-5 py-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
                Identidade
              </p>
              <h2 className="leading-none text-white" style={{ fontFamily: "var(--font-hero)", fontSize: "1.25rem", letterSpacing: "0.04em" }}>Escolha seu avatar</h2>
              <p className="mt-0.5 text-xs text-[#F5F5F5]/35">Representa seu estilo de treino.</p>
            </div>
            <div className="p-5">
              <AvatarSelectorLazy initialAvatarId={profile?.avatar_id ?? null} />
            </div>
          </section>

          {/* ── Atividade Mensal ── */}
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="relative border-b border-white/[0.05] px-5 py-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
                Consistência
              </p>
              <h2 className="leading-none text-white" style={{ fontFamily: "var(--font-hero)", fontSize: "1.25rem", letterSpacing: "0.04em" }}>Atividade mensal</h2>
            </div>
            <MonthlyActivityCalendar runDays={runActiveDays} workoutDays={gymActiveDays} />
          </section>

          {/* ── Personal Bests ── */}
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="relative border-b border-white/[0.05] px-5 py-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
                Recordes
              </p>
              <h2 className="leading-none text-white" style={{ fontFamily: "var(--font-hero)", fontSize: "1.25rem", letterSpacing: "0.04em" }}>Marcas pessoais</h2>
            </div>

            <div className="grid divide-y divide-white/[0.04] px-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <PersonalBestRow
                label="Melhor 5K"
                detail="Melhor pace em corridas ≥ 5km"
                value={best5kPace ? formatPace(best5kPace) : "—"}
                unit={best5kPace ? "/km" : ""}
                accentColor="#B6FF00"
              />
              <PersonalBestRow
                label="Melhor 10K"
                detail="Melhor pace em corridas ≥ 10km"
                value={best10kPace ? formatPace(best10kPace) : "—"}
                unit={best10kPace ? "/km" : ""}
                accentColor="#60A5FA"
                className="sm:pl-5"
              />
              <PersonalBestRow
                label="Maior distância"
                detail="Corrida mais longa registrada"
                value={longestRun > 0 ? formatDecimal(longestRun) : "—"}
                unit={longestRun > 0 ? "km" : ""}
                accentColor="#A78BFA"
              />
              <PersonalBestRow
                label="Maior sequência"
                detail="Dias consecutivos de treino"
                value={currentStreak > 0 ? String(currentStreak) : "—"}
                unit={currentStreak > 0 ? (currentStreak === 1 ? "dia" : "dias") : ""}
                accentColor="#FB923C"
                className="sm:pl-5"
              />
            </div>
          </section>

          {/* ── Streaks ── */}
          {userStreaks && (
            <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
              <div className="relative border-b border-white/[0.05] px-5 py-4">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
                      Consistência
                    </p>
                    <h2 className="flex items-center gap-2 leading-none text-white" style={{ fontFamily: "var(--font-hero)", fontSize: "1.25rem", letterSpacing: "0.04em" }}>
                      <Flame className="size-4 text-[#FB923C]" strokeWidth={2} />
                      Sequências
                    </h2>
                  </div>
                  <Link
                    href="/social"
                    prefetch
                    className="mobile-tap rounded-lg border border-white/[0.07] px-3 py-1.5 text-[11px] text-[#F5F5F5]/35 transition-colors duration-100 active:scale-[0.97] active:opacity-80 hover:border-white/[0.14] hover:text-[#F5F5F5]/60"
                  >
                    Ver ranking →
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
                <StreakCard data={userStreaks.run}     activeDays={runActiveDays}    />
                <StreakCard data={userStreaks.gym}     activeDays={gymActiveDays}    />
                <StreakCard data={userStreaks.hybrid}  activeDays={hybridActiveDays} />
                <StreakCard data={userStreaks.general} activeDays={allActiveDays}    />
              </div>
            </section>
          )}

          {/* ── Achievements ── */}
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="relative border-b border-white/[0.05] px-5 py-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
                    Conquistas
                  </p>
                  <h2 className="leading-none text-white" style={{ fontFamily: "var(--font-hero)", fontSize: "1.25rem", letterSpacing: "0.04em" }}>Badges</h2>
                </div>
                <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-xs font-semibold tabular-nums text-[#F5F5F5]/45">
                  {unlockedCount}
                  <span className="text-[#F5F5F5]/22">/{achievements.length}</span>
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function QuickStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex min-h-[82px] min-w-0 flex-col items-center justify-center rounded-xl border border-white/[0.055] bg-white/[0.025] px-3 py-3.5 text-center sm:min-h-[88px] sm:px-3.5 sm:py-4">
      <p className="mb-2 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-[#F5F5F5]/32 sm:text-[10px]">
        {label}
      </p>
      <div className="flex min-w-0 items-baseline justify-center gap-1">
        <span className="min-w-0 leading-none text-white" style={{ fontFamily: "var(--font-hero)", fontSize: "clamp(1.22rem, 2.5vw, 1.55rem)", letterSpacing: "0.02em" }}>
          {value}
        </span>
        {unit && (
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.04em] text-[#B6FF00]/78 sm:text-xs">{unit}</span>
        )}
      </div>
    </div>
  );
}

type RecentActivityItem =
  | { kind: "run"; date: string; distance: number; pace: string | null }
  | { kind: "workout"; date: string; muscles: string[] };

function RecentActivityRow({ activity }: { activity: RecentActivityItem }) {
  if (activity.kind === "run") {
    return (
      <div className="flex items-center gap-3 px-5 py-3.5 sm:py-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#B6FF00]/15 bg-[#B6FF00]/[0.08]">
          <Timer className="size-4 text-[#B6FF00]/80" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight text-[#F5F5F5]/84">{activity.distance} km</p>
          {activity.pace && (
            <p className="text-xs text-[#F5F5F5]/35">{activity.pace}/km</p>
          )}
        </div>
        <p className="shrink-0 rounded-full bg-white/[0.035] px-2 py-1 text-[10px] text-[#F5F5F5]/34">{formatDateLabel(activity.date)}</p>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 sm:py-4">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#22D3EE]/15 bg-[#22D3EE]/[0.08]">
        <Dumbbell className="size-4 text-[#22D3EE]/80" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight text-[#F5F5F5]/84">Academia</p>
        {activity.muscles.length > 0 && (
          <p className="truncate text-xs text-[#F5F5F5]/35">{activity.muscles.slice(0, 3).join(", ")}</p>
        )}
      </div>
      <p className="shrink-0 rounded-full bg-white/[0.035] px-2 py-1 text-[10px] text-[#F5F5F5]/34">{formatDateLabel(activity.date)}</p>
    </div>
  );
}

function PersonalBestRow({
  label,
  detail,
  value,
  unit,
  accentColor,
  className = "",
}: {
  label: string;
  detail: string;
  value: string;
  unit: string;
  accentColor: string;
  className?: string;
}) {
  const isEmpty = value === "—";
  return (
    <div className={`flex items-center justify-between gap-4 py-4 ${className}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div
            className="shrink-0 size-1.5 rounded-full"
            style={{ background: isEmpty ? "rgba(255,255,255,0.15)" : accentColor }}
          />
          <p className="text-sm font-semibold text-[#F5F5F5]/80">{label}</p>
        </div>
        <p className="mt-0.5 text-xs text-[#F5F5F5]/30">{detail}</p>
      </div>
      <div className="shrink-0 text-right">
        <span
          className="leading-none"
          style={{ fontFamily: "var(--font-hero)", fontSize: "1.75rem", letterSpacing: "0.02em", color: isEmpty ? "rgba(255,255,255,0.18)" : accentColor }}
        >
          {value}
        </span>
        {unit && (
          <span className="ml-1 text-xs font-semibold text-[#F5F5F5]/35">{unit}</span>
        )}
      </div>
    </div>
  );
}
