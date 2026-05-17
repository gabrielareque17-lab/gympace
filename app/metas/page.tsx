import {
  Calendar,
  Flag,
  Gauge,
  LucideIcon,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";

import { AppShell } from "@/components/ui/layout/app-shell";
import {
  ComingSoonBadge,
  EmptyState,
  PageHeader,
  SectionCard,
} from "@/components/ui/page-layout";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Goal = {
  label: string;
  icon: LucideIcon;
  current: number | string;
  target: number | string;
  unit: string;
  progress: number;
};

const WEEKLY_KM_GOAL = 50;
const WEEKLY_RUNS_GOAL = 5;
const TARGET_PACE = "5:00";
const TARGET_PACE_SECONDS = 300;
const MONTHLY_KM_GOAL = 200;

function getWeekStart(): Date {
  const date = new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getMonthStart(): Date {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function parsePaceToSeconds(value: string | null): number | null {
  if (!value) return null;
  const [minutes, seconds] = value.split(":").map(Number);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
  return minutes * 60 + seconds;
}

function formatSecondsToPace(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

async function getGoalsData(): Promise<Goal[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return buildEmptyGoals();

    const weekStart = getWeekStart();
    const monthStart = getMonthStart();

    const [weekResult, monthResult] = await Promise.all([
      supabase
        .from("runs")
        .select("distance,pace,created_at")
        .eq("user_id", user.id)
        .gte("created_at", weekStart.toISOString()),
      supabase
        .from("runs")
        .select("distance")
        .eq("user_id", user.id)
        .gte("created_at", monthStart.toISOString()),
    ]);

    if (weekResult.error) throw weekResult.error;
    if (monthResult.error) throw monthResult.error;

    const weekRuns = weekResult.data ?? [];
    const monthRuns = monthResult.data ?? [];

    const weekKm = weekRuns.reduce((sum, r) => sum + Number(r.distance ?? 0), 0);
    const monthKm = monthRuns.reduce((sum, r) => sum + Number(r.distance ?? 0), 0);

    const pacesInSeconds = weekRuns
      .map((r) => parsePaceToSeconds(r.pace))
      .filter((p): p is number => p !== null);

    const avgPaceSeconds =
      pacesInSeconds.length > 0
        ? Math.round(pacesInSeconds.reduce((a, b) => a + b, 0) / pacesInSeconds.length)
        : null;

    const weekKmProgress = Math.min(Math.round((weekKm / WEEKLY_KM_GOAL) * 100), 100);
    const runsProgress = Math.min(Math.round((weekRuns.length / WEEKLY_RUNS_GOAL) * 100), 100);
    const paceProgress =
      avgPaceSeconds !== null
        ? Math.min(Math.round((TARGET_PACE_SECONDS / avgPaceSeconds) * 100), 100)
        : 0;
    const monthKmProgress = Math.min(Math.round((monthKm / MONTHLY_KM_GOAL) * 100), 100);

    return [
      {
        label: "KM semanal",
        icon: TrendingUp,
        current: formatDecimal(weekKm),
        target: WEEKLY_KM_GOAL,
        unit: "km",
        progress: weekKmProgress,
      },
      {
        label: "Frequência",
        icon: Calendar,
        current: weekRuns.length,
        target: WEEKLY_RUNS_GOAL,
        unit: "treinos/sem",
        progress: runsProgress,
      },
      {
        label: "Pace alvo",
        icon: Gauge,
        current: avgPaceSeconds !== null ? formatSecondsToPace(avgPaceSeconds) : "--",
        target: TARGET_PACE,
        unit: "/km",
        progress: paceProgress,
      },
      {
        label: "KM mensal",
        icon: Flag,
        current: formatDecimal(monthKm),
        target: MONTHLY_KM_GOAL,
        unit: "km",
        progress: monthKmProgress,
      },
    ];
  } catch {
    return buildEmptyGoals();
  }
}

function buildEmptyGoals(): Goal[] {
  return [
    { label: "KM semanal", icon: TrendingUp, current: 0, target: WEEKLY_KM_GOAL, unit: "km", progress: 0 },
    { label: "Frequência", icon: Calendar, current: 0, target: WEEKLY_RUNS_GOAL, unit: "treinos/sem", progress: 0 },
    { label: "Pace alvo", icon: Gauge, current: "--", target: TARGET_PACE, unit: "/km", progress: 0 },
    { label: "KM mensal", icon: Flag, current: 0, target: MONTHLY_KM_GOAL, unit: "km", progress: 0 },
  ];
}

export default async function MetasPage() {
  const goals = await getGoalsData();

  return (
    <AppShell>
      <div className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        <PageHeader
          eyebrow="Objetivos"
          title="Metas"
          description="Defina e acompanhe seus objetivos de treino. Visualize o progresso em tempo real."
        />

        <section
          aria-label="Metas de treino"
          className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {goals.map((goal) => (
            <GoalCard key={goal.label} {...goal} />
          ))}
        </section>

        <div className="grid gap-4 xl:grid-cols-[1fr_0.46fr]">
          <SectionCard label="Progresso" title="Semana atual">
            <div className="space-y-3 p-5">
              {goals.map((goal) => (
                <GoalRow key={goal.label} {...goal} />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            label="Conquistas"
            title="Badges"
            badge={<ComingSoonBadge />}
          >
            <div className="grid grid-cols-3 gap-2 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex aspect-square items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.02]"
                >
                  <Star
                    className="size-5 text-[#F5F5F5]/12"
                    strokeWidth={1.5}
                  />
                </div>
              ))}
            </div>
            <p className="px-5 pb-5 text-center text-xs text-[#F5F5F5]/22">
              Complete metas para desbloquear badges
            </p>
          </SectionCard>
        </div>

        <SectionCard
          label="Configurações"
          title="Personalizar metas"
          className="mt-4"
          badge={<ComingSoonBadge />}
        >
          <EmptyState
            icon={Target}
            title="Metas personalizadas em breve"
            subtitle="Defina quilometragem, pace alvo e frequência de treino"
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}

function GoalCard({
  label,
  icon: Icon,
  current,
  target,
  unit,
  progress,
}: Goal) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-5 transition-all duration-300 hover:border-white/[0.11] hover:bg-[#141414] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F5F5F5]/38">
          {label}
        </p>
        <div className="grid size-8 place-items-center rounded-lg bg-white/[0.05] text-[#B6FF00] transition-colors duration-200 group-hover:bg-[#B6FF00]/10">
          <Icon className="size-4" strokeWidth={2} />
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[2.25rem] font-bold leading-none tracking-tight">
            {current}
          </span>
          <span className="pb-0.5 font-display text-sm font-bold text-[#B6FF00]">
            {unit}
          </span>
        </div>
        <p className="mt-2 text-xs text-[#F5F5F5]/32">
          meta: {target} {unit}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-[#B6FF00] shadow-[0_0_8px_rgba(182,255,0,0.28)] transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-mono shrink-0 text-[11px] font-semibold tabular-nums text-[#F5F5F5]/32">
          {progress}%
        </span>
      </div>
    </article>
  );
}

function GoalRow({ label, icon: Icon, current, target, unit, progress }: Goal) {
  return (
    <div className="flex items-center gap-4">
      <div className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#B6FF00]/12 bg-[#B6FF00]/[0.06] text-[#B6FF00]">
        <Icon className="size-3.5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[#F5F5F5]/50">{label}</span>
          <span className="font-mono text-[11px] font-semibold tabular-nums text-[#F5F5F5]/55">
            {current} / {target} {unit}
          </span>
        </div>
        <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-[#B6FF00] shadow-[0_0_6px_rgba(182,255,0,0.3)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
