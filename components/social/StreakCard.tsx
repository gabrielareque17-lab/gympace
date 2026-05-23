"use client";

import { Activity, Dumbbell, Star, Zap } from "lucide-react";
import type { ElementType } from "react";

import type { StreakData } from "@/lib/streaks";
import { getLocalDateKey } from "@/lib/date-utils";

const STREAK_CONFIG: Record<string, { label: string; sublabel: string; Icon: ElementType; color: string }> = {
  run:     { label: "Corrida",   sublabel: "dias correndo",  Icon: Activity, color: "#B6FF00" },
  gym:     { label: "Academia",  sublabel: "dias treinando", Icon: Dumbbell, color: "#22D3EE" },
  hybrid:  { label: "Híbrido",   sublabel: "corrida + gym",  Icon: Zap,      color: "#A78BFA" },
  general: { label: "Atividade", sublabel: "dias ativos",    Icon: Star,     color: "#FB923C" },
};

type Props = {
  data: StreakData;
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
  const d = new Date(`${dateStr}T12:00:00`);
  return (d.getDay() + 6) % 7;
}

export function StreakCard({ data, activeDays = [] }: Props) {
  const cfg = STREAK_CONFIG[data.streakType];
  if (!cfg) return null;

  const isActive = data.currentStreak > 0;
  const lastSeven = getLastSevenDays();
  const activeSet = new Set(activeDays);
  const { color, Icon } = cfg;

  return (
    <div
      className="relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 transition-all duration-300"
      style={{
        border: `1px solid ${isActive ? `${color}28` : "rgba(245,245,245,0.07)"}`,
        background: isActive
          ? `radial-gradient(ellipse at top left, ${color}0D 0%, transparent 60%), #0F0F0F`
          : "#0D0D0D",
      }}
    >
      {/* Top shimmer */}
      {isActive && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(to right, transparent, ${color}55, transparent)` }}
        />
      )}

      {/* Glow blob */}
      {isActive && (
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full blur-[48px]"
          style={{ background: `${color}16` }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <div
            className="grid size-6 shrink-0 place-items-center rounded-lg"
            style={{
              background: isActive ? `${color}18` : "rgba(245,245,245,0.06)",
              border: `1px solid ${isActive ? `${color}28` : "rgba(245,245,245,0.08)"}`,
              color: isActive ? color : "rgba(245,245,245,0.22)",
            }}
          >
            <Icon className="size-3.5" strokeWidth={2} />
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: isActive ? `${color}cc` : "rgba(245,245,245,0.28)" }}
          >
            {cfg.label}
          </span>
        </div>

        {data.bestStreak > 0 && (
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold"
            style={{ background: `${color}10`, color: `${color}66` }}
          >
            ↑{data.bestStreak}d
          </span>
        )}
      </div>

      {/* Counter */}
      <div className="flex items-end justify-between">
        <div className="flex items-end gap-2">
          <span
            className="font-mono text-[38px] font-bold leading-none tabular-nums"
            style={{
              color: isActive ? color : "rgba(245,245,245,0.13)",
              textShadow: isActive ? `0 0 22px ${color}48` : "none",
            }}
          >
            {data.currentStreak}
          </span>
          <div className="mb-1 flex flex-col leading-tight">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ color: isActive ? `${color}99` : "rgba(245,245,245,0.18)" }}
            >
              dias
            </span>
            <span className="text-[9px] text-[#F5F5F5]/28">{cfg.sublabel}</span>
          </div>
        </div>

        {isActive && (
          <div className="relative mb-1 shrink-0">
            <span className="absolute inset-0 animate-ping text-xl opacity-20">🔥</span>
            <span className="relative text-xl leading-none">🔥</span>
          </div>
        )}
      </div>

      {/* 7-day bars */}
      <div className="flex items-end gap-[3px]">
        {lastSeven.map((date, i) => {
          const active = activeSet.has(date);
          const dayIdx = getDayIndex(date);
          const isToday = i === lastSeven.length - 1;
          return (
            <div key={date} className="flex flex-1 flex-col items-center gap-[3px]">
              <div
                className="w-full rounded-t-[3px] transition-all duration-500"
                style={{
                  height: 14,
                  background: active
                    ? color
                    : isToday
                    ? `${color}22`
                    : "rgba(245,245,245,0.07)",
                  boxShadow: active ? `0 0 5px ${color}50` : "none",
                }}
              />
              <span
                className="text-[7px] font-bold"
                style={{
                  color: active
                    ? `${color}90`
                    : isToday
                    ? "rgba(245,245,245,0.38)"
                    : "rgba(245,245,245,0.20)",
                }}
              >
                {DAY_LABELS[dayIdx]}
              </span>
            </div>
          );
        })}
      </div>

      {!isActive && (
        <p className="text-[9px] leading-snug text-[#F5F5F5]/22">
          Registre hoje para iniciar a sequência
        </p>
      )}
    </div>
  );
}
