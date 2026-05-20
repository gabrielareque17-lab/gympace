"use client";

import { useMemo, useState } from "react";
import {
  Award,
  CalendarDays,
  Check,
  Crown,
  Dumbbell,
  Flame,
  Lock,
  Medal,
  Shield,
  Sparkles,
  Star,
  Trophy,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type TrophyFilter = "all" | "earned" | "locked" | "exclusive" | "season";

export type TrophyCollectionItem = {
  id: string;
  name: string;
  description: string;
  rarity: string;
  rarityLabel: string;
  rarityColor: string;
  iconKey: string;
  earned: boolean;
  earnedAt?: string;
  origin: "automatic" | "admin" | "season";
  originLabel: string;
  requirement: string;
  note?: string | null;
  exclusive?: boolean;
};

const FILTERS: { key: TrophyFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "earned", label: "Conquistados" },
  { key: "locked", label: "Faltando" },
  { key: "exclusive", label: "Exclusivos" },
  { key: "season", label: "Temporadas" },
];

const ICONS: Record<string, LucideIcon> = {
  award: Award,
  calendar: CalendarDays,
  crown: Crown,
  dumbbell: Dumbbell,
  flame: Flame,
  medal: Medal,
  shield: Shield,
  sparkles: Sparkles,
  star: Star,
  trophy: Trophy,
  zap: Zap,
};

function formatDate(date?: string) {
  if (!date) return "Ainda não conquistado";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function matchesFilter(trophy: TrophyCollectionItem, filter: TrophyFilter) {
  if (filter === "earned") return trophy.earned;
  if (filter === "locked") return !trophy.earned;
  if (filter === "exclusive") return trophy.exclusive || trophy.origin === "admin";
  if (filter === "season") return trophy.origin === "season";
  return true;
}

export function TrophyCollection({
  trophies,
}: {
  trophies: TrophyCollectionItem[];
}) {
  const [filter, setFilter] = useState<TrophyFilter>("all");
  const [selected, setSelected] = useState<TrophyCollectionItem | null>(null);

  const filteredTrophies = useMemo(
    () => trophies.filter((trophy) => matchesFilter(trophy, filter)),
    [filter, trophies]
  );

  const stats = useMemo(
    () => ({
      earned: trophies.filter((trophy) => trophy.earned).length,
      locked: trophies.filter((trophy) => !trophy.earned).length,
      exclusive: trophies.filter((trophy) => trophy.exclusive || trophy.origin === "admin").length,
      season: trophies.filter((trophy) => trophy.origin === "season").length,
    }),
    [trophies]
  );

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
        <div className="relative px-5 py-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B6FF00]/30 to-transparent" />
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Conquistados" value={stats.earned} color="#B6FF00" />
            <Stat label="Faltando" value={stats.locked} color="#94A3B8" />
            <Stat label="Exclusivos" value={stats.exclusive} color="#EAB308" />
            <Stat label="Temporadas" value={stats.season} color="#60A5FA" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
        <div className="border-b border-white/[0.05] p-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-150",
                  filter === item.key
                    ? "border-[#B6FF00]/35 bg-[#B6FF00]/10 text-[#B6FF00] shadow-[0_0_24px_rgba(182,255,0,0.08)]"
                    : "border-white/[0.07] bg-white/[0.03] text-[#F5F5F5]/40 hover:border-white/[0.14] hover:text-[#F5F5F5]/70"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTrophies.length === 0 ? (
          <div className="grid place-items-center px-5 py-14 text-center">
            <div className="mb-3 grid size-11 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-[#F5F5F5]/25">
              <Trophy className="size-5" />
            </div>
            <p className="text-sm font-semibold text-[#F5F5F5]/50">Nada por aqui ainda.</p>
          </div>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTrophies.map((trophy) => (
              <TrophyCard key={trophy.id} trophy={trophy} onClick={() => setSelected(trophy)} />
            ))}
          </div>
        )}
      </section>

      {selected && <TrophyModal trophy={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/35">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function TrophyCard({
  trophy,
  onClick,
}: {
  trophy: TrophyCollectionItem;
  onClick: () => void;
}) {
  const Icon = ICONS[trophy.iconKey] ?? Trophy;
  const premium = trophy.exclusive || trophy.origin === "admin";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative min-h-[190px] overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200",
        "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B6FF00]/30",
        trophy.earned ? "bg-[#0B0B0B]" : "bg-white/[0.018] opacity-70",
        premium ? "border-[#EAB308]/25 shadow-[0_0_34px_rgba(234,179,8,0.08)]" : "border-white/[0.06]"
      )}
      style={{
        boxShadow: trophy.earned
          ? `0 0 0 1px ${trophy.rarityColor}18, 0 18px 42px rgba(0,0,0,0.28)`
          : undefined,
      }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full blur-[55px] transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: trophy.rarityColor + (trophy.earned ? "20" : "08") }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div
          className={cn(
            "grid size-12 place-items-center rounded-2xl border",
            trophy.earned ? "border-white/[0.08]" : "border-white/[0.04]"
          )}
          style={{
            background: trophy.earned ? trophy.rarityColor + "18" : "rgba(255,255,255,0.035)",
            color: trophy.earned ? trophy.rarityColor : "rgba(245,245,245,0.22)",
          }}
        >
          {trophy.earned ? <Icon className="size-6" /> : <Lock className="size-5" />}
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {premium && (
            <span className="rounded-full border border-[#EAB308]/25 bg-[#EAB308]/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#EAB308]">
              Exclusivo
            </span>
          )}
          <span
            className="rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em]"
            style={{ background: trophy.rarityColor + "16", color: trophy.rarityColor }}
          >
            {trophy.rarityLabel}
          </span>
        </div>
      </div>

      <div className="relative mt-4">
        <p className={cn("text-sm font-bold", trophy.earned ? "text-[#F5F5F5]/90" : "text-[#F5F5F5]/42")}>
          {trophy.name}
        </p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#F5F5F5]/35">
          {trophy.description}
        </p>
      </div>

      <div className="relative mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/25">
            {trophy.originLabel}
          </p>
          <p className="mt-1 text-xs text-[#F5F5F5]/38">
            {trophy.earned ? formatDate(trophy.earnedAt) : trophy.requirement}
          </p>
        </div>
        <div
          className={cn(
            "grid size-7 place-items-center rounded-full",
            trophy.earned ? "bg-[#B6FF00]/12 text-[#B6FF00]" : "bg-white/[0.04] text-[#F5F5F5]/20"
          )}
        >
          {trophy.earned ? <Check className="size-4" /> : <Lock className="size-3.5" />}
        </div>
      </div>
    </button>
  );
}

function TrophyModal({
  trophy,
  onClose,
}: {
  trophy: TrophyCollectionItem;
  onClose: () => void;
}) {
  const Icon = ICONS[trophy.iconKey] ?? Trophy;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0F0F0F] shadow-2xl">
        <div
          className="pointer-events-none absolute inset-x-10 -top-24 h-48 rounded-full blur-[70px]"
          style={{ background: trophy.rarityColor + "24" }}
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[#F5F5F5]/45 transition-colors hover:text-[#F5F5F5]"
        >
          <X className="size-4" />
        </button>

        <div className="relative p-6">
          <div
            className="mb-5 grid size-16 place-items-center rounded-2xl border border-white/[0.08]"
            style={{ background: trophy.rarityColor + "18", color: trophy.rarityColor }}
          >
            {trophy.earned ? <Icon className="size-8" /> : <Lock className="size-7" />}
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ background: trophy.rarityColor + "16", color: trophy.rarityColor }}
            >
              {trophy.rarityLabel}
            </span>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#F5F5F5]/45">
              {trophy.originLabel}
            </span>
            {trophy.exclusive && (
              <span className="rounded-full border border-[#EAB308]/25 bg-[#EAB308]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#EAB308]">
                Exclusivo
              </span>
            )}
          </div>

          <h2 className="font-display text-2xl font-bold tracking-tight text-[#F5F5F5]">
            {trophy.name}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#F5F5F5]/45">{trophy.description}</p>

          <div className="mt-6 grid gap-3">
            <Detail label="Status" value={trophy.earned ? "Conquistado" : "Bloqueado"} />
            <Detail label="Data recebida" value={formatDate(trophy.earnedAt)} />
            <Detail label="Requisito" value={trophy.requirement} />
            {trophy.note && <Detail label="Motivo admin" value={trophy.note} />}
          </div>
        </div>
      </article>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/25">
        {label}
      </p>
      <p className="mt-1 text-sm text-[#F5F5F5]/65">{value}</p>
    </div>
  );
}
