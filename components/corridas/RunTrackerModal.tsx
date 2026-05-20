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
  SquareX,
  Timer,
  Wind,
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

// ─── GPS signal indicator ─────────────────────────────────────────────────────

function GpsIndicator({
  status,
  accuracy,
}: {
  status: string;
  accuracy: number | null;
}) {
  const quality = gpsSignalQuality(accuracy);

  const colors: Record<string, string> = {
    none: "#F5F5F5/25",
    poor: "#EF4444",
    ok: "#FB923C",
    good: "#22D3EE",
    excellent: "#B6FF00",
  };

  const labels: Record<string, string> = {
    none: status === "denied" ? "GPS negado" : status === "unavailable" ? "GPS indisponível" : "Aguardando GPS...",
    poor: "Sinal fraco",
    ok: "Sinal OK",
    good: "Sinal bom",
    excellent: "Sinal excelente",
  };

  const dotColor = status === "denied" || status === "unavailable" ? "#EF4444" : colors[quality];
  const label = status === "denied" ? "GPS negado" : status === "unavailable" ? "GPS indisponível" : labels[quality];

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="relative flex size-2.5 shrink-0"
      >
        {quality !== "none" && status === "active" && (
          <span
            className="absolute inline-flex size-full animate-ping rounded-full opacity-60"
            style={{ background: dotColor }}
          />
        )}
        <span
          className="relative inline-flex size-2.5 rounded-full"
          style={{ background: dotColor }}
        />
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#F5F5F5]/45">
        {label}
      </span>
      {accuracy !== null && quality !== "none" && (
        <span className="text-[10px] text-[#F5F5F5]/25">
          ±{Math.round(accuracy)}m
        </span>
      )}
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({
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
      <p className="font-mono text-base font-bold text-[#F5F5F5]/90">{value}</p>
      <p className="text-[9px] font-medium text-[#F5F5F5]/30">{unit}</p>
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

  // Start tracking immediately when modal opens
  useEffect(() => {
    tracker.start();
    // Acquire wake lock to prevent screen sleep
    if ("wakeLock" in navigator) {
      (navigator as { wakeLock: { request(type: string): Promise<{ release(): Promise<void> }> } })
        .wakeLock.request("screen")
        .then((lock) => { wakeLockRef.current = lock; })
        .catch(() => {/* not available on this device */});
    }
    return () => {
      wakeLockRef.current?.release().catch(() => {});
    };
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

  // ── Derived metrics ──────────────────────────────────────────────────────────

  const elapsed = summary?.elapsedSeconds ?? tracker.elapsedSeconds;
  const distance = summary?.distanceKm ?? tracker.distanceKm;
  const pace = secondsToPaceString(elapsed, distance);
  const speed = avgSpeedKmh(distance, elapsed);
  const calories = estimateCalories(distance);
  const durationStr = secondsToDurationString(elapsed);

  const isPaused = tracker.state === "paused";
  const rt = RUN_TYPES.find((t) => t.value === runType) ?? RUN_TYPES[0];

  // ── Summary screen ───────────────────────────────────────────────────────────

  if (modalState === "summary" || modalState === "saving") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#080808]">
        <div className="min-h-full px-4 pb-8 pt-safe-top">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between pt-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
                Corrida concluída
              </p>
              <h1 className="font-display mt-1 text-xl font-bold">Resumo</h1>
            </div>
            <div className="grid size-9 place-items-center rounded-xl border border-white/[0.07] bg-[#B6FF00]/10">
              <CheckCircle2 className="size-5 text-[#B6FF00]" strokeWidth={2} />
            </div>
          </div>

          {/* Primary metric */}
          <div className="mb-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-6 text-center">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B6FF00]/30 to-transparent" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F5F5F5]/30">
              Distância
            </p>
            <p className="font-display mt-2 text-6xl font-bold tabular-nums tracking-tight">
              {distance.toFixed(2)}
              <span className="ml-2 text-xl font-bold text-[#B6FF00]">km</span>
            </p>
          </div>

          {/* Stats grid */}
          <div className="mb-4 grid grid-cols-4 gap-2">
            <StatPill icon={Timer} label="Tempo" value={durationStr} unit="hh:mm" />
            <StatPill icon={Gauge} label="Pace" value={pace} unit="/km" accent="#22D3EE" />
            <StatPill icon={Activity} label="Veloc." value={String(speed)} unit="km/h" accent="#A78BFA" />
            <StatPill icon={Flame} label="Calorias" value={String(calories)} unit="kcal" accent="#FB923C" />
          </div>

          {/* Route map */}
          {summary && summary.points.length >= 2 && (
            <div className="mb-4 h-52 overflow-hidden rounded-2xl border border-white/[0.07]">
              <RouteMap points={summary.points} className="h-full w-full" />
            </div>
          )}
          {summary && summary.points.length < 2 && (
            <div className="mb-4 flex h-20 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-xs text-[#F5F5F5]/30">Rota GPS não disponível</p>
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
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={modalState === "saving"}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] text-sm font-semibold text-[#F5F5F5]/55 transition hover:bg-white/[0.07] disabled:opacity-50"
            >
              <X className="size-4" />
              Descartar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={modalState === "saving"}
              className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl bg-[#B6FF00] text-sm font-bold text-[#080808] shadow-[0_0_24px_rgba(182,255,0,0.2)] transition hover:shadow-[0_0_32px_rgba(182,255,0,0.3)] disabled:opacity-55"
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

  // ── Tracking screen ──────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#080808]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-safe-top pt-4">
        <GpsIndicator status={tracker.gpsStatus} accuracy={tracker.accuracy} />
        {isPaused && (
          <span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-400">
            Pausado
          </span>
        )}
        <button
          type="button"
          onClick={handleDiscard}
          className="grid size-8 place-items-center rounded-lg text-[#F5F5F5]/28 transition hover:bg-white/[0.06] hover:text-[#F5F5F5]/60"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Timer */}
      <div className="flex shrink-0 flex-col items-center pt-6 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5F5F5]/30">
          Tempo
        </p>
        <p
          className="font-display mt-1 text-7xl font-bold tabular-nums tracking-tight leading-none"
          style={{ color: isPaused ? "rgba(245,245,245,0.35)" : "#F5F5F5" }}
        >
          {durationStr}
        </p>
      </div>

      {/* Distance — primary metric */}
      <div className="flex flex-1 flex-col items-center justify-center gap-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5F5F5]/30">
          Distância
        </p>
        <p className="font-display text-[88px] font-bold tabular-nums leading-none tracking-tighter text-[#F5F5F5]">
          {distance.toFixed(2)}
        </p>
        <p className="text-2xl font-bold text-[#B6FF00]">km</p>
      </div>

      {/* Secondary stats */}
      <div className="shrink-0 grid grid-cols-3 gap-3 px-5 pb-4">
        <StatPill icon={Gauge} label="Pace" value={pace} unit="/km" accent="#22D3EE" />
        <StatPill icon={Wind} label="Velocidade" value={String(speed)} unit="km/h" accent="#A78BFA" />
        <StatPill icon={Flame} label="Calorias" value={String(calories)} unit="kcal" accent="#FB923C" />
      </div>

      {/* GPS permission denied / unavailable warning */}
      {(tracker.gpsStatus === "denied" || tracker.gpsStatus === "unavailable") && (
        <div className="mx-5 mb-3 shrink-0 rounded-xl border border-orange-400/20 bg-orange-400/[0.07] px-4 py-2.5 text-center">
          <p className="text-xs font-medium text-orange-300/80">
            {tracker.gpsStatus === "denied"
              ? "Permissão GPS negada. O tempo continua sendo registrado."
              : "GPS indisponível. Verifique suas configurações."}
          </p>
        </div>
      )}

      {/* PWA banner — keep screen on */}
      <div className="mx-5 mb-4 shrink-0 flex items-center gap-2 rounded-xl border border-[#B6FF00]/12 bg-[#B6FF00]/[0.05] px-3 py-2">
        <Zap className="size-3.5 shrink-0 text-[#B6FF00]/60" strokeWidth={2} />
        <p className="text-[10px] font-medium text-[#F5F5F5]/40">
          Mantenha o app aberto para rastreamento preciso.
        </p>
      </div>

      {/* Controls */}
      <div className="shrink-0 flex gap-3 px-5 pb-safe-bottom pb-8">
        {/* Pause / Resume */}
        <button
          type="button"
          onClick={isPaused ? tracker.resume : tracker.pause}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.06] text-sm font-bold text-[#F5F5F5]/80 transition hover:bg-white/[0.09]"
        >
          {isPaused ? (
            <>
              <Play className="size-5" strokeWidth={2.5} />
              Retomar
            </>
          ) : (
            <>
              <Pause className="size-5" strokeWidth={2.5} />
              Pausar
            </>
          )}
        </button>

        {/* Finish */}
        <button
          type="button"
          onClick={handleFinish}
          className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-2xl bg-[#B6FF00] text-sm font-bold text-[#080808] shadow-[0_0_28px_rgba(182,255,0,0.22)] transition hover:shadow-[0_0_40px_rgba(182,255,0,0.3)]"
        >
          <SquareX className="size-5" strokeWidth={2.5} />
          Finalizar
        </button>
      </div>
    </div>
  );
}
