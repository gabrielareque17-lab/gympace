"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Gauge,
  Loader2,
  MapPin,
  MoreVertical,
  Mountain,
  Pencil,
  Play,
  RefreshCw,
  Route,
  Timer,
  Trash2,
  Trophy,
  Wind,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/ui/layout/app-shell";
import { LevelUpOverlay } from "@/components/xp/level-up-overlay";
import { useProfile } from "@/hooks/use-profile";
import { formatDateLabel as formatRunDate } from "@/lib/date-utils";

const RunTrackerModal = dynamic(
  () =>
    import("@/components/corridas/RunTrackerModal").then(
      (m) => ({ default: m.RunTrackerModal })
    ),
  { ssr: false }
);

// ─── Types ────────────────────────────────────────────────────────────────────

type Run = {
  id: string;
  distance: number;
  pace: string;
  duration: string;
  duration_seconds: number | null;
  avg_speed: number | null;
  calories: number | null;
  run_type: string | null;
  notes: string | null;
  created_at: string;
};

type FormState = {
  distance: string;
  duration: string;
  pace: string;
  run_type: string;
  notes: string;
};

type SaveStatus = "idle" | "saving" | "success" | "error";
type RunsStatus = "idle" | "loading" | "ready" | "error";

type ProgressUpdate = {
  competitionId: string;
  title: string;
  type: string;
  previousProgress: number;
  nextProgress: number;
  delta: number;
  unit: string;
};

type XPFeedback = {
  gainedXp: number;
  totalXp: number;
  previousLevel: number;
  currentLevel: number;
  leveledUp: boolean;
  rank: string;
  levelProgress: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const RUN_TYPES = [
  { value: "leve", label: "Corrida leve", icon: Wind, color: "#22D3EE", desc: "Ritmo fácil" },
  { value: "intervalado", label: "Intervalado", icon: Zap, color: "#FB923C", desc: "Alta intensidade" },
  { value: "longao", label: "Longão", icon: Mountain, color: "#B6FF00", desc: "Longa distância" },
  { value: "regenerativo", label: "Regenerativo", icon: RefreshCw, color: "#A78BFA", desc: "Recuperação" },
  { value: "prova", label: "Prova", icon: Trophy, color: "#EAB308", desc: "Competição" },
  { value: "ritmo", label: "Treino ritmo", icon: Gauge, color: "#F472B6", desc: "Pace específico" },
  { value: "caminhada", label: "Caminhada", icon: Route, color: "#10B981", desc: "Caminhada ao ar livre" },
  { value: "esteira", label: "Corrida na esteira", icon: Activity, color: "#F97316", desc: "Treino indoor" },
] as const;

const initialForm: FormState = { distance: "", duration: "", pace: "", run_type: "leve", notes: "" };

// ─── Utilities ────────────────────────────────────────────────────────────────

function computePace(distKm: number, durationStr: string): string | null {
  const parts = durationStr.split(":").map(Number);
  if (parts.some((p) => !Number.isFinite(p))) return null;
  let totalSec: number;
  if (parts.length === 2) totalSec = parts[0] * 60 + parts[1];
  else if (parts.length === 3) totalSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
  else return null;
  if (distKm <= 0 || totalSec <= 0) return null;
  const paceSec = totalSec / distKm;
  const m = Math.floor(paceSec / 60);
  const s = Math.round(paceSec % 60);
  return s === 60 ? `${m + 1}:00` : `${m}:${s.toString().padStart(2, "0")}`;
}

function getRunType(value: string | null) {
  return RUN_TYPES.find((t) => t.value === value) ?? RUN_TYPES[0];
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchRunsFromApi(): Promise<Run[]> {
  const res = await fetch("/api/runs");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return res.status === 401 ? [] : Promise.reject(data.error ?? "Erro");
  return data.runs ?? [];
}

async function saveRunApi(form: FormState) {
  const res = await fetch("/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      distance: Number(form.distance),
      pace: form.pace,
      duration: form.duration,
      run_type: form.run_type,
      notes: form.notes,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Não foi possível salvar a corrida.");
  return data as { progressUpdates: ProgressUpdate[]; xpFeedback: XPFeedback | null };
}

async function deleteRunApi(id: string) {
  const res = await fetch(`/api/runs/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Não foi possível excluir.");
  return data as { progressUpdates: ProgressUpdate[]; xpFeedback: XPFeedback | null };
}

async function editRunApi(id: string, updates: Partial<FormState>) {
  const body: Record<string, unknown> = {};
  if (updates.distance) body.distance = Number(updates.distance);
  if (updates.pace) body.pace = updates.pace;
  if (updates.duration) body.duration = updates.duration;
  if (updates.run_type) body.run_type = updates.run_type;
  body.notes = updates.notes ?? null;

  const res = await fetch(`/api/runs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Não foi possível editar.");
  return data as { progressUpdates: ProgressUpdate[]; xpFeedback: XPFeedback | null };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RunsPage() {
  const { refetch: refetchProfile } = useProfile();
  const [form, setForm] = useState<FormState>(initialForm);
  const [paceIsAuto, setPaceIsAuto] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [runsStatus, setRunsStatus] = useState<RunsStatus>("loading");
  const [runs, setRuns] = useState<Run[]>([]);
  const [message, setMessage] = useState("");
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [xpFeedback, setXpFeedback] = useState<XPFeedback | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [editingRun, setEditingRun] = useState<Run | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showTracker, setShowTracker] = useState(false);

  const isSaving = status === "saving";

  // Auto-compute pace
  useEffect(() => {
    const dist = Number(form.distance);
    if (!form.distance || !form.duration || dist <= 0) return;
    const computed = computePace(dist, form.duration);
    if (computed && computed !== form.pace) {
      const id = window.setTimeout(() => {
        setForm((cur) => ({ ...cur, pace: computed }));
        setPaceIsAuto(true);
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [form.distance, form.duration, form.pace]);

  const loadRuns = useCallback(async () => {
    setRunsStatus("loading");
    try {
      setRuns(await fetchRunsFromApi());
      setRunsStatus("ready");
    } catch {
      setRunsStatus("error");
    }
  }, []);

  useEffect(() => {
    let alive = true;
    fetchRunsFromApi()
      .then((r) => { if (alive) { setRuns(r); setRunsStatus("ready"); } })
      .catch(() => { if (alive) setRunsStatus("error"); });
    return () => { alive = false; };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setMessage("");
    setProgressUpdates([]);
    setXpFeedback(null);
    try {
      const { progressUpdates: upd, xpFeedback: xp } = await saveRunApi(form);
      setForm(initialForm);
      setPaceIsAuto(false);
      setStatus("success");
      setMessage(upd.length > 0 ? "Corrida salva e leaderboard atualizado." : "Corrida salva com sucesso.");
      setProgressUpdates(upd);
      setXpFeedback(xp);
      if (xp?.leveledUp) setShowLevelUp(true);
      refetchProfile();
      await loadRuns();
    } catch {
      setStatus("error");
      setMessage("Não foi possível salvar a corrida.");
    }
  }

  async function handleDelete(id: string) {
    setDeleteLoading(true);
    try {
      const { xpFeedback: xp } = await deleteRunApi(id);
      setDeletingId(null);
      setXpFeedback(xp);
      if (xp?.leveledUp) setShowLevelUp(true);
      refetchProfile();
      await loadRuns();
    } catch {
      setDeleteLoading(false);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleEditSave(id: string, updates: FormState) {
    const { xpFeedback: xp } = await editRunApi(id, updates);
    setEditingRun(null);
    setXpFeedback(xp);
    if (xp?.leveledUp) setShowLevelUp(true);
    refetchProfile();
    await loadRuns();
  }

  function handleTrackerSaved() {
    refetchProfile();
    void loadRuns();
  }

  const runType = getRunType(form.run_type);

  return (
    <>
      {showTracker && (
        <RunTrackerModal
          onClose={() => setShowTracker(false)}
          onSaved={handleTrackerSaved}
        />
      )}
      {showLevelUp && xpFeedback && (
        <LevelUpOverlay
          level={xpFeedback.currentLevel}
          rank={xpFeedback.rank}
          totalXp={xpFeedback.totalXp}
          levelProgress={xpFeedback.levelProgress}
          onClose={() => setShowLevelUp(false)}
        />
      )}
      {editingRun && (
        <EditRunModal
          run={editingRun}
          onClose={() => setEditingRun(null)}
          onSave={handleEditSave}
        />
      )}
      <AppShell>
        <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {/* ── Header ─────────────────────────────────────────────────── */}
          <header className="mb-6 sm:mb-8">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
              Registro
            </p>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Corridas</h1>
                <p className="mt-1.5 max-w-lg text-sm leading-6 text-[#F5F5F5]/40 sm:mt-2">
                  Registre manualmente ou use o rastreamento GPS em tempo real.
                </p>
              </div>
              {/* Run tracker button */}
              <button
                type="button"
                onClick={() => setShowTracker(true)}
                className="mobile-tap group relative inline-flex shrink-0 items-center gap-2.5 overflow-hidden rounded-full bg-[#B6FF00] px-5 py-3 text-sm font-extrabold text-[#080808] shadow-[0_0_28px_rgba(182,255,0,0.32),0_0_56px_rgba(182,255,0,0.1)] transition-transform duration-100 hover:-translate-y-0.5 hover:shadow-[0_0_44px_rgba(182,255,0,0.5),0_0_80px_rgba(182,255,0,0.18)] active:scale-[0.97] active:translate-y-0 active:opacity-80"
              >
                {/* shimmer sweep */}
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                <Play className="relative size-4 fill-current stroke-none" />
                <span className="relative hidden sm:inline">Iniciar corrida</span>
                <span className="relative sm:hidden">Iniciar</span>
              </button>
            </div>
          </header>

          <section className="grid gap-4 xl:grid-cols-[1fr_0.55fr]">
            {/* ── Manual form ─────────────────────────────────────────── */}
            <form
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]"
            >
              <div className="relative border-b border-white/[0.05] px-4 py-4 sm:px-6 sm:py-5">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-base font-semibold">Registro manual</h2>
                    <p className="mt-1 text-sm text-[#F5F5F5]/38">Preencha distância e duração para calcular o pace.</p>
                  </div>
                  <div
                    className="grid size-9 place-items-center rounded-xl shadow-[0_0_20px_rgba(182,255,0,0.18)]"
                    style={{ background: runType.color }}
                  >
                    <Timer className="size-4 text-[#080808]" strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              {/* Run type selector */}
              <div className="border-b border-white/[0.05] px-4 py-4 sm:px-6">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/30">
                  Tipo de corrida
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {RUN_TYPES.map((t) => {
                    const Icon = t.icon;
                    const active = form.run_type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm((cur) => ({ ...cur, run_type: t.value }))}
                        className="mobile-tap flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-transform duration-100 active:scale-[0.97]"
                        style={
                          active
                            ? { borderColor: `${t.color}55`, background: `${t.color}14`, color: t.color }
                            : { borderColor: "rgba(245,245,245,0.07)", background: "rgba(245,245,245,0.03)", color: "rgba(245,245,245,0.4)" }
                        }
                      >
                        <Icon className="size-3.5 shrink-0" strokeWidth={2} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main fields */}
              <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-3">
                <RunInput
                  icon={MapPin}
                  label="Distância"
                  placeholder="8.5"
                  suffix="km"
                  type="number"
                  value={form.distance}
                  onChange={(v) => setForm((cur) => ({ ...cur, distance: v }))}
                />
                <RunInput
                  icon={Clock}
                  label="Duração"
                  placeholder="45:00"
                  suffix="min"
                  value={form.duration}
                  onChange={(v) => setForm((cur) => ({ ...cur, duration: v }))}
                />
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#F5F5F5]/50">
                      <Gauge className="size-3.5 text-[#B6FF00]/70" strokeWidth={2} />
                      Pace
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#B6FF00]/55">
                      {paceIsAuto && (
                        <span className="rounded-full bg-[#B6FF00]/12 px-1.5 py-0.5 text-[9px] font-bold text-[#B6FF00]/70">
                          AUTO
                        </span>
                      )}
                      /km
                    </span>
                  </div>
                  <input
                    required
                    type="text"
                    value={form.pace}
                    onChange={(e) => { setPaceIsAuto(false); setForm((cur) => ({ ...cur, pace: e.target.value })); }}
                    placeholder="5:18"
                    className="h-12 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 text-lg font-semibold text-[#F5F5F5] outline-none transition-all duration-200 placeholder:text-[#F5F5F5]/16 focus:border-[#B6FF00]/35 focus:bg-white/[0.05] focus:shadow-[0_0_0_3px_rgba(182,255,0,0.05)]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="px-4 pb-4 sm:px-6 sm:pb-5">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-[#F5F5F5]/38">
                    Observação <span className="font-normal text-[#F5F5F5]/25">(opcional)</span>
                  </span>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm((cur) => ({ ...cur, notes: e.target.value }))}
                    placeholder="Como foi o treino hoje?"
                    className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm font-medium text-[#F5F5F5] outline-none transition-all duration-200 placeholder:text-[#F5F5F5]/16 focus:border-[#B6FF00]/28 focus:bg-white/[0.05] focus:shadow-[0_0_0_3px_rgba(182,255,0,0.04)]"
                  />
                </label>
              </div>

              {/* Footer */}
              <div className="flex flex-col gap-3 border-t border-white/[0.05] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-xs font-medium text-[#F5F5F5]/28">
                  Tipo:{" "}
                  <span className="font-semibold" style={{ color: runType.color }}>
                    {runType.label}
                  </span>
                </p>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="mobile-tap inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#B6FF00] px-5 text-sm font-bold text-[#080808] shadow-[0_0_24px_rgba(182,255,0,0.16)] transition-transform duration-100 hover:-translate-y-px hover:shadow-[0_0_32px_rgba(182,255,0,0.24)] active:scale-[0.97] active:translate-y-0 disabled:pointer-events-none disabled:opacity-55"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  {isSaving ? "Salvando..." : "Salvar corrida"}
                </button>
              </div>

              {/* Feedback */}
              {message ? (
                <div className="mx-4 mb-4 sm:mx-6 sm:mb-5">
                  <div
                    className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                      status === "success"
                        ? "border-[#B6FF00]/18 bg-[#B6FF00]/[0.07] text-[#B6FF00]/85"
                        : "border-red-500/20 bg-red-500/[0.07] text-red-300/90"
                    }`}
                  >
                    {message}
                  </div>
                </div>
              ) : null}
              {progressUpdates.length > 0 ? (
                <div className="mx-4 mb-4 sm:mx-6 sm:mb-5">
                  <ProgressPulse updates={progressUpdates} />
                </div>
              ) : null}
              {xpFeedback && xpFeedback.gainedXp > 0 ? (
                <div className="mx-4 mb-4 sm:mx-6 sm:mb-5">
                  <XPToast feedback={xpFeedback} />
                </div>
              ) : null}
            </form>

            {/* ── Preview ─────────────────────────────────────────────── */}
            <aside className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
              <div className="relative border-b border-white/[0.05] px-4 py-3 sm:px-5 sm:py-4">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">Preview</p>
                <h2 className="font-display text-base font-semibold">Sessão atual</h2>
              </div>
              <div className="space-y-2 p-4 sm:p-5">
                <PreviewRow label="Tipo" value={form.run_type ? runType.label : "—"} color={runType.color} />
                <PreviewRow label="Distância" value={form.distance ? `${form.distance} km` : "—"} />
                <PreviewRow label="Duração" value={form.duration || "—"} />
                <PreviewRow label="Pace" value={form.pace ? `${form.pace}/km` : "—"} badge={paceIsAuto ? "AUTO" : undefined} />
                {form.notes ? (
                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#F5F5F5]/32">Obs.</p>
                    <p className="mt-1 text-xs text-[#F5F5F5]/60">{form.notes}</p>
                  </div>
                ) : null}
              </div>

              {/* Run CTA */}
              <div className="mx-4 mb-4 sm:mx-5 sm:mb-5">
                {showTracker ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-[#B6FF00]/25 bg-[#B6FF00]/[0.07] px-4 py-4 shadow-[0_0_20px_rgba(182,255,0,0.1)]">
                    <div className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-[#B6FF00]/12">
                      <span className="absolute inset-0 animate-ping rounded-xl bg-[#B6FF00]/20" />
                      <span className="size-2.5 rounded-full bg-[#B6FF00] shadow-[0_0_8px_#B6FF00]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#B6FF00]">Correndo agora</p>
                      <p className="mt-0.5 text-[10px] text-[#F5F5F5]/40">Rastreamento ativo</p>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowTracker(true)}
                    className="mobile-tap group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-[#B6FF00]/18 bg-[#B6FF00]/[0.06] px-4 py-4 text-left transition-transform duration-100 hover:border-[#B6FF00]/30 hover:bg-[#B6FF00]/[0.1] hover:shadow-[0_0_24px_rgba(182,255,0,0.1)] active:scale-[0.98] active:opacity-80"
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#B6FF00]/8 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                    <div className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-[#B6FF00]/12">
                      <Play className="size-4 fill-[#B6FF00] stroke-none" />
                    </div>
                    <div className="relative min-w-0">
                      <p className="text-xs font-bold text-[#B6FF00]/90">Iniciar corrida</p>
                      <p className="mt-0.5 text-[10px] text-[#F5F5F5]/35">GPS em tempo real · rota + pace</p>
                    </div>
                    <ChevronRight className="relative ml-auto size-4 shrink-0 text-[#B6FF00]/35 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                )}
              </div>
            </aside>
          </section>

          {/* ── Saved runs ──────────────────────────────────────────────── */}
          <SavedRunsSection
            runs={runs}
            status={runsStatus}
            deletingId={deletingId}
            deleteLoading={deleteLoading}
            onRefresh={() => void loadRuns()}
            onDeleteRequest={(id) => setDeletingId(id)}
            onDeleteCancel={() => setDeletingId(null)}
            onDeleteConfirm={handleDelete}
            onEdit={(run) => setEditingRun(run)}
          />
        </div>
      </AppShell>
    </>
  );
}

// ─── Form components ──────────────────────────────────────────────────────────

function RunInput({
  icon: Icon,
  label,
  placeholder,
  suffix,
  type = "text",
  value,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  placeholder: string;
  suffix: string;
  type?: "number" | "text";
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#F5F5F5]/50">
          <Icon className="size-3.5 text-[#B6FF00]/70" strokeWidth={2} />
          {label}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#B6FF00]/55">{suffix}</span>
      </div>
      <input
        required
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        inputMode={type === "number" ? "decimal" : "text"}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 text-lg font-semibold text-[#F5F5F5] outline-none transition-all duration-200 placeholder:text-[#F5F5F5]/16 focus:border-[#B6FF00]/35 focus:bg-white/[0.05] focus:shadow-[0_0_0_3px_rgba(182,255,0,0.05)]"
      />
    </label>
  );
}

function PreviewRow({
  label,
  value,
  color,
  badge,
}: {
  label: string;
  value: string;
  color?: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#F5F5F5]/32">{label}</span>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="rounded-full bg-[#B6FF00]/12 px-1.5 py-0.5 text-[9px] font-bold text-[#B6FF00]/70">
            {badge}
          </span>
        )}
        <span
          className="text-sm font-semibold"
          style={{ color: color ?? (value === "—" ? "rgba(245,245,245,0.25)" : "rgba(245,245,245,0.82)") }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

// ─── Saved runs section ───────────────────────────────────────────────────────

function SavedRunsSection({
  runs,
  status,
  deletingId,
  deleteLoading,
  onRefresh,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
  onEdit,
}: {
  runs: Run[];
  status: RunsStatus;
  deletingId: string | null;
  deleteLoading: boolean;
  onRefresh: () => void;
  onDeleteRequest: (id: string) => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: (id: string) => void;
  onEdit: (run: Run) => void;
}) {
  const isLoading = status === "loading";

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3 sm:px-5 sm:py-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">Histórico</p>
          <h2 className="font-display text-base font-semibold">Corridas salvas</h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 text-xs font-semibold text-[#F5F5F5]/50 transition-all hover:bg-white/[0.05] hover:text-[#F5F5F5]/72 disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      <div className="p-4 sm:p-5">
        {status === "error" && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm font-medium text-red-300/90">
            Não foi possível carregar as corridas.
          </div>
        )}
        {status === "ready" && runs.length === 0 && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 grid size-10 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-[#F5F5F5]/22">
              <Route className="size-5" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-[#F5F5F5]/35">Nenhuma corrida salva ainda</p>
            <p className="mt-1 text-xs text-[#F5F5F5]/20">Use o GPS ou o formulário acima para registrar</p>
          </div>
        )}
        {isLoading && runs.length === 0 && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02]" />
            ))}
          </div>
        )}
        {runs.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {runs.map((run) => (
              <RunCard
                key={run.id}
                run={run}
                isDeleting={deletingId === run.id}
                deleteLoading={deleteLoading}
                onDeleteRequest={() => onDeleteRequest(run.id)}
                onDeleteCancel={onDeleteCancel}
                onDeleteConfirm={() => onDeleteConfirm(run.id)}
                onEdit={() => onEdit(run)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Run card (premium) ───────────────────────────────────────────────────────

function RunCard({
  run,
  isDeleting,
  deleteLoading,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
  onEdit,
}: {
  run: Run;
  isDeleting: boolean;
  deleteLoading: boolean;
  onDeleteRequest: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
  onEdit: () => void;
}) {
  const rt = getRunType(run.run_type);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasGps = run.avg_speed !== null || run.calories !== null;

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  if (isDeleting) {
    return (
      <article className="relative overflow-hidden rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-4">
        <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
          <div className="grid size-10 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
            <AlertTriangle className="size-5" strokeWidth={1.8} />
          </div>
          <p className="text-sm font-semibold text-[#F5F5F5]/80">Excluir esta corrida?</p>
          <p className="text-xs text-[#F5F5F5]/38">{run.distance} km · {formatRunDate(run.created_at)}</p>
          <div className="flex w-full gap-2">
            <button
              type="button"
              onClick={onDeleteCancel}
              disabled={deleteLoading}
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 text-xs font-semibold text-[#F5F5F5]/60 transition hover:bg-white/[0.07] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onDeleteConfirm}
              disabled={deleteLoading}
              className="flex-1 rounded-xl bg-red-500/80 py-2 text-xs font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {deleteLoading ? <Loader2 className="mx-auto size-3.5 animate-spin" /> : "Excluir"}
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#151515] p-4 transition-all duration-300 hover:border-white/[0.1] hover:bg-[#181818] hover:shadow-[0_8px_28px_rgba(0,0,0,0.4)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      {/* GPS badge */}
      {hasGps && (
        <div
          className="absolute right-3 top-3 flex items-center gap-1 rounded-full border px-1.5 py-0.5"
          style={{ borderColor: `${rt.color}22`, background: `${rt.color}0A` }}
        >
          <MapPin className="size-2.5" style={{ color: rt.color }} strokeWidth={2} />
          <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: `${rt.color}cc` }}>
            GPS
          </span>
        </div>
      )}

      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="grid size-9 shrink-0 place-items-center rounded-lg border transition-all duration-200"
            style={{ borderColor: `${rt.color}22`, background: `${rt.color}10`, color: rt.color }}
          >
            <rt.icon className="size-4" strokeWidth={2} />
          </div>
          <span
            className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ borderColor: `${rt.color}22`, color: `${rt.color}cc`, background: `${rt.color}0A` }}
          >
            {rt.label}
          </span>
        </div>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="grid size-7 place-items-center rounded-lg text-[#F5F5F5]/28 transition-all hover:bg-white/[0.06] hover:text-[#F5F5F5]/60"
          >
            <MoreVertical className="size-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 min-w-32 overflow-hidden rounded-xl border border-white/[0.1] bg-[#1A1A1A] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onEdit(); }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-[#F5F5F5]/65 transition hover:bg-white/[0.06] hover:text-[#F5F5F5]/90"
              >
                <Pencil className="size-3.5 text-[#B6FF00]/60" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onDeleteRequest(); }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-red-400/70 transition hover:bg-red-500/[0.08] hover:text-red-400"
              >
                <Trash2 className="size-3.5" />
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Distance — primary metric */}
      <div className="mb-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#F5F5F5]/32">Distância</p>
        <p className="font-display mt-1 text-2xl font-bold tracking-tight">
          {run.distance}
          <span className="ml-1 text-sm font-bold text-[#B6FF00]">km</span>
        </p>
      </div>

      {/* Stats */}
      <div className="space-y-1.5">
        <RunStat icon={Gauge} label="Pace" value={`${run.pace}/km`} />
        <RunStat icon={Clock} label="Duração" value={run.duration} />
        {run.avg_speed !== null && (
          <RunStat icon={Activity} label="Velocidade" value={`${run.avg_speed} km/h`} accent="#A78BFA" />
        )}
        {run.calories !== null && (
          <RunStat icon={Flame} label="Calorias" value={`${run.calories} kcal`} accent="#FB923C" />
        )}
        <RunStat icon={CalendarDays} label="Data" value={formatRunDate(run.created_at)} />
      </div>

      {run.notes && (
        <div className="mt-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#F5F5F5]/25">Obs.</p>
          <p className="mt-0.5 text-xs text-[#F5F5F5]/50 line-clamp-2">{run.notes}</p>
        </div>
      )}
    </article>
  );
}

function RunStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
      <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#F5F5F5]/30">
        <Icon
          className="size-3"
          style={{ color: accent ? `${accent}99` : "rgba(182,255,0,0.6)" }}
          strokeWidth={2}
        />
        {label}
      </span>
      <span className="font-mono text-xs font-semibold text-[#F5F5F5]/75">{value}</span>
    </div>
  );
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

function EditRunModal({
  run,
  onClose,
  onSave,
}: {
  run: Run;
  onClose: () => void;
  onSave: (id: string, form: FormState) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>({
    distance: String(run.distance),
    duration: run.duration,
    pace: run.pace,
    run_type: run.run_type ?? "leve",
    notes: run.notes ?? "",
  });
  const [paceIsAuto, setPaceIsAuto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const rt = getRunType(form.run_type);

  useEffect(() => {
    const dist = Number(form.distance);
    if (!form.distance || !form.duration || dist <= 0) return;
    const computed = computePace(dist, form.duration);
    if (computed && computed !== form.pace) {
      const id = window.setTimeout(() => {
        setForm((cur) => ({ ...cur, pace: computed }));
        setPaceIsAuto(true);
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [form.distance, form.duration, form.pace]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(run.id, form);
    } catch {
      setError("Não foi possível salvar as alterações.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111111] shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative border-b border-white/[0.05] px-6 py-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B6FF00]/25 to-transparent" />
          <h2 className="font-display text-base font-semibold">Editar corrida</h2>
          <p className="mt-1 text-xs text-[#F5F5F5]/38">{formatRunDate(run.created_at)}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 p-6">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/30">Tipo</p>
            <div className="flex flex-wrap gap-2">
              {RUN_TYPES.map((t) => {
                const Icon = t.icon;
                const active = form.run_type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm((cur) => ({ ...cur, run_type: t.value }))}
                    className="flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all"
                    style={
                      active
                        ? { borderColor: `${t.color}55`, background: `${t.color}14`, color: t.color }
                        : { borderColor: "rgba(245,245,245,0.07)", background: "rgba(245,245,245,0.03)", color: "rgba(245,245,245,0.4)" }
                    }
                  >
                    <Icon className="size-3" strokeWidth={2} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <RunInput icon={MapPin} label="Distância" placeholder="8.5" suffix="km" type="number" value={form.distance} onChange={(v) => setForm((cur) => ({ ...cur, distance: v }))} />
            <RunInput icon={Clock} label="Duração" placeholder="45:00" suffix="min" value={form.duration} onChange={(v) => setForm((cur) => ({ ...cur, duration: v }))} />
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs font-semibold text-[#F5F5F5]/50">
                  <Gauge className="size-3 text-[#B6FF00]/70" strokeWidth={2} /> Pace
                </span>
                {paceIsAuto && <span className="rounded-full bg-[#B6FF00]/12 px-1.5 py-0.5 text-[9px] font-bold text-[#B6FF00]/70">AUTO</span>}
              </div>
              <input
                required
                type="text"
                value={form.pace}
                onChange={(e) => { setPaceIsAuto(false); setForm((cur) => ({ ...cur, pace: e.target.value })); }}
                placeholder="5:18"
                className="h-12 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 text-base font-semibold text-[#F5F5F5] outline-none transition-all focus:border-[#B6FF00]/35 focus:bg-white/[0.05]"
              />
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#F5F5F5]/38">
              Observação <span className="font-normal text-[#F5F5F5]/25">(opcional)</span>
            </span>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((cur) => ({ ...cur, notes: e.target.value }))}
              placeholder="Como foi o treino?"
              className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-[#F5F5F5] outline-none transition-all focus:border-[#B6FF00]/28 focus:bg-white/[0.05]"
            />
          </label>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm font-medium text-red-300/90">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 text-sm font-semibold text-[#F5F5F5]/55 transition hover:bg-white/[0.07]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-[#080808] transition disabled:opacity-55"
              style={{ background: rt.color }}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Feedback components ──────────────────────────────────────────────────────

function ProgressPulse({ updates }: { updates: ProgressUpdate[] }) {
  const accent = "#B6FF00";
  return (
    <div
      className="relative overflow-hidden rounded-2xl border px-4 py-3 animate-in fade-in slide-in-from-bottom-2 duration-500"
      style={{ borderColor: `${accent}24`, background: `${accent}0A`, boxShadow: `0 0 28px ${accent}12` }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}70, transparent)` }} />
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: `${accent}18`, color: accent }}>
          <Trophy className="size-4" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>Progresso competitivo</p>
          <div className="mt-2 grid gap-2">
            {updates.map((u) => (
              <div key={u.competitionId} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                <span className="truncate text-xs font-semibold text-[#F5F5F5]/70">{u.title}</span>
                <span className="shrink-0 text-xs font-bold tabular-nums" style={{ color: accent }}>+{u.delta} {u.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function XPToast({ feedback }: { feedback: XPFeedback }) {
  const accent = "#B6FF00";
  return (
    <div
      className="relative overflow-hidden rounded-2xl border px-4 py-3 animate-in fade-in zoom-in-95 duration-500"
      style={{
        borderColor: feedback.leveledUp ? `${accent}55` : `${accent}24`,
        background: feedback.leveledUp ? `${accent}12` : `${accent}08`,
        boxShadow: `0 0 34px ${accent}${feedback.leveledUp ? "24" : "12"}`,
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>
            {feedback.leveledUp ? "Level up" : "XP ganho"}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#F5F5F5]/78">+{feedback.gainedXp} XP · Nível {feedback.currentLevel}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-bold tabular-nums" style={{ color: accent }}>{feedback.totalXp}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#F5F5F5]/30">total xp</p>
        </div>
      </div>
      <div className="mt-3 h-[4px] overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${feedback.levelProgress}%`, background: accent, boxShadow: `0 0 10px ${accent}66` }}
        />
      </div>
    </div>
  );
}
