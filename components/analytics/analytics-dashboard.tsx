"use client";

import { Dumbbell, Flame, Gauge, Route } from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  AnalyticsData,
  HeatmapDay,
  PaceTrendPoint,
  PerformanceScoreData,
  WeeklyVolumePoint,
  WeeklyWorkoutPoint,
  WorkoutGroup,
} from "@/lib/analytics";

// ─── Constants ────────────────────────────────────────────────────────────────

const RANK_STYLES: Record<string, { label: string; color: string }> = {
  rookie: { label: "Rookie", color: "#94A3B8" },
  bronze: { label: "Bronze", color: "#CD7F32" },
  silver: { label: "Silver", color: "#A1A1AA" },
  gold: { label: "Gold", color: "#EAB308" },
  platinum: { label: "Platinum", color: "#22D3EE" },
  elite: { label: "Elite", color: "#B6FF00" },
};

const HEATMAP_COLORS = [
  "bg-white/[0.04] border-white/[0.05]",
  "bg-[#60A5FA]/[0.22] border-[#60A5FA]/[0.12]",
  "bg-[#B6FF00]/[0.28] border-[#B6FF00]/[0.14]",
  "bg-[#B6FF00]/[0.75] border-[#B6FF00]/[0.35] shadow-[0_0_5px_rgba(182,255,0,0.22)]",
];

const TOOLTIP_STYLE = {
  background: "#141414",
  border: "1px solid rgba(245,245,245,0.08)",
  borderRadius: "12px",
  boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
  fontSize: "12px",
  color: "#F5F5F5",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function secondsToPace(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatKm(km: number): string {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: km % 1 === 0 ? 0 : 1,
  }).format(km);
}

function SectionHeader({
  eyebrow,
  title,
  eyebrowColor = "text-[#B6FF00]/60",
  right,
}: {
  eyebrow: string;
  title: string;
  eyebrowColor?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
      <div>
        <p className={`mb-1 text-[10px] font-bold uppercase tracking-[0.18em] ${eyebrowColor}`}>
          {eyebrow}
        </p>
        <h2 className="font-display text-base font-semibold">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <p className="text-sm text-[#F5F5F5]/28">{message}</p>
    </div>
  );
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  unit,
  detail,
  icon: Icon,
  accentColor,
}: {
  label: string;
  value: string;
  unit: string;
  detail: string;
  icon: React.ElementType;
  accentColor: string;
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-5 transition-all duration-300 hover:border-white/[0.11] hover:bg-[#141414] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F5F5F5]/38">
          {label}
        </p>
        <div
          className="grid size-8 place-items-center rounded-lg transition-all duration-200 group-hover:scale-110"
          style={{ background: accentColor + "15", color: accentColor }}
        >
          <Icon className="size-4" strokeWidth={2} />
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[2.25rem] font-bold leading-none tracking-tight">
            {value}
          </span>
          <span
            className="pb-0.5 font-display text-sm font-bold"
            style={{ color: accentColor }}
          >
            {unit}
          </span>
        </div>
        <p className="mt-2 text-xs text-[#F5F5F5]/32">{detail}</p>
      </div>
    </article>
  );
}

// ─── Weekly Volume Chart ──────────────────────────────────────────────────────

function WeeklyVolumeSection({ data }: { data: WeeklyVolumePoint[] }) {
  const hasData = data.some((d) => d.km > 0);
  const maxKm = Math.max(...data.map((d) => d.km), 1);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
      <SectionHeader eyebrow="Volume" title="KM semanal" />

      {!hasData ? (
        <EmptyChart message="Registre corridas para ver seu volume semanal" />
      ) : (
        <div className="p-5">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={data}
                margin={{ top: 10, right: 4, left: -22, bottom: 0 }}
                barCategoryGap="28%"
              >
                <CartesianGrid
                  stroke="rgba(245,245,245,0.04)"
                  strokeDasharray="4 12"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(245,245,245,0.32)", fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(245,245,245,0.28)", fontSize: 11 }}
                  tickFormatter={(v) => `${v}k`}
                  domain={[0, Math.ceil(maxKm * 1.25)]}
                />
                <Tooltip
                  cursor={{ fill: "rgba(182,255,0,0.04)", radius: 4 }}
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(_value, _name, props) => [
                    `${props.payload.km} km · ${props.payload.runs} corrida${props.payload.runs !== 1 ? "s" : ""}`,
                    "Volume",
                  ]}
                  labelFormatter={(label) => `Semana ${label}`}
                />
                <Bar dataKey="km" radius={[5, 5, 0, 0]} maxBarSize={48}>
                  {data.map((entry, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={
                        i === data.length - 1
                          ? "#B6FF00"
                          : entry.km > 0
                            ? "rgba(182,255,0,0.32)"
                            : "rgba(245,245,245,0.05)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Performance Score ────────────────────────────────────────────────────────

function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-[#F5F5F5]/45">{label}</span>
        <span
          className="font-mono text-xs font-semibold tabular-nums"
          style={{ color }}
        >
          {value}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}44` }}
        />
      </div>
    </div>
  );
}

function PerformanceScoreSection({
  score,
  level,
  rankStyle,
  levelProgress,
  xpIntoLevel,
  xpForNextLevel,
}: {
  score: PerformanceScoreData;
  level: number;
  rankStyle: { label: string; color: string };
  levelProgress: number;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
}) {
  const conicAngle = Math.round((score.overall / 100) * 360);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
      <SectionHeader eyebrow="Performance" title="Score do atleta" />

      <div className="p-5">
        <div className="mb-5 flex flex-col items-center">
          <div
            className="relative grid size-28 place-items-center rounded-full"
            style={{
              background: `conic-gradient(${rankStyle.color} ${conicAngle}deg, rgba(255,255,255,0.05) ${conicAngle}deg)`,
              padding: "3px",
            }}
          >
            <div className="grid size-full place-items-center rounded-full bg-[#111111]">
              <div className="text-center">
                <p className="font-display text-3xl font-bold">{score.overall}</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#F5F5F5]/38">
                  Score
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: rankStyle.color }}>
              Nível {level}
            </span>
            <span
              className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ background: rankStyle.color + "18", color: rankStyle.color }}
            >
              {rankStyle.label}
            </span>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-white/[0.055] bg-white/[0.025] p-3">
          <div className="mb-2 flex items-center justify-between gap-3 text-[11px]">
            <span className="font-mono text-sm font-semibold tabular-nums text-[#F5F5F5]/62">
              {xpIntoLevel.toLocaleString("pt-BR")} / {xpForNextLevel?.toLocaleString("pt-BR") ?? "max"} XP
            </span>
            <span className="font-mono tabular-nums text-[#F5F5F5]/36">{levelProgress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${levelProgress}%`, background: rankStyle.color, boxShadow: `0 0 8px ${rankStyle.color}55` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <ScoreBar label="Consistência" value={score.consistency} color="#B6FF00" />
          <ScoreBar label="Volume" value={score.volume} color="#B6FF00" />
          <ScoreBar label="Sequência" value={score.streak} color="#FB923C" />
          <ScoreBar label="Nível XP" value={score.level} color={rankStyle.color} />
        </div>
      </div>
    </section>
  );
}

// ─── Pace Trend Chart ─────────────────────────────────────────────────────────

function PaceTrendSection({ data }: { data: PaceTrendPoint[] }) {
  const hasData = data.some((d) => d.avgPaceSeconds !== null);

  const allPaces = data
    .flatMap((d) => [d.avgPaceSeconds, d.bestPaceSeconds])
    .filter((p): p is number => p !== null);

  const minPace = allPaces.length ? Math.min(...allPaces) : 240;
  const maxPace = allPaces.length ? Math.max(...allPaces) : 420;
  const pad = 30;

  const legend = (
    <div className="flex gap-4 text-[11px] text-[#F5F5F5]/38">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-[#B6FF00]" />
        Médio
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-[#B6FF00]/40" />
        Melhor
      </span>
    </div>
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
      <SectionHeader eyebrow="Pace" title="Evolução do pace" right={legend} />

      {!hasData ? (
        <EmptyChart message="Registre corridas para ver a evolução do pace" />
      ) : (
        <div className="p-5">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart
                data={data}
                margin={{ top: 10, right: 8, left: -8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="paceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B6FF00" stopOpacity={0.14} />
                    <stop offset="100%" stopColor="#B6FF00" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(245,245,245,0.04)"
                  strokeDasharray="4 12"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(245,245,245,0.32)", fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(245,245,245,0.28)", fontSize: 11 }}
                  domain={[maxPace + pad, minPace - pad]}
                  tickFormatter={(v) => secondsToPace(Math.round(v))}
                />
                <Tooltip
                  cursor={{
                    stroke: "rgba(182,255,0,0.14)",
                    strokeDasharray: "4 8",
                    strokeWidth: 1,
                  }}
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value, name) => [
                    secondsToPace(Math.round(Number(value ?? 0))) + " /km",
                    name === "avgPaceSeconds" ? "Pace médio" : "Melhor pace",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="avgPaceSeconds"
                  stroke="transparent"
                  fill="url(#paceAreaGrad)"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="avgPaceSeconds"
                  stroke="#B6FF00"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: "#B6FF00", stroke: "#111111", strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: "#B6FF00", stroke: "#F5F5F5", strokeWidth: 1.5 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="bestPaceSeconds"
                  stroke="rgba(182,255,0,0.4)"
                  strokeWidth={1.5}
                  strokeDasharray="5 7"
                  dot={{
                    r: 3,
                    fill: "#111111",
                    stroke: "rgba(182,255,0,0.4)",
                    strokeWidth: 1.5,
                  }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Workout Load ─────────────────────────────────────────────────────────────

function WorkoutLoadSection({
  groups,
  weeklyMinutes,
}: {
  groups: WorkoutGroup[];
  weeklyMinutes: WeeklyWorkoutPoint[];
}) {
  const hasGroups = groups.length > 0;
  const hasMinutes = weeklyMinutes.some((w) => w.minutes > 0);
  const maxSessions = Math.max(...groups.map((g) => g.sessions), 1);
  const maxMinutes = Math.max(...weeklyMinutes.map((w) => w.minutes), 1);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
      <SectionHeader
        eyebrow="Academia"
        title="Carga de treino"
        eyebrowColor="text-[#60A5FA]/60"
      />

      <div className="p-5">
        {!hasGroups ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-[#F5F5F5]/28">Registre treinos para ver a carga</p>
          </div>
        ) : (
          <>
            {hasMinutes && (
              <div className="mb-5">
                <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/28">
                  Minutos por semana
                </p>
                <div className="flex h-[72px] items-end gap-1.5">
                  {weeklyMinutes.map((week, i) => {
                    const isCurrentWeek = i === weeklyMinutes.length - 1;
                    const height =
                      week.minutes > 0
                        ? Math.max((week.minutes / maxMinutes) * 100, 8)
                        : 0;
                    return (
                      <div
                        key={i}
                        className="flex flex-1 flex-col items-center justify-end"
                        title={`${week.label}: ${week.minutes} min`}
                      >
                        <div
                          className="w-full rounded-t-md transition-all duration-500"
                          style={{
                            height: `${height}%`,
                            background: isCurrentWeek
                              ? "#60A5FA"
                              : height > 0
                                ? "rgba(96,165,250,0.3)"
                                : "rgba(245,245,245,0.05)",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  {weeklyMinutes.map((week, i) => (
                    <span key={i} className="flex-1 text-center text-[9px] text-[#F5F5F5]/22">
                      {week.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/28">
              Grupos musculares
            </p>
            <div className="space-y-2.5">
              {groups.slice(0, 6).map((group) => (
                <div key={group.key} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-right text-[11px] font-medium text-[#F5F5F5]/45">
                    {group.label}
                  </span>
                  <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(group.sessions / maxSessions) * 100}%`,
                        background: "#60A5FA",
                        boxShadow: "0 0 6px rgba(96,165,250,0.35)",
                      }}
                    />
                  </div>
                  <span className="w-8 shrink-0 font-mono text-[11px] font-semibold tabular-nums text-[#F5F5F5]/38">
                    {group.sessions}×
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ─── Consistency Heatmap ──────────────────────────────────────────────────────

function ConsistencySection({
  heatmap,
  streak,
}: {
  heatmap: HeatmapDay[];
  streak: number;
}) {
  const firstDate = new Date(heatmap[0]?.date ?? new Date().toISOString());
  const firstDayOfWeek = firstDate.getDay();
  const startOffset = (firstDayOfWeek + 6) % 7;

  const activeDaysCount = heatmap.filter((d) => d.level > 0).length;
  const consistencyPct = Math.round((activeDaysCount / 84) * 100);

  const dayLabels = ["Seg", "", "Qua", "", "Sex", "", "Dom"];

  const legend = (
    <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#F5F5F5]/38">
      <span className="flex items-center gap-1">
        <span className="size-2.5 rounded-sm border border-[#60A5FA]/12 bg-[#60A5FA]/[0.22]" />
        Academia
      </span>
      <span className="flex items-center gap-1">
        <span className="size-2.5 rounded-sm border border-[#B6FF00]/14 bg-[#B6FF00]/[0.28]" />
        Corrida
      </span>
      <span className="flex items-center gap-1">
        <span className="size-2.5 rounded-sm border border-[#B6FF00]/35 bg-[#B6FF00]/[0.75]" />
        Ambos
      </span>
    </div>
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
      <SectionHeader eyebrow="Consistência" title="Atividade diária" right={legend} />

      <div className="p-5">
        <div className="mb-4 flex items-end gap-8">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/28">
              Consistência (12 sem.)
            </p>
            <p className="font-display text-2xl font-bold text-[#B6FF00]">{consistencyPct}%</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/28">
              Dias ativos
            </p>
            <p className="font-display text-2xl font-bold">{activeDaysCount}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/28">
              Sequência atual
            </p>
            <p className="font-display text-2xl font-bold text-[#FB923C]">{streak}</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          <div className="flex shrink-0 flex-col pt-5">
            {dayLabels.map((label, i) => (
              <div key={i} className="flex h-[14px] items-center">
                <span className="text-[9px] font-medium text-[#F5F5F5]/22 whitespace-nowrap">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="min-w-0 overflow-x-auto">
            <div
              className="inline-grid grid-flow-col gap-1"
              style={{ gridTemplateRows: "repeat(7, 1fr)" }}
            >
              {Array.from({ length: startOffset }, (_, i) => (
                <div key={`pad-${i}`} className="size-3 rounded-sm" />
              ))}
              {heatmap.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}${day.hasRun ? " · corrida" : ""}${day.hasWorkout ? " · academia" : ""}`}
                  className={`size-3 rounded-sm border transition-all duration-200 ${HEATMAP_COLORS[day.level]}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-end gap-1.5">
          <span className="text-[9px] text-[#F5F5F5]/22">Menos</span>
          {HEATMAP_COLORS.map((cls, i) => (
            <div key={i} className={`size-2.5 rounded-sm border ${cls}`} />
          ))}
          <span className="text-[9px] text-[#F5F5F5]/22">Mais</span>
        </div>
      </div>
    </section>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const { summary, profile, performanceScore, weeklyVolume, paceTrends, heatmap, workoutGroups, weeklyWorkoutMinutes } = data;
  const rankStyle = RANK_STYLES[profile.rank] ?? RANK_STYLES.rookie;

  return (
    <div className="space-y-4">
      <section aria-label="Resumo" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="KM total"
          value={formatKm(summary.totalKm)}
          unit="km"
          detail={`${summary.totalRuns} corrida${summary.totalRuns !== 1 ? "s" : ""} registradas`}
          icon={Route}
          accentColor="#B6FF00"
        />
        <SummaryCard
          label="Melhor pace"
          value={summary.bestPaceSeconds ? secondsToPace(summary.bestPaceSeconds) : "--"}
          unit="/km"
          detail={summary.bestPaceSeconds ? "recorde pessoal" : "sem corridas registradas"}
          icon={Gauge}
          accentColor="#B6FF00"
        />
        <SummaryCard
          label="Sequência ativa"
          value={String(summary.currentStreak)}
          unit={summary.currentStreak === 1 ? "dia" : "dias"}
          detail={summary.currentStreak > 0 ? "streak atual" : "inicie uma sequência"}
          icon={Flame}
          accentColor="#FB923C"
        />
        <SummaryCard
          label="Treinos"
          value={String(summary.totalWorkouts)}
          unit={summary.totalWorkouts === 1 ? "sessão" : "sessões"}
          detail="na academia registradas"
          icon={Dumbbell}
          accentColor="#60A5FA"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_272px]">
        <WeeklyVolumeSection data={weeklyVolume} />
        <PerformanceScoreSection
          score={performanceScore}
          level={profile.currentLevel}
          rankStyle={rankStyle}
          levelProgress={profile.levelProgress}
          xpIntoLevel={profile.xpIntoLevel}
          xpForNextLevel={profile.xpForNextLevel}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PaceTrendSection data={paceTrends} />
        <WorkoutLoadSection groups={workoutGroups} weeklyMinutes={weeklyWorkoutMinutes} />
      </div>

      <ConsistencySection heatmap={heatmap} streak={summary.currentStreak} />
    </div>
  );
}
