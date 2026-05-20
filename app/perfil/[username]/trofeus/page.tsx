import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";

import {
  TrophyCollection,
  type TrophyCollectionItem,
} from "@/components/profile/trophy-collection";
import { AppShell } from "@/components/ui/layout/app-shell";
import {
  ACHIEVEMENT_REGISTRY,
  RARITY_CONFIG,
  type AchievementStats,
} from "@/lib/achievements";
import { addAchievementUnlockDates } from "@/lib/achievement-timeline";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { normalizeMuscleGroups } from "@/lib/muscles";
import { getAllSeasons, type Season } from "@/lib/seasons";
import { getLocalDateKey } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ username: string }> };

type RunRow = {
  distance: number;
  pace: string | null;
  created_at: string;
};

type WorkoutRow = {
  muscle_group: string | null;
  muscle_groups: string[] | null;
  created_at: string;
};

type TrophyGrant = {
  id: string;
  awarded_at: string;
  note: string | null;
  exclusive_trophies:
    | {
        id: string;
        name: string;
        description: string | null;
        rarity: string;
        visual: string | null;
      }
    | {
        id: string;
        name: string;
        description: string | null;
        rarity: string;
        visual: string | null;
      }[]
    | null;
};

const EXCLUSIVE_RARITIES: Record<string, { label: string; color: string }> = {
  common: { label: "Comum", color: "#94A3B8" },
  rare: { label: "Raro", color: "#60A5FA" },
  epic: { label: "Epico", color: "#A78BFA" },
  legendary: { label: "Lendario", color: "#EAB308" },
  mythic: { label: "Mitico", color: "#F472B6" },
};

const ATHLETE_LABELS: Record<string, string> = {
  runner: "Corredor",
  gym_rat: "Atleta de Academia",
  hybrid_athlete: "Atleta Hibrido",
  power_athlete: "Atleta de Forca",
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
    const prev = new Date(`${uniqueDates[i - 1]}T00:00:00Z`);
    const curr = new Date(`${uniqueDates[i]}T00:00:00Z`);
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
    weeks[key] ??= new Set();
    weeks[key].add(dayKey);
  }
  return Object.values(weeks).some((days) => days.size >= 5);
}

function getGrantTrophy(grant: TrophyGrant) {
  return Array.isArray(grant.exclusive_trophies)
    ? grant.exclusive_trophies[0]
    : grant.exclusive_trophies;
}

function normalizeVisual(visual: string | null | undefined) {
  if (!visual) return "trophy";
  if (["award", "calendar", "crown", "dumbbell", "flame", "medal", "shield", "sparkles", "star", "trophy", "zap"].includes(visual)) {
    return visual;
  }
  return "trophy";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR");
}

function firstActivityInSeason(season: Season, activities: { created_at: string }[]) {
  const start = new Date(`${season.startDate}T00:00:00`).getTime();
  const end = new Date(`${season.endDate}T23:59:59`).getTime();

  return activities
    .filter((activity) => {
      const time = new Date(activity.created_at).getTime();
      return time >= start && time <= end;
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
}

function sortTrophies(trophies: TrophyCollectionItem[]) {
  return [...trophies].sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    if (a.earnedAt && b.earnedAt) {
      return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
    }
    if (a.exclusive !== b.exclusive) return a.exclusive ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function dedupeTrophies(trophies: TrophyCollectionItem[]) {
  const map = new Map<string, TrophyCollectionItem>();
  for (const trophy of trophies) {
    if (!map.has(trophy.id)) map.set(trophy.id, trophy);
  }
  return [...map.values()];
}

export default async function ProfileTrophiesPage({ params }: Props) {
  const { username } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, avatar_type")
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const [
    { data: rawRuns },
    workoutsResult,
    trophiesResult,
    seasons,
  ] = await Promise.all([
    supabase
      .from("runs")
      .select("distance, pace, created_at")
      .eq("user_id", profile.user_id)
      .order("created_at", { ascending: true }),
    supabase
      .from("workouts")
      .select("muscle_group, muscle_groups, created_at")
      .eq("user_id", profile.user_id)
      .order("created_at", { ascending: true }),
    supabase
      .from("user_trophies")
      .select("id,awarded_at,note,exclusive_trophies(id,name,description,rarity,visual)")
      .eq("user_id", profile.user_id)
      .order("awarded_at", { ascending: false }),
    getAllSeasons(supabase),
  ]);

  const runs: RunRow[] = (rawRuns ?? []) as RunRow[];
  const workouts: WorkoutRow[] = (
    workoutsResult.error &&
    (workoutsResult.error.code === "42P01" ||
      workoutsResult.error.message?.toLowerCase().includes("workouts"))
      ? []
      : ((workoutsResult.data ?? []) as WorkoutRow[])
  );
  const exclusiveGrants: TrophyGrant[] = trophiesResult.error
    ? []
    : ((trophiesResult.data ?? []) as unknown as TrophyGrant[]);

  const allPaceSeconds = runs
    .map((run) => parsePaceToSeconds(run.pace))
    .filter((pace): pace is number => pace !== null);

  const achievementStats: AchievementStats = {
    totalRuns: runs.length,
    totalKm: runs.reduce((acc, run) => acc + Number(run.distance ?? 0), 0),
    longestRun: runs.reduce((max, run) => Math.max(max, Number(run.distance ?? 0)), 0),
    currentStreak: computeStreak(runs.map((run) => run.created_at)),
    bestPaceSeconds: allPaceSeconds.length > 0 ? Math.min(...allPaceSeconds) : null,
    gymTotalSessions: workouts.length,
    gymChestSessions: workouts.filter((workout) =>
      normalizeMuscleGroups(
        workout.muscle_groups?.length
          ? workout.muscle_groups
          : workout.muscle_group
          ? [workout.muscle_group]
          : []
      ).includes("peito")
    ).length,
    gymLegSessions: workouts.filter((workout) =>
      normalizeMuscleGroups(
        workout.muscle_groups?.length
          ? workout.muscle_groups
          : workout.muscle_group
          ? [workout.muscle_group]
          : []
      ).some((group) => ["quadriceps", "posterior-coxa", "gluteos", "panturrilhas"].includes(group))
    ).length,
    gymStreak: computeStreak(workouts.map((workout) => workout.created_at)),
    gymHasPersonalRecord: false,
    hasPerfectWeek: hasPerfectWeek(workouts.map((workout) => workout.created_at)),
  };

  const achievementCards = addAchievementUnlockDates({
    runs,
    workouts,
    achievements: ACHIEVEMENT_REGISTRY.map((achievement) => ({
      id: achievement.id,
      category: achievement.category,
      name: achievement.name,
      description: achievement.description,
      iconKey: achievement.iconKey,
      accentHex: achievement.accentHex,
      rarity: achievement.rarity,
      unlocked: achievement.check(achievementStats),
      progress: achievement.getProgress ? achievement.getProgress(achievementStats) : undefined,
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

  const automaticTrophies: TrophyCollectionItem[] = achievementCards.map((achievement) => {
    const rarity = RARITY_CONFIG[achievement.rarity];
    const progress = achievement.progress
      ? `${achievement.progress.current}/${achievement.progress.target} ${achievement.progress.unit}`
      : achievement.description;

    return {
      id: `achievement:${achievement.id}`,
      name: achievement.name,
      description: achievement.description,
      rarity: achievement.rarity,
      rarityLabel: rarity.label,
      rarityColor: rarity.color,
      iconKey: achievement.iconKey,
      earned: achievement.unlocked,
      earnedAt: achievement.unlockedAt,
      origin: "automatic",
      originLabel: "Conquista automatica",
      requirement: achievement.unlocked ? achievement.description : progress,
    };
  });

  const adminTrophies: TrophyCollectionItem[] = exclusiveGrants.flatMap((grant) => {
    const trophy = getGrantTrophy(grant);
    if (!trophy) return [];
    const rarity = EXCLUSIVE_RARITIES[trophy.rarity] ?? EXCLUSIVE_RARITIES.rare;

    return {
      id: `admin:${trophy.id}:${grant.id}`,
      name: trophy.name,
      description: trophy.description ?? "Trofeu especial entregue pela equipe GymPace.",
      rarity: trophy.rarity,
      rarityLabel: rarity.label,
      rarityColor: rarity.color,
      iconKey: normalizeVisual(trophy.visual),
      earned: true,
      earnedAt: grant.awarded_at,
      origin: "admin",
      originLabel: "Admin",
      requirement: "Concedido manualmente pela equipe GymPace.",
      note: grant.note,
      exclusive: true,
    };
  });

  const activities = [...runs, ...workouts];
  const seasonTrophies: TrophyCollectionItem[] = seasons.map((season) => {
    const firstActivity = firstActivityInSeason(season, activities);
    const earned = Boolean(firstActivity);

    return {
      id: `season:${season.id}`,
      name: season.name,
      description:
        season.description ??
        `Trofeu de participacao da temporada ${season.name}.`,
      rarity: season.isActive ? "active-season" : "season",
      rarityLabel: season.isActive ? "Temporada ativa" : "Temporada",
      rarityColor: season.color,
      iconKey: "calendar",
      earned,
      earnedAt: firstActivity?.created_at,
      origin: "season",
      originLabel: "Temporada",
      requirement: `Registrar uma atividade entre ${formatDate(season.startDate)} e ${formatDate(season.endDate)}.`,
    };
  });

  const trophies = sortTrophies(dedupeTrophies([
    ...adminTrophies,
    ...automaticTrophies,
    ...seasonTrophies,
  ]));

  const displayName = profile.display_name || profile.username || "Atleta";
  const athleteLabel = ATHLETE_LABELS[profile.avatar_type ?? ""] ?? "Atleta";

  return (
    <AppShell>
      <div className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        <div className="max-w-5xl space-y-4">
          <header className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-6 sm:p-8">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B6FF00]/35 to-transparent" />
            <div className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-[#B6FF00]/10 blur-[80px]" />

            <Link
              href={`/perfil/${profile.username}`}
              className="mb-5 inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-[#F5F5F5]/45 transition-colors hover:border-[#B6FF00]/25 hover:text-[#B6FF00]"
            >
              <ArrowLeft className="size-3.5" />
              Voltar ao perfil
            </Link>

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/65">
                  Colecao social
                </p>
                <h1 className="flex items-center gap-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  <Trophy className="size-8 text-[#EAB308]" />
                  Trofeus de {displayName}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#F5F5F5]/42">
                  Conquistas automaticas, trofeus exclusivos, temporadas e raridades exibidas no perfil publico.
                </p>
              </div>
              <div className="w-fit rounded-full border border-[#B6FF00]/20 bg-[#B6FF00]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B6FF00]">
                {athleteLabel}
              </div>
            </div>
          </header>

          <TrophyCollection trophies={trophies} />
        </div>
      </div>
    </AppShell>
  );
}
