"use client";

import { useEffect, useRef, useState } from "react";
import {
  Award,
  BarChart2,
  Calendar,
  Check,
  Dumbbell,
  Flame,
  Layers,
  Lock,
  MapPin,
  Route,
  Shield,
  Star,
  Target,
  TrendingUp,
  Trophy,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RARITY_CONFIG, type AchievementRarity } from "@/lib/achievements";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AchievementCardData = {
  id: string;
  category: string;
  name: string;
  description: string;
  iconKey: string;
  accentHex: string;
  rarity: AchievementRarity;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: { current: number; target: number; unit: string };
};

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  route: Route,
  "map-pin": MapPin,
  "trending-up": TrendingUp,
  award: Award,
  target: Target,
  trophy: Trophy,
  zap: Zap,
  flame: Flame,
  dumbbell: Dumbbell,
  shield: Shield,
  layers: Layers,
  calendar: Calendar,
  "bar-chart-2": BarChart2,
  star: Star,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n % 1 === 0 ? String(Math.round(n)) : n.toFixed(1);
}

// ─── AchievementGrid ──────────────────────────────────────────────────────────

export function AchievementGrid({
  achievements,
  categories,
}: {
  achievements: AchievementCardData[];
  categories: { key: string; label: string; color: string }[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = achievements.find((a) => a.id === selectedId) ?? null;

  return (
    <>
      <div className="divide-y divide-white/[0.04] px-5">
        {categories.map((cat) => {
          const catItems = achievements.filter((a) => a.category === cat.key);
          const unlockedCount = catItems.filter((a) => a.unlocked).length;
          return (
            <div key={cat.key} className="py-5">
              {/* Category header */}
              <div className="mb-4 flex items-center gap-2.5">
                <div
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ background: cat.color }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: `${cat.color}99` }}
                >
                  {cat.label}
                </span>
                <div className="h-px flex-1 bg-white/[0.05]" />
                <span className="text-[10px] font-semibold tabular-nums text-[#F5F5F5]/28">
                  {unlockedCount}/{catItems.length}
                </span>
              </div>

              {/* Badge grid */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {catItems.map((a) => (
                  <AchievementCard
                    key={a.id}
                    achievement={a}
                    onClick={() => setSelectedId(a.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <AchievementModal
          achievement={selected}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}

// ─── AchievementCard ──────────────────────────────────────────────────────────

function AchievementCard({
  achievement,
  onClick,
}: {
  achievement: AchievementCardData;
  onClick: () => void;
}) {
  const { name, description, iconKey, accentHex, rarity, unlocked, progress } = achievement;
  const Icon = ICON_MAP[iconKey] ?? Star;
  const rarityInfo = RARITY_CONFIG[rarity];

  const pct =
    progress && !unlocked
      ? Math.min(Math.round((progress.current / progress.target) * 100), 100)
      : 0;
  const hasProgress = !unlocked && !!progress && progress.current > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full flex-col gap-2.5 rounded-2xl border p-3.5 text-left",
        "transition-all duration-150 hover:scale-[1.025] active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
      )}
      style={{
        borderColor: unlocked ? `${accentHex}28` : "rgba(255,255,255,0.05)",
        background: unlocked ? `${accentHex}0A` : "rgba(255,255,255,0.018)",
        boxShadow: unlocked
          ? `0 0 20px ${accentHex}10, 0 0 40px ${rarityInfo.glow}`
          : "none",
      }}
    >
      {/* Status indicator */}
      <div className="absolute right-2.5 top-2.5">
        {unlocked ? (
          <div
            className="grid size-[18px] place-items-center rounded-full"
            style={{ background: accentHex }}
          >
            <Check className="size-3 text-[#080808]" strokeWidth={3} />
          </div>
        ) : (
          <Lock className="size-3 text-[#F5F5F5]/15" strokeWidth={2} />
        )}
      </div>

      {/* Icon */}
      <div
        className="grid size-10 place-items-center rounded-xl"
        style={
          unlocked
            ? {
                background: `${accentHex}1E`,
                color: accentHex,
                boxShadow: `0 0 14px ${accentHex}30`,
              }
            : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.2)" }
        }
      >
        <Icon className="size-5" strokeWidth={unlocked ? 2 : 1.5} />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className="line-clamp-2 text-xs font-bold leading-tight"
          style={{ color: unlocked ? "#F5F5F5" : "rgba(255,255,255,0.28)" }}
        >
          {name}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[#F5F5F5]/22">
          {description}
        </p>
      </div>

      {/* Footer: rarity + progress */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <div
            className="size-1.5 rounded-full"
            style={{ background: unlocked ? rarityInfo.color : "rgba(255,255,255,0.15)" }}
          />
          <span
            className="text-[9px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: unlocked ? rarityInfo.color + "CC" : "rgba(255,255,255,0.18)" }}
          >
            {rarityInfo.label}
          </span>
        </div>
        {hasProgress && (
          <span className="text-[9px] tabular-nums text-[#F5F5F5]/28">
            {fmt(progress!.current)}/{fmt(progress!.target)}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {hasProgress && (
        <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: rarityInfo.color,
              boxShadow: `0 0 6px ${rarityInfo.color}60`,
            }}
          />
        </div>
      )}
    </button>
  );
}

// ─── AchievementModal ─────────────────────────────────────────────────────────

function AchievementModal({
  achievement,
  onClose,
}: {
  achievement: AchievementCardData;
  onClose: () => void;
}) {
  const { name, description, iconKey, accentHex, rarity, unlocked, progress } = achievement;
  const Icon = ICON_MAP[iconKey] ?? Star;
  const rarityInfo = RARITY_CONFIG[rarity];

  const pct = progress
    ? Math.min(Math.round((progress.current / progress.target) * 100), 100)
    : 0;

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        className="relative w-full max-w-xs overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0F0F0F]"
        style={{
          boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 32px 64px rgba(0,0,0,0.6), 0 0 80px ${unlocked ? accentHex + "18" : "transparent"}`,
        }}
      >
        {/* Top shimmer */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />

        {/* Background glow blob */}
        {unlocked && (
          <div
            className="pointer-events-none absolute -top-12 left-1/2 size-48 -translate-x-1/2 rounded-full blur-[60px]"
            style={{ background: accentHex + "14" }}
          />
        )}

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid size-7 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[#F5F5F5]/40 transition-colors hover:bg-white/[0.08] hover:text-[#F5F5F5]/80"
        >
          <X className="size-3.5" strokeWidth={2} />
        </button>

        {/* Content */}
        <div className="relative flex flex-col items-center px-6 pb-6 pt-8">
          {/* Large icon */}
          <div
            className="mb-4 grid size-20 place-items-center rounded-2xl"
            style={
              unlocked
                ? {
                    background: `${accentHex}18`,
                    boxShadow: `0 0 32px ${accentHex}30, inset 0 0 0 1px ${accentHex}20`,
                    color: accentHex,
                  }
                : {
                    background: "rgba(255,255,255,0.04)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.2)",
                  }
            }
          >
            <Icon className="size-9" strokeWidth={unlocked ? 1.8 : 1.4} />
          </div>

          {/* Rarity badge */}
          <div
            className="mb-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em]"
            style={{
              background: unlocked ? rarityInfo.color + "18" : "rgba(255,255,255,0.05)",
              color: unlocked ? rarityInfo.color : "rgba(255,255,255,0.2)",
              border: `1px solid ${unlocked ? rarityInfo.color + "30" : "rgba(255,255,255,0.07)"}`,
            }}
          >
            {rarityInfo.label}
          </div>

          {/* Name */}
          <h2
            className="text-center text-xl font-bold leading-tight tracking-tight"
            style={{ color: unlocked ? "#F5F5F5" : "rgba(255,255,255,0.35)" }}
          >
            {name}
          </h2>

          {/* Description */}
          <p className="mt-2 text-center text-sm leading-relaxed text-[#F5F5F5]/40">
            {description}
          </p>

          {/* Progress section */}
          {progress && (
            <div className="mt-5 w-full">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#F5F5F5]/30">
                  Progresso
                </span>
                <span className="text-[11px] font-semibold tabular-nums text-[#F5F5F5]/50">
                  {fmt(progress.current)}/{fmt(progress.target)} {progress.unit}
                </span>
              </div>
              <div className="h-[5px] overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: unlocked ? accentHex : rarityInfo.color,
                    boxShadow: `0 0 8px ${unlocked ? accentHex : rarityInfo.color}50`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-right text-[10px] tabular-nums text-[#F5F5F5]/22">
                {pct}% concluído
              </p>
            </div>
          )}

          {/* Status */}
          <div
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5"
            style={
              unlocked
                ? {
                    borderColor: accentHex + "25",
                    background: accentHex + "0A",
                  }
                : {
                    borderColor: "rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)",
                  }
            }
          >
            {unlocked ? (
              <>
                <Check
                  className="size-4"
                  style={{ color: accentHex }}
                  strokeWidth={2.5}
                />
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: accentHex }}
                >
                  Desbloqueado
                </span>
              </>
            ) : (
              <>
                <Lock className="size-3.5 text-[#F5F5F5]/25" strokeWidth={2} />
                <span className="text-[13px] font-semibold text-[#F5F5F5]/30">
                  Não desbloqueado
                </span>
              </>
            )}
          </div>
        </div>

        {/* Bottom rarity bar */}
        <div
          className="h-[3px] w-full"
          style={{
            background: unlocked
              ? `linear-gradient(90deg, transparent, ${rarityInfo.color}, transparent)`
              : "rgba(255,255,255,0.04)",
          }}
        />
      </div>
    </div>
  );
}
