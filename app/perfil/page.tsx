import Link from "next/link";
import { Dumbbell, Flame, Timer, Trophy } from "lucide-react";
import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { AvatarSelector } from "@/components/ui/avatar/avatar-selector";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { StreakCard } from "@/components/social/StreakCard";
import { AppShell } from "@/components/ui/layout/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { normalizeMuscleGroups } from "@/lib/muscles";
import { getAvatarById } from "@/lib/avatar-registry";
import { getLevelProgress } from "@/lib/xp";
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
import { addAchievementUnlockDates } from "@/lib/achievement-timeline";

export const dynamic = "force-dynamic";

// ─── Types ───────────────────────────────────────────────────────────────────

type Run = {
  distance: number;
  pace: string | null;
  created_at: string;
};

type Workout = {
  muscle_group: string | null;
  muscle_groups: string[] | null;
  created_at: string;
};

// ─── Level system ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LEVELS = [
  { name: "Iniciante",     threshold: 0,   next: 25,       color: "#71717A" },
  { name: "Amador",        threshold: 25,  next: 100,      color: "#60A5FA" },
  { name: "Intermediário", threshold: 100, next: 300,      color: "#A78BFA" },
  { name: "Avançado",      threshold: 300, next: 600,      color: "#FB923C" },
  { name: "Elite",         threshold: 600, next: Infinity, color: "#B6FF00" },
];

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

function buildHeatmap(runs: Run[]): { date: string; km: number; isFuture: boolean }[][] {
  const dayKm = new Map<string, number>();
  for (const r of runs) {
    const d = getLocalDateKey(r.created_at);
    dayKm.set(d, (dayKm.get(d) ?? 0) + r.distance);
  }

  const today = new Date(`${getLocalDateKey(new Date())}T12:00:00`);
  const todayMs = today.getTime();

  // Start from the Monday 15 full weeks before this week's Monday (= 16 weeks total)
  const dayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon
  const start = new Date(today);
  start.setDate(today.getDate() - dayOfWeek - 105);

  const weeks: { date: string; km: number; isFuture: boolean }[][] = [];
  const cur = new Date(start);

  for (let w = 0; w < 16; w++) {
    const week: { date: string; km: number; isFuture: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const ds = getLocalDateKey(cur);
      week.push({ date: ds, km: dayKm.get(ds) ?? 0, isFuture: cur.getTime() > todayMs });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

// ─── Achievement definitions → lib/achievements.ts ───────────────────────────

// ─── Athlete labels ───────────────────────────────────────────────────────────

const RANK_STYLES: Record<string, { label: string; color: string }> = {
  rookie:   { label: 'Rookie',   color: '#94A3B8' },
  bronze:   { label: 'Bronze',   color: '#CD7F32' },
  silver:   { label: 'Silver',   color: '#A1A1AA' },
  gold:     { label: 'Gold',     color: '#EAB308' },
  platinum: { label: 'Platinum', color: '#22D3EE' },
  elite:    { label: 'Elite',    color: '#B6FF00' },
}

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

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("avatar_id, avatar_type, username, display_name, bio, total_xp, current_level, rank")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

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
          .select("distance, pace, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("workouts")
          .select("muscle_group, muscle_groups, created_at")
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

  const dbTotalXp = Number((profile as { total_xp?: number } | null)?.total_xp ?? 0)
  const dbLevel = Number((profile as { current_level?: number } | null)?.current_level ?? 1)
  const dbRank = (profile as { rank?: string } | null)?.rank ?? 'rookie'
  const rankStyle = RANK_STYLES[dbRank] ?? RANK_STYLES.rookie
  const { levelProgress: xpLevelProgress, xpIntoLevel, xpForNextLevel } = getLevelProgress(dbTotalXp)

  const avatarDef = profile?.avatar_id ? getAvatarById(profile.avatar_id) : undefined;
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

  const heatmapWeeks = buildHeatmap(runs);

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
      <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
        <header className="mb-5">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
            Atleta
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Perfil</h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[#F5F5F5]/40">
            Identidade, marcas pessoais e evolução de treinos.
          </p>
        </header>

        <div className="space-y-4 max-w-4xl">
          {/* ── Hero Card ── */}
          <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            {/* Top shimmer */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
            {/* Avatar glow blob */}
            {avatarDef && (
              <div
                className="pointer-events-none absolute -left-8 -top-8 size-56 rounded-full blur-[80px]"
                style={{ background: avatarDef.accentColor + "18" }}
              />
            )}

            <div className="relative p-4 sm:p-6">
              {/* Avatar + info row */}
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="shrink-0">
                  <AvatarDisplay
                    avatarId={profile?.avatar_id ?? null}
                    initials={initials}
                    size="md"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <EditProfileForm
                    initialDisplayName={profile?.display_name ?? null}
                    initialBio={profile?.bio ?? null}
                    initialUsername={profile?.username ?? null}
                    fallbackName={nickname}
                    fallbackBio={athleteBio}
                  />
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <span
                      className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        borderColor: (avatarDef?.accentColor ?? "#B6FF00") + "40",
                        color: avatarDef?.accentColor ?? "#B6FF00",
                        background: (avatarDef?.accentColor ?? "#B6FF00") + "0F",
                      }}
                    >
                      {athleteLabel}
                    </span>

                    {profile?.username ? (
                      <>
                        <Link
                          href={`/perfil/${profile.username}/seguidores`}
                          prefetch
                          className="mobile-tap group inline-flex items-baseline gap-1 rounded-lg px-2 py-1.5 text-xs text-[#F5F5F5]/45 transition-transform duration-100 hover:bg-white/[0.05] hover:text-[#F5F5F5]/80 active:scale-[0.97] active:opacity-80"
                        >
                          <span className="font-bold text-[#F5F5F5]/80 transition-colors group-hover:text-[#F5F5F5]">{followersCount ?? 0}</span>
                          {" "}seg.
                        </Link>
                        <span className="text-[10px] text-[#F5F5F5]/15">·</span>
                        <Link
                          href={`/perfil/${profile.username}/seguindo`}
                          prefetch
                          className="mobile-tap group inline-flex items-baseline gap-1 rounded-lg px-2 py-1.5 text-xs text-[#F5F5F5]/45 transition-transform duration-100 hover:bg-white/[0.05] hover:text-[#F5F5F5]/80 active:scale-[0.97] active:opacity-80"
                        >
                          <span className="font-bold text-[#F5F5F5]/80 transition-colors group-hover:text-[#F5F5F5]">{followingCount ?? 0}</span>
                          {" "}seguindo
                        </Link>
                        <span className="text-[10px] text-[#F5F5F5]/15">·</span>
                        <Link
                          href={`/perfil/${profile.username}/trofeus`}
                          prefetch
                          className="mobile-tap inline-flex items-center gap-1 rounded-lg border border-[#EAB308]/20 bg-[#EAB308]/[0.07] px-2 py-1.5 text-xs font-bold text-[#EAB308]/85 transition-transform duration-100 hover:border-[#EAB308]/35 hover:bg-[#EAB308]/[0.11] active:scale-[0.97] active:opacity-80"
                        >
                          <Trophy className="size-3" strokeWidth={2} />
                          Troféus
                        </Link>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-[#F5F5F5]/45">
                          <span className="font-bold text-[#F5F5F5]/80">{followersCount ?? 0}</span>
                          {" "}seguidores
                        </span>
                        <span className="text-[10px] text-[#F5F5F5]/15">·</span>
                        <span className="text-xs text-[#F5F5F5]/45">
                          <span className="font-bold text-[#F5F5F5]/80">{followingCount ?? 0}</span>
                          {" "}seguindo
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* XP bar — full width below avatar row */}
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ background: rankStyle.color + "20", color: rankStyle.color }}
                    >
                      Nível {dbLevel}
                    </span>
                    <span className="text-xs font-semibold text-[#F5F5F5]/70">
                      {rankStyle.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#F5F5F5]/30">
                    {xpIntoLevel} / {xpForNextLevel ?? "∞"} XP
                  </span>
                </div>
                <div className="h-[5px] overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${xpLevelProgress}%`,
                      background: rankStyle.color,
                      boxShadow: `0 0 10px ${rankStyle.color}55`,
                    }}
                  />
                </div>
                {xpForNextLevel !== null && (
                  <p className="mt-1 text-[10px] text-[#F5F5F5]/28">
                    {xpForNextLevel - xpIntoLevel} XP para o próximo nível ·{" "}
                    {dbTotalXp.toLocaleString("pt-BR")} XP total
                  </p>
                )}
              </div>

              {/* Quick stats grid */}
              <div className="mt-3 grid grid-cols-3 gap-2">
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
                <h2 className="font-display text-base font-semibold">Últimas atividades</h2>
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

          {/* ── Avatar Customization ── */}
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="relative border-b border-white/[0.05] px-5 py-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
                Identidade
              </p>
              <h2 className="font-display text-base font-semibold">Escolha seu avatar</h2>
              <p className="mt-0.5 text-xs text-[#F5F5F5]/35">Representa seu estilo de treino.</p>
            </div>
            <div className="p-5">
              <AvatarSelector initialAvatarId={profile?.avatar_id ?? null} />
            </div>
          </section>

          {/* ── Activity Heatmap ── */}
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="relative border-b border-white/[0.05] px-5 py-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
                Consistência
              </p>
              <h2 className="font-display text-base font-semibold">Atividade semanal</h2>
            </div>

            <div className="p-5">
              <div className="overflow-x-auto">
                <div className="flex min-w-max gap-1.5">
                  {/* Day labels */}
                  <div className="flex flex-col gap-1 pt-5">
                    {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
                      <div
                        key={i}
                        className="flex size-[14px] items-center justify-center text-[9px] font-bold text-[#F5F5F5]/20"
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Week columns */}
                  <div className="flex gap-1">
                    {heatmapWeeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-1">
                        {/* Month label for first week of month */}
                        <div className="mb-1 h-4 text-[9px] font-bold text-[#F5F5F5]/22">
                          {wi === 0 || new Date(week[0].date).getDate() <= 7
                            ? new Date(week[0].date).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")
                            : ""}
                        </div>
                        {week.map((cell) => (
                          <div
                            key={cell.date}
                            title={
                              cell.isFuture
                                ? ""
                                : cell.km > 0
                                ? `${new Date(cell.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}: ${formatDecimal(cell.km)} km`
                                : new Date(cell.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
                            }
                            className="size-[14px] rounded-[3px] transition-transform duration-100 hover:scale-125"
                            style={
                              cell.isFuture
                                ? { background: "rgba(255,255,255,0.02)" }
                                : cell.km <= 0
                                ? { background: "rgba(255,255,255,0.06)" }
                                : cell.km < 3
                                ? { background: "rgba(182,255,0,0.22)" }
                                : cell.km < 7
                                ? { background: "rgba(182,255,0,0.52)", boxShadow: "0 0 4px rgba(182,255,0,0.2)" }
                                : { background: "rgba(182,255,0,0.88)", boxShadow: "0 0 6px rgba(182,255,0,0.4)" }
                            }
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-[10px] text-[#F5F5F5]/28">Menos</span>
                {[
                  "rgba(255,255,255,0.06)",
                  "rgba(182,255,0,0.22)",
                  "rgba(182,255,0,0.52)",
                  "rgba(182,255,0,0.88)",
                ].map((bg, i) => (
                  <div
                    key={i}
                    className="size-[12px] rounded-[3px]"
                    style={{ background: bg }}
                  />
                ))}
                <span className="text-[10px] text-[#F5F5F5]/28">Mais</span>
                <span className="ml-auto text-[10px] text-[#F5F5F5]/20">
                  Baseado em corridas registradas
                </span>
              </div>
            </div>
          </section>

          {/* ── Personal Bests ── */}
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="relative border-b border-white/[0.05] px-5 py-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
                Recordes
              </p>
              <h2 className="font-display text-base font-semibold">Marcas pessoais</h2>
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
                    <h2 className="font-display text-base font-semibold flex items-center gap-2">
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
                  <h2 className="font-display text-base font-semibold">Badges</h2>
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
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5 text-right">
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#F5F5F5]/30">
        {label}
      </p>
      <p className="font-display text-xl font-bold leading-tight tracking-tight">
        {value}
        {unit && (
          <span className="ml-1 text-xs font-bold text-[#B6FF00]/80">{unit}</span>
        )}
      </p>
    </div>
  );
}

type RecentActivityItem =
  | { kind: "run"; date: string; distance: number; pace: string | null }
  | { kind: "workout"; date: string; muscles: string[] };

function RecentActivityRow({ activity }: { activity: RecentActivityItem }) {
  if (activity.kind === "run") {
    return (
      <div className="flex items-center gap-3 px-5 py-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#B6FF00]/10">
          <Timer className="size-4 text-[#B6FF00]/80" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#F5F5F5]/80">{activity.distance} km</p>
          {activity.pace && (
            <p className="text-xs text-[#F5F5F5]/35">{activity.pace}/km</p>
          )}
        </div>
        <p className="shrink-0 text-[10px] text-[#F5F5F5]/30">{formatDateLabel(activity.date)}</p>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#22D3EE]/10">
        <Dumbbell className="size-4 text-[#22D3EE]/80" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#F5F5F5]/80">Academia</p>
        {activity.muscles.length > 0 && (
          <p className="truncate text-xs text-[#F5F5F5]/35">{activity.muscles.slice(0, 3).join(", ")}</p>
        )}
      </div>
      <p className="shrink-0 text-[10px] text-[#F5F5F5]/30">{formatDateLabel(activity.date)}</p>
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
          className="font-display text-xl font-bold tracking-tight"
          style={{ color: isEmpty ? "rgba(255,255,255,0.18)" : accentColor }}
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
