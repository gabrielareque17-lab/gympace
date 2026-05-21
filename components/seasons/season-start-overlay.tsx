"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Sparkles, Trophy, X, Zap } from "lucide-react";

import type { Season } from "@/lib/seasons";

const STORAGE_PREFIX = "gympace:season-start-seen:";

function hasSeenSeason(key: string) {
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function markSeasonSeen(key: string) {
  try {
    window.localStorage.setItem(key, "true");
  } catch {
    // If storage is unavailable, the close action should still work normally.
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

function getMultiplierLabel(multiplier: number) {
  if (multiplier <= 1) return "XP padrão";
  return `${multiplier.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: multiplier % 1 === 0 ? 0 : 1,
  })}x XP`;
}

export function SeasonStartOverlay() {
  const [season, setSeason] = useState<Season | null>(null);
  const [visible, setVisible] = useState(false);

  const storageKey = useMemo(() => {
    return season ? `${STORAGE_PREFIX}${season.id}` : null;
  }, [season]);

  const close = useCallback(() => {
    if (storageKey) {
      markSeasonSeen(storageKey);
    }
    setVisible(false);
  }, [storageKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadSeason() {
      try {
        const response = await fetch("/api/seasons", { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as { season?: Season | null };
        if (cancelled || !payload.season?.isActive) return;

        const key = `${STORAGE_PREFIX}${payload.season.id}`;
        if (hasSeenSeason(key)) return;

        setSeason(payload.season);
        setVisible(true);
      } catch {
        // The announcement should never block the app if seasons are unavailable.
      }
    }

    loadSeason();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    const timer = window.setTimeout(close, 7200);
    return () => window.clearTimeout(timer);
  }, [close, visible]);

  useEffect(() => {
    if (!visible) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        close();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, visible]);

  if (!season || !visible) return null;

  const color = season.color || "#B6FF00";
  const dateRange = `${formatDate(season.startDate)} - ${formatDate(season.endDate)}`;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6"
      aria-modal="true"
      role="dialog"
      aria-labelledby="season-start-title"
      onClick={close}
    >
      <div className="absolute inset-0 bg-black/78 backdrop-blur-md" />

      <div
        className="relative z-10 w-full max-w-[360px] overflow-hidden rounded-[28px] border px-6 py-7 text-center shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500 sm:max-w-md sm:px-8"
        style={{
          borderColor: `${color}42`,
          background: "linear-gradient(160deg, #111111 0%, #090909 100%)",
          boxShadow: `0 0 70px ${color}1F, 0 0 180px ${color}10`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Fechar aviso de temporada"
          onClick={close}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[#F5F5F5]/45 transition hover:text-[#F5F5F5]"
        >
          <X className="size-4" strokeWidth={2.2} />
        </button>

        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${color}A6, transparent)` }}
        />
        <div
          className="pointer-events-none absolute -top-20 left-1/2 size-64 -translate-x-1/2 rounded-full blur-[92px]"
          style={{ background: `${color}18` }}
        />

        <div className="relative mx-auto mb-6 grid size-20 place-items-center rounded-[24px] border" style={{
          borderColor: `${color}38`,
          background: `${color}14`,
          color,
          boxShadow: `0 0 44px ${color}2B`,
        }}>
          <Trophy className="size-10 animate-in zoom-in duration-700" strokeWidth={2.3} />
          <Sparkles
            className="absolute -right-2 -top-2 size-6"
            style={{ color }}
            strokeWidth={2.2}
          />
        </div>

        <p
          className="text-[10px] font-black uppercase tracking-[0.34em]"
          style={{ color: `${color}D9` }}
        >
          Temporada começou
        </p>

        <h2
          id="season-start-title"
          className="font-display mt-3 text-3xl font-black leading-tight tracking-tight text-[#F5F5F5] sm:text-4xl"
        >
          {season.name}
        </h2>

        {season.description ? (
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#F5F5F5]/58">
            {season.description}
          </p>
        ) : (
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#F5F5F5]/58">
            Uma nova etapa começou. Treine, registre sua evolução e suba no ranking.
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3">
            <div className="flex items-center gap-2 text-[#F5F5F5]/35">
              <CalendarDays className="size-4" strokeWidth={2.1} />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Período</span>
            </div>
            <p className="mt-2 text-sm font-bold text-[#F5F5F5]">{dateRange}</p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3">
            <div className="flex items-center gap-2 text-[#F5F5F5]/35">
              <Zap className="size-4" strokeWidth={2.2} />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Bônus</span>
            </div>
            <p className="mt-2 text-sm font-bold" style={{ color }}>
              {getMultiplierLabel(season.xpMultiplier)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/social"
            onClick={close}
            className="flex h-11 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-black text-[#080808] transition hover:brightness-110"
            style={{ background: color }}
          >
            Ver temporada
          </Link>
          <button
            type="button"
            onClick={close}
            className="h-11 flex-1 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 text-sm font-bold text-[#F5F5F5]/70 transition hover:bg-white/[0.07] hover:text-[#F5F5F5]"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
