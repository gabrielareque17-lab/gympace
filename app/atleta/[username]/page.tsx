import { notFound } from "next/navigation";

import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { FollowButton } from "@/components/social/follow-button";
import { AppShell } from "@/components/ui/layout/app-shell";
import { getAvatarById } from "@/lib/avatar-registry";
import {
  ACHIEVEMENT_REGISTRY,
  CATEGORIES,
  type AchievementDefinition,
  type AchievementStats,
} from "@/lib/achievements";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getLocalDateKey } from "@/lib/date-utils";
import { calculateLevelFromXP, getLevelProgress, getRankForLevel } from "@/lib/xp";
import { Check, Flame, Route, Timer, TrendingUp, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ username: string }> };

// ─── Constants ────────────────────────────────────────────────────────────────

const RANK_CONFIG: Record<string, { label: string; color: string }> = {
  rookie:   { label: "Rookie",   color: "#94A3B8" },
  bronze:   { label: "Bronze",   color: "#CD7F32" },
  silver:   { label: "Prata",    color: "#A1A1AA" },
  gold:     { label: "Ouro",     color: "#EAB308" },
  platinum: { label: "Platina",  color: "#67E8F9" },
  elite:    { label: "Elite", color: "#B6FF00" },
};

const ATHLETE_LABELS: Record<string, string> = {
  runner:          "Corredor",
  gym_rat:         "Atleta de Academia",
  hybrid_athlete:  "Atleta Híbrido",
  power_athlete:   "Atleta de Força",
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

function buildHeatmap(runs: { created_at: string; distance: number }[]): { date: string; km: number; isFuture: boolean }[][] {
  const dayKm = new Map<string, number>();
  for (const r of runs) {
    const d = getLocalDateKey(r.created_at);
    dayKm.set(d, (dayKm.get(d) ?? 0) + r.distance);
  }

  const today = new Date(`${getLocalDateKey(new Date())}T12:00:00`);
  const todayMs = today.getTime();

  const dayOfWeek = (today.getDay() + 6) % 7;
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AthleteProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, bio, avatar_id, avatar_type, total_xp, current_level, rank")
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const isOwnProfile = currentUser?.id === profile.user_id;

  type RunRow = { distance: number; pace: string | null; created_at: string };

  const [
    { data: followRow },
    { count: followersCount },
    { count: followingCount },
    { data: rawRuns },
  ] = await Promise.all([
    currentUser && !isOwnProfile
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", currentUser.id)
          .eq("following_id", profile.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.user_id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.user_id),
    supabase
      .from("runs")
      .select("distance, pace, created_at")
      .eq("user_id", profile.user_id),
  ]);

  const isFollowing = !!followRow;
  const runs: RunRow[] = (rawRuns ?? []) as RunRow[];

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
  const totalXp = Number(profile.total_xp ?? 0);
  const currentLevel = Number(profile.current_level ?? calculateLevelFromXP(totalXp));
  const levelProgress = getLevelProgress(totalXp);

  const heatmapWeeks = buildHeatmap(runs);

  const avatarDef = profile.avatar_id ? getAvatarById(profile.avatar_id) : undefined;
  const accentColor = avatarDef?.accentColor ?? "#B6FF00";

  const athleteLabel = ATHLETE_LABELS[profile.avatar_type ?? ""] ?? "Atleta";
  const displayName = profile.display_name || profile.username || "Atleta";
  const initials = displayName[0]?.toUpperCase() ?? "?";
  const resolvedRank = profile.rank ?? getRankForLevel(currentLevel);
  const rank = RANK_CONFIG[resolvedRank] ?? RANK_CONFIG.rookie;

  const achievementStats: AchievementStats = {
    totalRuns,
    totalKm,
    longestRun,
    currentStreak,
    bestPaceSeconds,
    gymTotalSessions: 0,
    gymChestSessions: 0,
    gymLegSessions: 0,
    gymStreak: 0,
    gymHasPersonalRecord: false,
    hasPerfectWeek: false,
  };

  const achievements = ACHIEVEMENT_REGISTRY.map((def) => ({
    ...def,
    unlocked: def.check(achievementStats),
  }));
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <AppShell>
      <div className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        {/* Page header */}
        <header className="mb-6">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
            Perfil Público
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">{displayName}</h1>
          <p className="mt-1 text-sm text-[#F5F5F5]/35">@{profile.username}</p>
        </header>

        <div className="max-w-3xl space-y-4">
          {/* ── Hero Card ── */}
          <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
            <div
              className="pointer-events-none absolute -left-12 -top-12 size-72 rounded-full blur-[100px]"
              style={{ background: accentColor + "14" }}
            />
            <div
              className="pointer-events-none absolute -right-8 bottom-0 size-48 rounded-full blur-[80px]"
              style={{ background: accentColor + "08" }}
            />

            <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:gap-8 sm:p-8">
              {/* Avatar with glow ring */}
              <div className="shrink-0">
                <div
                  className="rounded-2xl p-0.5"
                  style={{ background: `linear-gradient(135deg, ${accentColor}30, transparent 60%)` }}
                >
                  <AvatarDisplay avatarId={profile.avatar_id} initials={initials} size="lg" />
                </div>
              </div>

              {/* Identity */}
              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl font-bold tracking-tight">{displayName}</h2>
                      {profile.username && (
                        <p className="mt-0.5 text-xs font-medium text-[#F5F5F5]/30">
                          @{profile.username}
                        </p>
                      )}
                    </div>

                    {currentUser && !isOwnProfile && (
                      <FollowButton
                        targetUserId={profile.user_id}
                        initialIsFollowing={isFollowing}
                      />
                    )}
                  </div>

                  {/* Follower / following counts */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xs text-[#F5F5F5]/45">
                      <span className="font-bold text-[#F5F5F5]/80">{followersCount ?? 0}</span>
                      {" "}seguidores
                    </span>
                    <span className="text-[#F5F5F5]/20">·</span>
                    <span className="text-xs text-[#F5F5F5]/45">
                      <span className="font-bold text-[#F5F5F5]/80">{followingCount ?? 0}</span>
                      {" "}seguindo
                    </span>
                  </div>

                  {profile.bio && (
                    <p className="mt-3 text-sm leading-relaxed text-[#F5F5F5]/50">{profile.bio}</p>
                  )}
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{
                      borderColor: accentColor + "40",
                      color: accentColor,
                      background: accentColor + "0F",
                    }}
                  >
                    {athleteLabel}
                  </span>
                  <span
                    className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{
                      borderColor: rank.color + "40",
                      color: rank.color,
                      background: rank.color + "10",
                    }}
                  >
                    {rank.label}
                  </span>
                </div>

                {/* Level bar */}
                <div className="max-w-xs">
                  <div className="mb-1.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                        style={{ background: rank.color + "20", color: rank.color }}
                      >
                        Nível {currentLevel}
                      </span>
                      <span className="text-xs font-semibold text-[#F5F5F5]/70">{rank.label}</span>
                    </div>
                    <span className="text-[10px] text-[#F5F5F5]/28">
                      {levelProgress.xpIntoLevel.toLocaleString("pt-BR")} / {levelProgress.xpForNextLevel?.toLocaleString("pt-BR") ?? "max"} XP
                    </span>
                  </div>
                  <div className="h-[5px] overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${levelProgress.levelProgress}%`,
                        background: rank.color,
                        boxShadow: `0 0 10px ${rank.color}55`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Stats Grid ── */}
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="relative border-b border-white/[0.05] px-5 py-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
                Desempenho
              </p>
              <h2 className="font-display text-base font-semibold">Estatísticas públicas</h2>
            </div>

            <div className="grid grid-cols-2 gap-px bg-white/[0.04] sm:grid-cols-3">
              <StatTile
                icon={Route}
                label="Total km"
                value={totalKm > 0 ? formatDecimal(totalKm) : "—"}
                unit={totalKm > 0 ? "km" : ""}
                accentColor={accentColor}
              />
              <StatTile
                icon={Timer}
                label="Corridas"
                value={totalRuns > 0 ? String(totalRuns) : "—"}
                unit={totalRuns === 1 ? "sessão" : totalRuns > 1 ? "sessões" : ""}
                accentColor={accentColor}
              />
              <StatTile
                icon={TrendingUp}
                label="Maior corrida"
                value={longestRun > 0 ? formatDecimal(longestRun) : "—"}
                unit={longestRun > 0 ? "km" : ""}
                accentColor={accentColor}
              />
              <StatTile
                icon={Zap}
                label="Melhor pace"
                value={bestPaceSeconds ? formatPace(bestPaceSeconds) : "—"}
                unit={bestPaceSeconds ? "/km" : ""}
                accentColor={accentColor}
              />
              <StatTile
                icon={Timer}
                label="Pace médio"
                value={avgPaceSeconds ? formatPace(avgPaceSeconds) : "—"}
                unit={avgPaceSeconds ? "/km" : ""}
                accentColor={accentColor}
              />
              <StatTile
                icon={Flame}
                label="Sequência"
                value={currentStreak > 0 ? String(currentStreak) : "—"}
                unit={currentStreak === 1 ? "dia" : currentStreak > 1 ? "dias" : ""}
                accentColor={accentColor}
              />
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
                unit={currentStreak === 1 ? "dia" : currentStreak > 1 ? "dias" : ""}
                accentColor="#FB923C"
                className="sm:pl-5"
              />
            </div>
          </section>

          {/* ── Consistency / Heatmap ── */}
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="relative border-b border-white/[0.05] px-5 py-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
                Consistência
              </p>
              <h2 className="font-display text-base font-semibold">Atividade nos últimos 4 meses</h2>
            </div>

            {totalRuns === 0 ? (
              <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
                <div className="grid size-10 place-items-center rounded-xl bg-white/[0.04]">
                  <Route className="size-5 text-[#F5F5F5]/20" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-[#F5F5F5]/35">Nenhuma atividade registrada</p>
                <p className="text-xs text-[#F5F5F5]/22">
                  As corridas aparecerão aqui quando {profile.display_name ?? profile.username} registrar treinos.
                </p>
              </div>
            ) : (
              <div className="p-5">
                <div className="overflow-x-auto">
                  <div className="flex min-w-max gap-1.5">
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

                    <div className="flex gap-1">
                      {heatmapWeeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-1">
                          <div className="mb-1 h-4 text-[9px] font-bold text-[#F5F5F5]/22">
                            {wi === 0 || new Date(week[0].date).getDate() <= 7
                              ? new Date(week[0].date)
                                  .toLocaleDateString("pt-BR", { month: "short" })
                                  .replace(".", "")
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
                                  ? { background: accentColor + "38" }
                                  : cell.km < 7
                                  ? { background: accentColor + "85", boxShadow: `0 0 4px ${accentColor}33` }
                                  : { background: accentColor + "E0", boxShadow: `0 0 6px ${accentColor}66` }
                              }
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <span className="text-[10px] text-[#F5F5F5]/28">Menos</span>
                  {["rgba(255,255,255,0.06)", accentColor + "38", accentColor + "85", accentColor + "E0"].map(
                    (bg, i) => (
                      <div key={i} className="size-[12px] rounded-[3px]" style={{ background: bg }} />
                    )
                  )}
                  <span className="text-[10px] text-[#F5F5F5]/28">Mais</span>
                  <span className="ml-auto text-[10px] text-[#F5F5F5]/20">Corridas registradas</span>
                </div>
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
                  {unlockedCount}
                  <span className="text-[#F5F5F5]/22">/{achievements.length}</span>
                </span>
              </div>
            </div>

            <div className="divide-y divide-white/[0.04] px-5">
              {CATEGORIES.map(({ key: category, label, color }) => {
                const cat = achievements.filter((a) => a.category === category);
                const catUnlocked = cat.filter((a) => a.unlocked).length;
                return (
                  <div key={category} className="py-5">
                    <div className="mb-4 flex items-center gap-2.5">
                      <div className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />
                      <span
                        className="text-[10px] font-bold uppercase tracking-[0.18em]"
                        style={{ color: `${color}99` }}
                      >
                        {label}
                      </span>
                      <div className="h-px flex-1 bg-white/[0.05]" />
                      <span className="text-[10px] font-semibold tabular-nums text-[#F5F5F5]/28">
                        {catUnlocked}/{cat.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {cat.map((a) => (
                        <AchievementBadge key={a.id} achievement={a} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

import type { LucideIcon } from "lucide-react";

function StatTile({
  icon: Icon,
  label,
  value,
  unit,
  accentColor,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  accentColor: string;
}) {
  const isEmpty = value === "—";
  return (
    <div className="flex flex-col gap-3 bg-[#111111] p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <div
          className="grid size-7 place-items-center rounded-lg"
          style={{
            background: isEmpty ? "rgba(255,255,255,0.04)" : accentColor + "18",
            color: isEmpty ? "rgba(255,255,255,0.2)" : accentColor,
          }}
        >
          <Icon className="size-3.5" strokeWidth={isEmpty ? 1.5 : 2} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#F5F5F5]/35">{label}</span>
      </div>
      <div>
        <span
          className="font-display text-2xl font-bold tracking-tight"
          style={{ color: isEmpty ? "rgba(255,255,255,0.18)" : undefined }}
        >
          {value}
        </span>
        {unit && (
          <span
            className="ml-1.5 text-xs font-semibold"
            style={{ color: isEmpty ? "rgba(255,255,255,0.18)" : accentColor + "CC" }}
          >
            {unit}
          </span>
        )}
      </div>
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

function AchievementBadge({
  achievement,
}: {
  achievement: AchievementDefinition & { unlocked: boolean };
}) {
  const { name, description, icon: Icon, accentHex, unlocked } = achievement;
  return (
    <div
      className="relative flex flex-col gap-3 rounded-2xl border p-3.5 transition-all duration-200"
      style={{
        borderColor: unlocked ? `${accentHex}28` : "rgba(255,255,255,0.05)",
        background: unlocked ? `${accentHex}0A` : "rgba(255,255,255,0.018)",
        boxShadow: unlocked ? `0 0 24px ${accentHex}0C` : "none",
      }}
    >
      <div className="absolute right-2.5 top-2.5">
        {unlocked ? (
          <div
            className="grid size-[18px] place-items-center rounded-full"
            style={{ background: accentHex }}
          >
            <Check className="size-3 text-[#080808]" strokeWidth={3} />
          </div>
        ) : (
          <svg viewBox="0 0 12 12" fill="currentColor" className="size-3 text-[#F5F5F5]/15">
            <path d="M9 5V3.5a3 3 0 0 0-6 0V5H2v6h8V5H9zm-5-1.5a2 2 0 0 1 4 0V5H4V3.5z" />
          </svg>
        )}
      </div>

      <div
        className="grid size-10 place-items-center rounded-xl"
        style={
          unlocked
            ? { background: `${accentHex}1E`, color: accentHex, boxShadow: `0 0 16px ${accentHex}32` }
            : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.2)" }
        }
      >
        <Icon className="size-5" strokeWidth={unlocked ? 2 : 1.5} />
      </div>

      <div className="min-w-0">
        <p
          className="line-clamp-2 text-xs font-bold leading-tight"
          style={{ color: unlocked ? "#F5F5F5" : "rgba(255,255,255,0.28)" }}
        >
          {name}
        </p>
        <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-[#F5F5F5]/22">
          {description}
        </p>
      </div>
    </div>
  );
}
