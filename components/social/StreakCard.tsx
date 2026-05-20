"use client";

import type { StreakData } from "@/lib/streaks";
import { getLocalDateKey } from "@/lib/date-utils";

const STREAK_CONFIG = {
  run: {
    label: "Corrida",
    sublabel: "dias correndo",
    emoji: "🏃",
    color: "#B6FF00",
    icon: "🔥",
  },
  gym: {
    label: "Academia",
    sublabel: "dias treinando",
    emoji: "🏋️",
    color: "#22D3EE",
    icon: "⚡",
  },
  hybrid: {
    label: "Híbrido",
    sublabel: "dias corrida + gym",
    emoji: "⚡",
    color: "#A78BFA",
    icon: "🔥",
  },
  general: {
    label: "Atividade",
    sublabel: "dias ativos",
    emoji: "🌟",
    color: "#FB923C",
    icon: "🔥",
  },
} as const;

type Props = {
  data: StreakData;
  /** Pass the last 7 day strings (YYYY-MM-DD) that had activity, for mini-timeline */
  activeDays?: string[];
};

function getLastSevenDays(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return getLocalDateKey(d);
  });
}

const DAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];

function getDayIndex(dateStr: string): number {
  // 0 = Sun, needs to be 0 = Mon
  const d = new Date(`${dateStr}T12:00:00`);
  return (d.getDay() + 6) % 7;
}

export function StreakCard({ data, activeDays = [] }: Props) {
  const cfg = STREAK_CONFIG[data.streakType];
  const isActive = data.currentStreak > 0;
  const lastSeven = getLastSevenDays();
  const activeSet = new Set(activeDays);

  const color = cfg.color;
  const dimColor = `${color}40`;

  return (
    <div
      className="relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 transition-all duration-300"
      style={{
        border: `1px solid ${isActive ? `${color}30` : "rgba(245,245,245,0.06)"}`,
        background: isActive ? `${color}08` : "rgba(245,245,245,0.02)",
      }}
    >
      {/* Top shimmer when active */}
      {isActive && (
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(to right, transparent, ${color}55, transparent)` }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{cfg.emoji}</span>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: isActive ? `${color}cc` : "rgba(245,245,245,0.3)" }}
          >
            {cfg.label}
          </span>
        </div>
        {data.bestStreak > 0 && (
          <span className="text-[9px] text-[#F5F5F5]/25">
            Melhor: {data.bestStreak}d
          </span>
        )}
      </div>

      {/* Main counter */}
      <div className="flex items-end gap-2">
        <span
          className="font-mono text-[44px] font-bold leading-none tabular-nums transition-all duration-500"
          style={{
            color: isActive ? color : "rgba(245,245,245,0.18)",
            textShadow: isActive ? `0 0 32px ${color}55` : "none",
          }}
        >
          {data.currentStreak}
        </span>
        <div className="mb-1 flex flex-col">
          <span
            className="text-[10px] font-bold uppercase leading-tight tracking-[0.1em]"
            style={{ color: isActive ? `${color}99` : "rgba(245,245,245,0.2)" }}
          >
            dias
          </span>
          <span className="text-[9px] leading-tight text-[#F5F5F5]/25">
            {cfg.sublabel}
          </span>
        </div>

        {isActive && (
          <div className="relative ml-1 mb-1.5">
            <span
              className="absolute inset-0 animate-ping rounded-full text-base opacity-40"
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            >
              🔥
            </span>
            <span className="relative text-base">🔥</span>
          </div>
        )}
      </div>

      {/* Mini 7-day timeline */}
      <div className="flex items-center gap-1.5">
        {lastSeven.map((date) => {
          const active = activeSet.has(date);
          const dayIdx = getDayIndex(date);
          return (
            <div key={date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="size-[18px] rounded-[4px] transition-all duration-300"
                style={
                  active
                    ? { background: color, boxShadow: `0 0 6px ${dimColor}` }
                    : { background: "rgba(245,245,245,0.06)" }
                }
              />
              <span className="text-[8px] font-bold text-[#F5F5F5]/20">
                {DAY_LABELS[dayIdx]}
              </span>
            </div>
          );
        })}
      </div>

      {!isActive && (
        <p className="text-[10px] text-[#F5F5F5]/22">
          Registre hoje para iniciar a sequência
        </p>
      )}
    </div>
  );
}
