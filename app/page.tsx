import { WeeklyEvolutionChartShell } from "@/components/ui/charts/weekly-evolution-chart-shell";
import { AppShell } from "@/components/ui/layout/app-shell";
import { XPCard } from "@/components/xp/xp-card";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { cn } from "@/lib/utils";
import {
  Activity,
  CalendarCheck,
  Dumbbell,
  Flag,
  Gauge,
  LucideIcon,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

type RunMetric = {
  distance: number | null;
  pace: string | null;
  created_at: string | null;
};

type RecentActivity = {
  id: string;
  type: "run" | "workout";
  created_at: string;
  // run fields
  distance?: number;
  pace?: string;
  duration?: string;
  run_type?: string;
  // workout fields
  title?: string;
  muscle_group?: string;
  duration_minutes?: number;
  intensity?: string;
};

const RUN_TYPE_LABELS: Record<string, string> = {
  leve: "Leve",
  intervalado: "Intervalado",
  longao: "Longão",
  regenerativo: "Regenerativo",
  prova: "Prova",
  ritmo: "Ritmo",
};

const MUSCLE_GROUP_LABELS: Record<string, string> = {
  peito: "Peito",
  costas: "Costas",
  pernas: "Pernas",
  ombros: "Ombros",
  bracos: "Braços",
  abdomen: "Abdômen",
  "full-body": "Full Body",
};

type Metric = {
  title: string;
  value: string;
  unit: string;
  detail: string;
  icon: LucideIcon;
  progress: string;
};

type DayActivity = {
  label: string;
  isoDate: string;
  isToday: boolean;
  isFuture: boolean;
  hasRun: boolean;
  hasWorkout: boolean;
};

const weeklyGoalKm = 50;

const fallbackMetrics: Metric[] = [
  {
    title: "KM semanal",
    value: "0",
    unit: "km",
    detail: "sem dados ainda",
    icon: TrendingUp,
    progress: "0%",
  },
  {
    title: "Pace médio",
    value: "--",
    unit: "/km",
    detail: "sem pace registrado",
    icon: Gauge,
    progress: "0%",
  },
  {
    title: "Treinos",
    value: "0",
    unit: "sessões",
    detail: "sem registros esta semana",
    icon: CalendarCheck,
    progress: "0%",
  },
  {
    title: "Meta semanal",
    value: "0",
    unit: "%",
    detail: `0 de ${weeklyGoalKm} km concluídos`,
    icon: Flag,
    progress: "0%",
  },
];

async function getRecentActivities(): Promise<RecentActivity[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const [runsResult, workoutsResult] = await Promise.all([
      supabase
        .from("runs")
        .select("id,distance,pace,duration,run_type,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("workouts")
        .select("id,title,muscle_group,duration_minutes,intensity,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const runs: RecentActivity[] = (runsResult.data ?? []).map((r) => ({
      id: String(r.id),
      type: "run" as const,
      created_at: r.created_at,
      distance: Number(r.distance ?? 0),
      pace: r.pace ?? undefined,
      duration: r.duration ?? undefined,
      run_type: r.run_type ?? undefined,
    }));

    const workouts: RecentActivity[] = (workoutsResult.data ?? []).map((w) => ({
      id: String(w.id),
      type: "workout" as const,
      created_at: w.created_at,
      title: w.title ?? undefined,
      muscle_group: w.muscle_group ?? undefined,
      duration_minutes: w.duration_minutes ?? undefined,
      intensity: w.intensity ?? undefined,
    }));

    return [...runs, ...workouts]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 6);
  } catch {
    return [];
  }
}

async function getDashboardMetrics(): Promise<Metric[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const weekStart = getWeekStartDate();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return fallbackMetrics;
    }

    const { data, error } = await supabase
      .from("runs")
      .select("distance,pace,created_at")
      .eq("user_id", user.id)
      .gte("created_at", weekStart.toISOString());

    if (error) {
      throw error;
    }

    return buildMetrics((data ?? []) as RunMetric[]);
  } catch {
    return fallbackMetrics;
  }
}

function buildMetrics(runs: RunMetric[]): Metric[] {
  const totalKm = runs.reduce(
    (total, run) => total + Number(run.distance ?? 0),
    0
  );
  const pacesInSeconds = runs
    .map((run) => parsePaceToSeconds(run.pace))
    .filter((pace): pace is number => pace !== null);
  const averagePace =
    pacesInSeconds.length > 0
      ? Math.round(
          pacesInSeconds.reduce((total, pace) => total + pace, 0) /
            pacesInSeconds.length
        )
      : null;
  const goalProgress = Math.min(
    Math.round((totalKm / weeklyGoalKm) * 100),
    100
  );
  const remainingKm = Math.max(weeklyGoalKm - totalKm, 0);

  return [
    {
      title: "KM semanal",
      value: formatDecimal(totalKm),
      unit: "km",
      detail: `${runs.length} corrida${runs.length === 1 ? "" : "s"} esta semana`,
      icon: TrendingUp,
      progress: `${goalProgress}%`,
    },
    {
      title: "Pace médio",
      value: averagePace ? formatSecondsToPace(averagePace) : "--",
      unit: "/km",
      detail: averagePace ? "média das corridas salvas" : "sem pace registrado",
      icon: Gauge,
      progress: `${averagePace ? Math.min(Math.round((300 / averagePace) * 100), 100) : 0}%`,
    },
    {
      title: "Treinos",
      value: String(runs.length),
      unit: runs.length === 1 ? "sessão" : "sessões",
      detail: "registros da semana atual",
      icon: CalendarCheck,
      progress: `${Math.min((runs.length / 6) * 100, 100)}%`,
    },
    {
      title: "Meta semanal",
      value: String(goalProgress),
      unit: "%",
      detail:
        remainingKm > 0
          ? `${formatDecimal(remainingKm)} km restantes`
          : "meta concluída",
      icon: Flag,
      progress: `${goalProgress}%`,
    },
  ];
}

function getWeekStartDate() {
  const date = new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function parsePaceToSeconds(value: string | null) {
  if (!value) return null;
  const [minutes, seconds] = value.split(":").map(Number);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
  return minutes * 60 + seconds;
}

async function getWeeklyChartData(): Promise<{ week: string; km: number; pace: number | null }[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 42);
    cutoff.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("runs")
      .select("distance,pace,created_at")
      .eq("user_id", user.id)
      .gte("created_at", cutoff.toISOString())
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) return [];

    const weekMap = new Map<string, { km: number; paceSeconds: number[] }>();
    for (const run of data) {
      const d = new Date(run.created_at);
      const day = d.getDay();
      const ws = new Date(d);
      ws.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
      ws.setHours(0, 0, 0, 0);
      const key = ws.toISOString();
      if (!weekMap.has(key)) weekMap.set(key, { km: 0, paceSeconds: [] });
      const entry = weekMap.get(key)!;
      entry.km += Number(run.distance ?? 0);
      const ps = parsePaceToSeconds(run.pace);
      if (ps !== null) entry.paceSeconds.push(ps);
    }

    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, { km, paceSeconds }], i) => {
        const avg = paceSeconds.length > 0
          ? paceSeconds.reduce((a, b) => a + b, 0) / paceSeconds.length
          : null;
        return {
          week: `S${i + 1}`,
          km: Math.round(km * 10) / 10,
          pace: avg !== null ? Math.floor(avg / 60) + (avg % 60) / 100 : null,
        };
      });
  } catch {
    return [];
  }
}

function buildEmptyWeek(): DayActivity[] {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const weekStart = new Date(today);
  const dow = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() + (dow === 0 ? -6 : 1 - dow));
  weekStart.setHours(0, 0, 0, 0);
  const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    return { label: labels[i], isoDate: iso, isToday: iso === todayStr, isFuture: iso > todayStr, hasRun: false, hasWorkout: false };
  });
}

async function getWeekConsistency(): Promise<DayActivity[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return buildEmptyWeek();

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const weekStart = new Date(today);
    const dow = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() + (dow === 0 ? -6 : 1 - dow));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [runsRes, workoutsRes] = await Promise.all([
      supabase.from("runs").select("created_at").eq("user_id", user.id)
        .gte("created_at", weekStart.toISOString()).lt("created_at", weekEnd.toISOString()),
      supabase.from("workouts").select("created_at").eq("user_id", user.id)
        .gte("created_at", weekStart.toISOString()).lt("created_at", weekEnd.toISOString()),
    ]);

    const runDays = new Set((runsRes.data ?? []).map((r) => r.created_at.slice(0, 10)));
    const workoutDays = new Set((workoutsRes.data ?? []).map((w) => w.created_at.slice(0, 10)));

    const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      return {
        label: labels[i],
        isoDate: iso,
        isToday: iso === todayStr,
        isFuture: iso > todayStr,
        hasRun: runDays.has(iso),
        hasWorkout: workoutDays.has(iso),
      };
    });
  } catch {
    return buildEmptyWeek();
  }
}

function formatSecondsToPace(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatRunDate(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hoje";
  if (date.toDateString() === yesterday.toDateString()) return "Ontem";

  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

export default async function Home() {
  const [metrics, recentActivities, chartData, weekDays] = await Promise.all([
    getDashboardMetrics(),
    getRecentActivities(),
    getWeeklyChartData(),
    getWeekConsistency(),
  ]);

  return (
    <AppShell>
      <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <header className="mb-6 sm:mb-8">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
            Overview
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1.5 max-w-lg text-sm leading-6 text-[#F5F5F5]/40 sm:mt-2">
            Volume semanal, pace médio e evolução em um painel focado no treino.
          </p>
        </header>

        <section
          className="grid grid-cols-2 gap-3 xl:grid-cols-4"
          aria-label="Métricas semanais"
        >
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </section>

        <div className="mt-3 max-w-xs">
          <XPCard />
        </div>

        <WeekConsistencyCard days={weekDays} />

        <WeeklyEvolutionChartShell data={chartData} />

        <RecentActivities activities={recentActivities} />
      </div>
    </AppShell>
  );
}

function MetricCard({ title, value, unit, detail, icon: Icon, progress }: Metric) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-4 transition-all duration-300 hover:border-white/[0.11] hover:bg-[#141414] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] sm:p-5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />

      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#F5F5F5]/38 sm:text-[11px] sm:tracking-[0.14em]">
          {title}
        </p>
        <div className="grid size-7 place-items-center rounded-lg bg-white/[0.05] text-[#B6FF00] transition-colors duration-200 group-hover:bg-[#B6FF00]/10 sm:size-8">
          <Icon className="size-3.5 sm:size-4" strokeWidth={2} />
        </div>
      </div>

      <div className="mb-4 sm:mb-5">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-[1.75rem] font-bold leading-none tracking-tight sm:text-[2.25rem]">
            {value}
          </span>
          <span className="pb-0.5 font-display text-xs font-bold text-[#B6FF00] sm:text-sm">{unit}</span>
        </div>
        <p className="mt-1.5 text-[11px] text-[#F5F5F5]/32 sm:mt-2 sm:text-xs">{detail}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-[#B6FF00] shadow-[0_0_8px_rgba(182,255,0,0.28)] transition-all duration-700"
            style={{ width: progress }}
          />
        </div>
        <span className="font-mono shrink-0 text-[11px] font-semibold tabular-nums text-[#F5F5F5]/32">
          {progress}
        </span>
      </div>
    </article>
  );
}

function RecentActivities({ activities }: { activities: RecentActivity[] }) {
  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
            Atividades
          </p>
          <h2 className="font-display text-base font-semibold">Atividades recentes</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] text-[#F5F5F5]/32">
            <span className="flex items-center gap-1">
              <span className="flex size-[14px] items-center justify-center rounded bg-[#B6FF00]/[0.12]">
                <Activity className="size-[9px] text-[#B6FF00]" strokeWidth={2.5} />
              </span>
              Corrida
            </span>
            <span className="flex items-center gap-1">
              <span className="flex size-[14px] items-center justify-center rounded bg-[#60A5FA]/[0.12]">
                <Dumbbell className="size-[9px] text-[#60A5FA]" strokeWidth={2.5} />
              </span>
              Academia
            </span>
          </div>
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-[#F5F5F5]/38">
            {activities.length}
          </span>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <Activity className="size-4 text-[#F5F5F5]/18" strokeWidth={1.5} />
            <Dumbbell className="size-4 text-[#F5F5F5]/18" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-[#F5F5F5]/35">
            Nenhuma atividade registrada ainda
          </p>
          <p className="mt-1 text-xs text-[#F5F5F5]/20">
            Registre corridas ou treinos de academia para ver aqui
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {activities.map((activity) => (
            <ActivityRow key={`${activity.type}-${activity.id}`} activity={activity} />
          ))}
        </div>
      )}
    </section>
  );
}

function ActivityRow({ activity }: { activity: RecentActivity }) {
  const isRun = activity.type === "run";
  const typeTag = isRun
    ? RUN_TYPE_LABELS[activity.run_type ?? ""] ?? null
    : MUSCLE_GROUP_LABELS[activity.muscle_group ?? ""] ?? null;

  return (
    <div className="group flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-white/[0.02] sm:gap-4 sm:px-5 sm:py-3.5">
      <div
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-xl border transition-colors duration-150 sm:size-9",
          isRun
            ? "border-[#B6FF00]/12 bg-[#B6FF00]/[0.07] text-[#B6FF00] group-hover:bg-[#B6FF00]/[0.12]"
            : "border-[#60A5FA]/12 bg-[#60A5FA]/[0.07] text-[#60A5FA] group-hover:bg-[#60A5FA]/[0.12]"
        )}
      >
        {isRun
          ? <Activity className="size-4 sm:size-[17px]" strokeWidth={2} />
          : <Dumbbell className="size-4 sm:size-[17px]" strokeWidth={2} />
        }
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-semibold text-[#F5F5F5]/85 sm:text-sm">
            {isRun ? "Corrida" : (activity.title || "Treino")}
          </p>
          {typeTag && (
            <span
              className={cn(
                "hidden shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-[0.08em] sm:inline",
                isRun
                  ? "bg-[#B6FF00]/[0.10] text-[#B6FF00]/65"
                  : "bg-[#60A5FA]/[0.10] text-[#60A5FA]/65"
              )}
            >
              {typeTag}
            </span>
          )}
        </div>
        <p className="text-[10px] text-[#F5F5F5]/28 sm:text-[11px]">{formatRunDate(activity.created_at)}</p>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        {isRun ? (
          <>
            <div className="text-right">
              <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-[#F5F5F5]/28 sm:text-[10px] sm:tracking-[0.1em]">
                Dist.
              </p>
              <p className="font-mono text-xs font-semibold text-[#F5F5F5]/80 sm:text-sm">
                {formatDecimal(activity.distance ?? 0)}<span className="text-[10px] text-[#F5F5F5]/45"> km</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-[#F5F5F5]/28 sm:text-[10px] sm:tracking-[0.1em]">
                Dur.
              </p>
              <p className="font-mono text-xs font-semibold text-[#F5F5F5]/80 sm:text-sm">
                {activity.duration ?? "--"}
              </p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#F5F5F5]/28">
                Pace
              </p>
              <p className="font-mono text-sm font-semibold text-[#F5F5F5]/80">
                {activity.pace ?? "--"}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-right">
              <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-[#F5F5F5]/28 sm:text-[10px] sm:tracking-[0.1em]">
                Dur.
              </p>
              <p className="font-mono text-xs font-semibold text-[#F5F5F5]/80 sm:text-sm">
                {activity.duration_minutes ?? "--"}<span className="ml-0.5 text-[10px] text-[#F5F5F5]/40">min</span>
              </p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#F5F5F5]/28">
                Grupo
              </p>
              <p className="font-mono text-sm font-semibold text-[#F5F5F5]/80">
                {MUSCLE_GROUP_LABELS[activity.muscle_group ?? ""] ?? "—"}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Weekly Consistency Card ──────────────────────────────────────────────────

function WeekConsistencyCard({ days }: { days: DayActivity[] }) {
  const activeDays = days.filter((d) => d.hasRun || d.hasWorkout).length;

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
            Consistência
          </p>
          <h2 className="font-display text-base font-semibold">Semana atual</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="font-mono text-xs font-bold tabular-nums text-[#B6FF00]">
            {activeDays}/7 dias
          </span>
          <div className="flex items-center gap-2.5 text-[10px] text-[#F5F5F5]/38">
            <span className="flex items-center gap-1">
              <span className="flex size-[14px] items-center justify-center rounded bg-[#B6FF00]/[0.15] shadow-[0_0_6px_rgba(182,255,0,0.18)]">
                <Activity className="size-[9px] text-[#B6FF00]" strokeWidth={2.5} />
              </span>
              Corrida
            </span>
            <span className="flex items-center gap-1">
              <span className="flex size-[14px] items-center justify-center rounded bg-[#60A5FA]/[0.15] shadow-[0_0_6px_rgba(96,165,250,0.18)]">
                <Dumbbell className="size-[9px] text-[#60A5FA]" strokeWidth={2.5} />
              </span>
              Academia
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {days.map((day) => (
            <DayCell key={day.isoDate} day={day} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DayCell({ day }: { day: DayActivity }) {
  const { label, isToday, isFuture, hasRun, hasWorkout } = day;
  const hasBoth = hasRun && hasWorkout;
  const hasAny = hasRun || hasWorkout;

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={cn(
          "text-[10px] font-bold uppercase tracking-[0.08em]",
          isToday ? "text-[#B6FF00]" : "text-[#F5F5F5]/28"
        )}
      >
        {label}
      </span>

      <div
        className={cn(
          "group relative flex aspect-square w-full max-w-[42px] items-center justify-center rounded-xl border transition-all duration-300 sm:max-w-[52px]",
          // today, no activity
          isToday && !hasAny
            ? "border-[#B6FF00]/20 bg-[#B6FF00]/[0.04] shadow-[0_0_14px_rgba(182,255,0,0.07)] hover:border-[#B6FF00]/35 hover:bg-[#B6FF00]/[0.08]"
            : !hasAny && isFuture
            // future, no activity
            ? "border-white/[0.04] bg-transparent"
            : !hasAny
            // past, no activity
            ? "border-white/[0.05] bg-white/[0.02] hover:border-white/[0.08]"
            : hasBoth
            // both run + workout
            ? "border-white/[0.18] bg-gradient-to-br from-[#B6FF00]/[0.13] to-[#60A5FA]/[0.13] shadow-[0_0_18px_rgba(182,255,0,0.10),0_0_18px_rgba(96,165,250,0.08)] hover:shadow-[0_0_24px_rgba(182,255,0,0.18),0_0_24px_rgba(96,165,250,0.14)] hover:scale-[1.06]"
            : hasRun
            // run only
            ? "border-[#B6FF00]/[0.28] bg-[#B6FF00]/[0.10] shadow-[0_0_16px_rgba(182,255,0,0.14)] hover:border-[#B6FF00]/[0.45] hover:bg-[#B6FF00]/[0.16] hover:shadow-[0_0_22px_rgba(182,255,0,0.22)] hover:scale-[1.06]"
            // workout only
            : "border-[#60A5FA]/[0.28] bg-[#60A5FA]/[0.10] shadow-[0_0_16px_rgba(96,165,250,0.14)] hover:border-[#60A5FA]/[0.45] hover:bg-[#60A5FA]/[0.16] hover:shadow-[0_0_22px_rgba(96,165,250,0.22)] hover:scale-[1.06]"
        )}
      >
        {hasBoth ? (
          <div className="flex flex-col items-center gap-0.5">
            <Activity className="size-[11px] text-[#B6FF00]" strokeWidth={2.5} />
            <Dumbbell className="size-[11px] text-[#60A5FA]" strokeWidth={2.5} />
          </div>
        ) : hasRun ? (
          <Activity className="size-[18px] text-[#B6FF00] drop-shadow-[0_0_6px_rgba(182,255,0,0.55)]" strokeWidth={2.2} />
        ) : hasWorkout ? (
          <Dumbbell className="size-[18px] text-[#60A5FA] drop-shadow-[0_0_6px_rgba(96,165,250,0.55)]" strokeWidth={2.2} />
        ) : isToday ? (
          <span className="size-1.5 animate-pulse rounded-full bg-[#B6FF00]/40" />
        ) : null}
      </div>

      {isToday && (
        <span className="size-1 rounded-full bg-[#B6FF00] shadow-[0_0_4px_rgba(182,255,0,0.8)]" />
      )}
    </div>
  );
}
