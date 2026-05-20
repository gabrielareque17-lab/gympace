"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Flame,
  Gauge,
  Loader2,
  Pause,
  Play,
  Square,
  Timer,
  X,
  Zap,
} from "lucide-react";

import type { GpsPoint } from "@/lib/geo";
import {
  avgSpeedKmh,
  estimateCalories,
  gpsSignalQuality,
  secondsToDurationString,
  secondsToPaceString,
} from "@/lib/geo";
import { useRunTracker } from "@/hooks/use-run-tracker";
import type { RunSummary } from "@/hooks/use-run-tracker";

const RouteMap = dynamic(
  () => import("./RouteMap").then((m) => ({ default: m.RouteMap })),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-white/[0.04]" /> }
);

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalState = "tracking" | "summary" | "saving";

type SavePayload = {
  distance: number;
  pace: string;
  duration: string;
  duration_seconds: number;
  avg_speed: number;
  calories: number;
  route_points: GpsPoint[];
  run_type: string;
  notes: string;
};

type Props = {
  onClose: () => void;
  onSaved: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const RUN_TYPES = [
  { value: "leve", label: "Corrida leve", color: "#22D3EE" },
  { value: "intervalado", label: "Intervalado", color: "#FB923C" },
  { value: "longao", label: "Longão", color: "#B6FF00" },
  { value: "regenerativo", label: "Regenerativo", color: "#A78BFA" },
  { value: "prova", label: "Prova", color: "#EAB308" },
  { value: "ritmo", label: "Treino ritmo", color: "#F472B6" },
] as const;

// Show live stats only after 50 m to avoid wild initial values
const MIN_STATS_KM = 0.05;

// ─── GPS pill ─────────────────────────────────────────────────────────────────

function GpsPill({ status, accuracy }: { status: string; accuracy: number | null }) {
  const quality = gpsSignalQuality(accuracy);

  const dotColor =
    status === "denied" || status === "unavailable"
      ? "#EF4444"
      : quality === "excellent"
      ? "#B6FF00"
      : quality === "good"
      ? "#22D3EE"
      : quality === "ok"
      ? "#FB923C"
      : quality === "poor"
      ? "#EF4444"
      : "rgba(245,245,245,0.25)";

  const label =
    status === "denied"
      ? "GPS negado"
      : status === "unavailable"
      ? "GPS indisponível"
      : status === "waiting"
      ? "Buscando GPS…"
      : quality === "excellent"
      ? "Sinal excelente"
      : quality === "good"
      ? "Sinal bom"
      : quality === "ok"
      ? "Sinal moderado"
      : quality === "poor"
      ? "Sinal fraco"
      : "Aguardando…";

  const isLive = status === "active" && (quality === "good" || quality === "excellent");

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">
      <span className="relative flex size-2 shrink-0">
        {isLive && (
          <span
            className="absolute inline-flex size-full animate-ping rounded-full opacity-75"
            style={{ background: dotColor }}
          />
        )}
        <span className="relative inline-flex size-2 rounded-full" style={{ background: dotColor }} />
      </span>
      <span
        className="text-[10px] font-bold uppercase tracking-[0.1em]"
        style={{ color: `${dotColor}cc` }}
      >
        {label}
      </span>
      {accuracy !== null && quality !== "none" && (
        <span className="text-[10px] text-[#F5F5F5]/22">±{Math.round(accuracy)}m</span>
      )}
    </div>
  );
}

// ─── Live stat card ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  accent = "#B6FF00",
  lit = true,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  accent?: string;
  lit?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-2xl px-2 py-3 transition-all duration-500"
      style={{
        border: `1px solid ${lit ? `${accent}22` : "rgba(245,245,245,0.05)"}`,
        background: lit ? `${accent}09` : "rgba(245,245,245,0.02)",
      }}
    >
      <Icon
        className="size-3.5 shrink-0"
        style={{ color: lit ? `${accent}99` : "rgba(245,245,245,0.2)" }}
        strokeWidth={2}
      />
      <p
        className="text-[9px] font-bold uppercase tracking-[0.12em]"
        style={{ color: lit ? "rgba(245,245,245,0.38)" : "rgba(245,245,245,0.18)" }}
      >
        {label}
      </p>
      <p
        className="font-mono text-lg font-bold tabular-nums leading-none"
        style={{ color: lit ? `${accent}f0` : "rgba(245,245,245,0.2)" }}
      >
        {value}
      </p>
      <p
        className="text-[9px] font-medium"
        style={{ color: lit ? "rgba(245,245,245,0.28)" : "rgba(245,245,245,0.12)" }}
      >
        {unit}
      </p>
    </div>
  );
}

// ─── Summary stat pill ────────────────────────────────────────────────────────

function SummaryStatPill({
  icon: Icon,
  label,
  value,
  unit,
  accent = "#B6FF00",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
      <Icon className="size-3.5 shrink-0" style={{ color: `${accent}99` }} strokeWidth={2} />
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/30">{label}</p>
      <p className="font-mono text-base font-bold tabular-nums" style={{ color: `${accent}f0` }}>
        {value}
      </p>
      <p className="text-[9px] font-medium text-[#F5F5F5]/28">{unit}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RunTrackerModal({ onClose, onSaved }: Props) {
  const tracker = useRunTracker();
  const [modalState, setModalState] = useState<ModalState>("tracking");
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [runType, setRunType] = useState("leve");
  const [notes, setNotes] = useState("");
  const [saveError, setSaveError] = useState("");
  const wakeLockRef = useRef<{ release(): Promise<void> } | null>(null);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("gympace:bottom-nav-visibility", { detail: { hidden: true } })
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("gympace:bottom-nav-visibility", { detail: { hidden: false } })
      );
    };
  }, []);

  useEffect(() => {
    tracker.start();
    if ("wakeLock" in navigator) {
      (navigator as { wakeLock: { request(type: string): Promise<{ release(): Promise<void> }> } })
        .wakeLock.request("screen")
        .then((lock) => { wakeLockRef.current = lock; })
        .catch(() => {});
    }
    return () => { wakeLockRef.current?.release().catch(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFinish = useCallback(() => {
    const result = tracker.finish();
    setSummary(result);
    setModalState("summary");
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, [tracker]);

  const handleDiscard = useCallback(() => {
    tracker.reset();
    onClose();
  }, [tracker, onClose]);

  async function handleSave() {
    if (!summary) return;
    setModalState("saving");
    setSaveError("");

    const pace = secondsToPaceString(summary.elapsedSeconds, summary.distanceKm);
    const duration = secondsToDurationString(summary.elapsedSeconds);
    const avgSpeed = avgSpeedKmh(summary.distanceKm, summary.elapsedSeconds);
    const calories = estimateCalories(summary.distanceKm);

    const payload: SavePayload = {
      distance: summary.distanceKm,
      pace,
      duration,
      duration_seconds: summary.elapsedSeconds,
      avg_speed: avgSpeed,
      calories,
      route_points: summary.points,
      run_type: runType,
      notes,
    };

    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Não foi possível salvar.");
      tracker.reset();
      onSaved();
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar corrida.");
      setModalState("summary");
    }
  }

  // ── Derived metrics (tracking screen) ──────────────────────────────────────

  const elapsed = tracker.elapsedSeconds;
  const distance = tracker.distanceKm;
  const hasStats = distance >= MIN_STATS_KM;
  const pace = hasStats ? secondsToPaceString(elapsed, distance) : "--:--";
  const speed = hasStats ? avgSpeedKmh(distance, elapsed) : 0;
  const calories = hasStats ? estimateCalories(distance) : 0;
  const durationStr = secondsToDurationString(elapsed);
  const isPaused = tracker.state === "paused";

  // ── Summary screen ──────────────────────────────────────────────────────────

  if (modalState === "summary" || modalState === "saving") {
    const sumDist = summary?.distanceKm ?? 0;
    const sumElapsed = summary?.elapsedSeconds ?? 0;
    const sumHasStats = sumDist >= 0.01;
    const sumPace = sumHasStats ? secondsToPaceString(sumElapsed, sumDist) : "--:--";
    const sumSpeed = sumHasStats ? avgSpeedKmh(sumDist, sumElapsed) : 0;
    const sumCalories = estimateCalories(sumDist);
    const sumDuration = secondsToDurationString(sumElapsed);

    return (
      <div className="fixed inset-0 z-50 h-dvh overflow-y-auto overscroll-contain bg-[#080808] [-webkit-overflow-scrolling:touch]">
        <div
          className="min-h-dvh px-4 pt-safe-top"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.25rem)" }}
        >

          {/* Header */}
          <div className="mb-6 flex items-center justify-between pt-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
                Corrida concluída
              </p>
              <h1 className="font-display mt-1 text-xl font-bold">Resumo</h1>
            </div>
            <div className="grid size-10 place-items-center rounded-xl border border-[#B6FF00]/25 bg-[#B6FF00]/[0.09] shadow-[0_0_20px_rgba(182,255,0,0.15)]">
              <CheckCircle2 className="size-5 text-[#B6FF00]" strokeWidth={2} />
            </div>
          </div>

          {/* Primary — distance */}
          <div className="relative mb-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-6 text-center">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B6FF00]/40 to-transparent" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F5F5F5]/30">
              Distância
            </p>
            <p className="font-display mt-2 text-6xl font-bold tabular-nums tracking-tight">
              {sumDist.toFixed(2)}
              <span className="ml-2 text-xl font-bold text-[#B6FF00]">km</span>
            </p>
          </div>

          {/* Stats grid */}
          <div className="mb-4 grid grid-cols-4 gap-2">
            <SummaryStatPill icon={Timer} label="Tempo" value={sumDuration} unit="hh:mm" />
            <SummaryStatPill icon={Gauge} label="Pace" value={sumPace} unit="/km" accent="#22D3EE" />
            <SummaryStatPill
              icon={Activity}
              label="Veloc."
              value={sumHasStats ? String(sumSpeed) : "--"}
              unit="km/h"
              accent="#A78BFA"
            />
            <SummaryStatPill icon={Flame} label="Calorias" value={String(sumCalories)} unit="kcal" accent="#FB923C" />
          </div>

          {/* Route map */}
          {summary && summary.points.length >= 2 ? (
            <div className="mb-4 h-52 overflow-hidden rounded-2xl border border-white/[0.07]">
              <RouteMap points={summary.points} className="h-full w-full" />
            </div>
          ) : (
            <div className="mb-4 flex h-16 items-center justify-center rounded-2xl border border-white/[0.05] bg-white/[0.02]">
              <p className="text-xs text-[#F5F5F5]/25">Rota GPS não disponível</p>
            </div>
          )}

          {/* Run type */}
          <div className="mb-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/30">
              Tipo de corrida
            </p>
            <div className="flex flex-wrap gap-2">
              {RUN_TYPES.map((t) => {
                const active = runType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setRunType(t.value)}
                    className="rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all"
                    style={
                      active
                        ? { borderColor: `${t.color}55`, background: `${t.color}14`, color: t.color }
                        : { borderColor: "rgba(245,245,245,0.07)", background: "rgba(245,245,245,0.03)", color: "rgba(245,245,245,0.4)" }
                    }
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-4">
            <label>
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/30">
                Observação{" "}
                <span className="font-normal normal-case text-[#F5F5F5]/20">(opcional)</span>
              </span>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Como foi a corrida hoje?"
                className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-[#F5F5F5] outline-none transition-all placeholder:text-[#F5F5F5]/16 focus:border-[#B6FF00]/28 focus:bg-white/[0.05]"
              />
            </label>
          </div>

          {saveError && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm font-medium text-red-300/90">
              {saveError}
            </div>
          )}

          {/* Actions */}
          <div
            className="sticky bottom-0 -mx-4 flex gap-3 border-t border-white/[0.06] bg-[#080808]/95 px-4 pt-3 backdrop-blur-xl"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1rem)" }}
          >
            <button
              type="button"
              onClick={handleDiscard}
              disabled={modalState === "saving"}
              className="mobile-tap flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] text-sm font-semibold text-[#F5F5F5]/55 transition-transform duration-100 active:scale-[0.97] active:opacity-80 hover:bg-white/[0.07] disabled:opacity-50"
            >
              <X className="size-4" />
              Descartar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={modalState === "saving"}
              className="mobile-tap flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl bg-[#B6FF00] text-sm font-bold text-[#080808] shadow-[0_0_24px_rgba(182,255,0,0.2)] transition-transform duration-100 active:scale-[0.97] hover:shadow-[0_0_32px_rgba(182,255,0,0.3)] disabled:opacity-55"
            >
              {modalState === "saving" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {modalState === "saving" ? "Salvando..." : "Salvar corrida"}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ── Tracking screen ─────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#080808] pt-safe-top">

      {/* ── Top bar ── */}
      <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-4">
        <GpsPill status={tracker.gpsStatus} accuracy={tracker.accuracy} />
        <button
          type="button"
          onClick={handleDiscard}
          className="mobile-tap grid size-8 place-items-center rounded-lg text-[#F5F5F5]/25 transition-transform duration-100 active:scale-[0.92] hover:bg-white/[0.06] hover:text-[#F5F5F5]/55"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* ── Live status badge ── */}
      <div className="flex shrink-0 justify-center py-2">
        {isPaused ? (
          <span className="flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-400/[0.08] px-4 py-1.5">
            <span className="size-1.5 rounded-full bg-orange-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-400">
              Pausado
            </span>
          </span>
        ) : (
          <span className="flex items-center gap-2 rounded-full border border-[#B6FF00]/25 bg-[#B6FF00]/[0.07] px-4 py-1.5">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#B6FF00] opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[#B6FF00]" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#B6FF00]">
              Correndo agora
            </span>
          </span>
        )}
      </div>

      {/* ── Timer ── */}
      <div className="shrink-0 py-4 text-center">
        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#F5F5F5]/28">Tempo</p>
        <p
          className="font-display mt-1 text-[72px] font-bold tabular-nums leading-none tracking-tight transition-colors duration-300"
          style={{ color: isPaused ? "rgba(245,245,245,0.28)" : "rgba(245,245,245,0.95)" }}
        >
          {durationStr}
        </p>
      </div>

      {/* ── Distance hero ── */}
      <div className="flex flex-1 flex-col items-center justify-center gap-0.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#F5F5F5]/28">Distância</p>
        <p
          className="font-display text-[88px] font-bold tabular-nums leading-none tracking-tighter transition-all duration-300"
          style={{
            color: isPaused ? "rgba(245,245,245,0.28)" : "#F5F5F5",
            textShadow: isPaused ? "none" : "0 0 48px rgba(182,255,0,0.1)",
          }}
        >
          {distance.toFixed(2)}
        </p>
        <p
          className="text-2xl font-bold transition-colors duration-300"
          style={{ color: isPaused ? "rgba(182,255,0,0.28)" : "#B6FF00" }}
        >
          km
        </p>
      </div>

      {/* ── Secondary stats ── */}
      <div className="shrink-0 grid grid-cols-3 gap-2.5 px-5 pb-3">
        <StatCard icon={Gauge} label="Pace" value={pace} unit="/km" accent="#22D3EE" lit={hasStats} />
        <StatCard
          icon={Activity}
          label="Veloc."
          value={hasStats ? String(speed) : "--"}
          unit="km/h"
          accent="#A78BFA"
          lit={hasStats}
        />
        <StatCard
          icon={Flame}
          label="Calorias"
          value={hasStats ? String(calories) : "--"}
          unit="kcal"
          accent="#FB923C"
          lit={hasStats}
        />
      </div>

      {/* ── GPS warning ── */}
      {(tracker.gpsStatus === "denied" || tracker.gpsStatus === "unavailable") && (
        <div className="mx-5 mb-3 shrink-0 rounded-xl border border-orange-400/20 bg-orange-400/[0.07] px-4 py-2.5 text-center">
          <p className="text-xs font-medium text-orange-300/80">
            {tracker.gpsStatus === "denied"
              ? "Permissão GPS negada — o tempo continua sendo registrado."
              : "GPS indisponível — verifique suas configurações."}
          </p>
        </div>
      )}

      {/* ── PWA tip ── */}
      <div className="mx-5 mb-5 shrink-0 flex items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2">
        <Zap className="size-3 shrink-0 text-[#B6FF00]/40" strokeWidth={2} />
        <p className="text-[9px] font-medium text-[#F5F5F5]/30">
          Mantenha o app aberto para rastreamento preciso.
        </p>
      </div>

      {/* ── Controls ── */}
      <div
        className="shrink-0 flex items-end justify-center gap-8 px-5 pb-safe-bottom"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 2.5rem)" }}
      >
        {/* Main action: morphs between Pause and Resume */}
        <div className="flex flex-col items-center gap-2.5">
          <button
            type="button"
            onClick={isPaused ? tracker.resume : tracker.pause}
            className="mobile-tap grid size-20 place-items-center rounded-full transition-transform duration-100 active:scale-[0.97]"
            style={
              isPaused
                ? {
                    background: "#B6FF00",
                    boxShadow: "0 0 40px rgba(182,255,0,0.45), 0 0 80px rgba(182,255,0,0.15)",
                  }
                : {
                    border: "1px solid rgba(245,245,245,0.14)",
                    background: "rgba(245,245,245,0.09)",
                    boxShadow: "0 0 24px rgba(255,255,255,0.06)",
                  }
            }
          >
            {isPaused ? (
              <Play
                className="size-8 translate-x-0.5 fill-current stroke-none"
                style={{ color: "#080808" }}
              />
            ) : (
              <Pause
                className="size-8"
                strokeWidth={2.5}
                style={{ color: "rgba(245,245,245,0.9)" }}
              />
            )}
          </button>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.14em] transition-colors duration-300"
            style={{ color: isPaused ? "rgba(182,255,0,0.65)" : "rgba(245,245,245,0.42)" }}
          >
            {isPaused ? "Retomar" : "Pausar"}
          </span>
        </div>

        {/* Finish — always visible as secondary */}
        <div className="mb-2 flex flex-col items-center gap-2.5">
          <button
            type="button"
            onClick={handleFinish}
            className="mobile-tap grid size-14 place-items-center rounded-full border border-white/[0.1] bg-white/[0.05] transition-transform duration-100 active:scale-[0.97] hover:bg-white/[0.09]"
          >
            <Square
              className="size-5 fill-current stroke-none"
              style={{ color: "rgba(245,245,245,0.55)" }}
            />
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/28">
            Finalizar
          </span>
        </div>
      </div>

    </div>
  );
}
