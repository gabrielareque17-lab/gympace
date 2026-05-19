"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Loader2,
  MoreVertical,
  Pencil,
  RefreshCw,
  Trash2,
  Trophy,
} from "lucide-react";
import { MuscleIllustration } from "@/components/academia/muscle-illustration";

import { AppShell } from "@/components/ui/layout/app-shell";
import { PageHeader, SectionCard } from "@/components/ui/page-layout";
import { LevelUpOverlay } from "@/components/xp/level-up-overlay";
import { useProfile } from "@/hooks/use-profile";
import { formatShortDate as formatDate } from "@/lib/date-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Workout = {
  id: string;
  title: string;
  muscle_group: string;
  duration_minutes: number;
  intensity: string | null;
  notes: string | null;
  created_at: string;
};

type FormState = {
  title: string;
  muscle_groups: string[];
  duration_minutes: string;
  intensity: string;
  notes: string;
};

type SaveStatus = "idle" | "saving" | "success" | "error";
type WorkoutsStatus = "loading" | "ready" | "error";

type ProgressUpdate = {
  competitionId: string;
  title: string;
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

const MUSCLE_GROUPS = [
  { value: "peito",     name: "Peito",    color: "#60A5FA" },
  { value: "costas",    name: "Costas",   color: "#A78BFA" },
  { value: "pernas",    name: "Pernas",   color: "#B6FF00" },
  { value: "ombros",    name: "Ombros",   color: "#FB923C" },
  { value: "bracos",    name: "Braços",   color: "#F472B6" },
  { value: "abdomen",   name: "Abdômen",  color: "#22D3EE" },
  { value: "full-body", name: "Full Body", color: "#B6FF00" },
] as const;

const INTENSITIES = [
  { value: "leve", label: "Leve", color: "#22D3EE" },
  { value: "moderado", label: "Moderado", color: "#B6FF00" },
  { value: "intenso", label: "Intenso", color: "#FB923C" },
] as const;

const initialForm: FormState = {
  title: "",
  muscle_groups: ["full-body"],
  duration_minutes: "",
  intensity: "",
  notes: "",
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function getMuscleGroup(value: string) {
  return MUSCLE_GROUPS.find((g) => g.value === value) ?? MUSCLE_GROUPS[MUSCLE_GROUPS.length - 1];
}

function getPrimaryGroup(groups: string[]) {
  return getMuscleGroup(groups[0] ?? "full-body");
}

function toggleMuscleGroup(cur: FormState, value: string): FormState {
  const has = cur.muscle_groups.includes(value);
  if (has && cur.muscle_groups.length === 1) return cur;
  return {
    ...cur,
    muscle_groups: has
      ? cur.muscle_groups.filter((g) => g !== value)
      : [...cur.muscle_groups, value],
  };
}

function getIntensity(value: string | null) {
  return INTENSITIES.find((i) => i.value === value) ?? null;
}


// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchWorkouts(): Promise<Workout[]> {
  const res = await fetch("/api/workouts");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return res.status === 401 ? [] : Promise.reject(data.error ?? "Erro");
  return data.workouts ?? [];
}

async function saveWorkoutApi(form: FormState) {
  const res = await fetch("/api/workouts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: form.title,
      muscle_group: form.muscle_groups[0] ?? "full-body",
      muscle_groups: form.muscle_groups,
      duration_minutes: Number(form.duration_minutes),
      intensity: form.intensity || null,
      notes: form.notes || null,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Não foi possível salvar o treino.");
  return data as { progressUpdates: ProgressUpdate[]; xpFeedback: XPFeedback | null };
}

async function deleteWorkoutApi(id: string) {
  const res = await fetch(`/api/workouts/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Não foi possível excluir.");
  return data as { progressUpdates: ProgressUpdate[]; xpFeedback: XPFeedback | null };
}

async function editWorkoutApi(id: string, updates: Partial<FormState>) {
  const body: Record<string, unknown> = {};
  if (updates.title !== undefined) body.title = updates.title;
  if (updates.muscle_groups !== undefined && updates.muscle_groups.length > 0) {
    body.muscle_group = updates.muscle_groups[0];
    body.muscle_groups = updates.muscle_groups;
  }
  if (updates.duration_minutes !== undefined) body.duration_minutes = Number(updates.duration_minutes);
  body.intensity = updates.intensity || null;
  body.notes = updates.notes || null;

  const res = await fetch(`/api/workouts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Não foi possível editar.");
  return data as { progressUpdates: ProgressUpdate[]; xpFeedback: XPFeedback | null };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AcademiaPage() {
  const { refetch: refetchProfile } = useProfile();
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [workoutsStatus, setWorkoutsStatus] = useState<WorkoutsStatus>("loading");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [message, setMessage] = useState("");
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [xpFeedback, setXpFeedback] = useState<XPFeedback | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedGroup = getPrimaryGroup(form.muscle_groups);
  const isSaving = status === "saving";

  const loadWorkouts = useCallback(async () => {
    setWorkoutsStatus("loading");
    try {
      setWorkouts(await fetchWorkouts());
      setWorkoutsStatus("ready");
    } catch {
      setWorkoutsStatus("error");
    }
  }, []);

  useEffect(() => {
    let alive = true;
    fetchWorkouts()
      .then((w) => { if (alive) { setWorkouts(w); setWorkoutsStatus("ready"); } })
      .catch(() => { if (alive) setWorkoutsStatus("error"); });
    return () => { alive = false; };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setMessage("");
    setProgressUpdates([]);
    setXpFeedback(null);
    try {
      const { progressUpdates: upd, xpFeedback: xp } = await saveWorkoutApi(form);
      setForm(initialForm);
      setStatus("success");
      setMessage(upd.length > 0 ? "Treino salvo e leaderboard atualizado." : "Treino salvo com sucesso.");
      setProgressUpdates(upd);
      setXpFeedback(xp);
      if (xp?.leveledUp) setShowLevelUp(true);
      refetchProfile();
      await loadWorkouts();
    } catch {
      setStatus("error");
      setMessage("Não foi possível salvar o treino.");
    }
  }

  async function handleDelete(id: string) {
    setDeleteLoading(true);
    try {
      const { xpFeedback: xp } = await deleteWorkoutApi(id);
      setDeletingId(null);
      setXpFeedback(xp);
      if (xp?.leveledUp) setShowLevelUp(true);
      refetchProfile();
      await loadWorkouts();
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleEditSave(id: string, updates: FormState) {
    const { xpFeedback: xp } = await editWorkoutApi(id, updates);
    setEditingWorkout(null);
    setXpFeedback(xp);
    if (xp?.leveledUp) setShowLevelUp(true);
    refetchProfile();
    await loadWorkouts();
  }

  return (
    <>
      {showLevelUp && xpFeedback && (
        <LevelUpOverlay
          level={xpFeedback.currentLevel}
          rank={xpFeedback.rank}
          totalXp={xpFeedback.totalXp}
          levelProgress={xpFeedback.levelProgress}
          onClose={() => setShowLevelUp(false)}
        />
      )}
      {editingWorkout && (
        <EditWorkoutModal
          workout={editingWorkout}
          onClose={() => setEditingWorkout(null)}
          onSave={handleEditSave}
        />
      )}
      <AppShell>
        <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <PageHeader
            eyebrow="Musculação"
            title="Academia"
            description="Registre sessões de força e atualize automaticamente competições de academia, streak e híbridas."
          />

          {/* Muscle group selector */}
          <section aria-label="Grupos musculares" className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F5F5F5]/28">
                Grupos musculares
              </p>
              {form.muscle_groups.length > 1 && (
                <span className="text-[10px] font-semibold text-[#F5F5F5]/30">
                  {form.muscle_groups.length} selecionados
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 xl:grid-cols-7">
              {MUSCLE_GROUPS.map((group) => (
                <MuscleCard
                  key={group.value}
                  value={group.value}
                  name={group.name}
                  color={group.color}
                  active={form.muscle_groups.includes(group.value)}
                  onSelect={() => setForm((cur) => toggleMuscleGroup(cur, group.value))}
                />
              ))}
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[1fr_0.52fr]">
            <form
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]"
            >
              {/* Header */}
              <div className="relative border-b border-white/[0.05] px-4 py-4 sm:px-6 sm:py-5">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-base font-semibold">Registrar treino</h2>
                    <p className="mt-1 text-sm text-[#F5F5F5]/38">
                      Cada sessão recalcula suas competições ativas.
                    </p>
                  </div>
                  <div
                    className="grid size-9 place-items-center rounded-xl overflow-hidden"
                    style={{ background: `${selectedGroup.color}18`, border: `1px solid ${selectedGroup.color}35`, boxShadow: `0 0 20px ${selectedGroup.color}20` }}
                  >
                    <div className="size-8 p-1">
                      <MuscleIllustration group={selectedGroup.value} color={selectedGroup.color} active />
                    </div>
                  </div>
                </div>
              </div>

              {/* Main fields */}
              <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[1fr_160px]">
                <label className="block">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#F5F5F5]/50">
                    <Dumbbell className="size-3.5" style={{ color: selectedGroup.color }} strokeWidth={2} />
                    Nome do treino
                  </div>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((cur) => ({ ...cur, title: e.target.value }))}
                    placeholder="Ex: Força total, Hipertrofia..."
                    className="h-12 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 text-base font-semibold text-[#F5F5F5] outline-none transition-all placeholder:text-[#F5F5F5]/16 focus:bg-white/[0.05]"
                    style={{
                      "--tw-ring-color": selectedGroup.color,
                    } as React.CSSProperties}
                    onFocus={(e) => { e.target.style.borderColor = `${selectedGroup.color}50`; e.target.style.boxShadow = `0 0 0 3px ${selectedGroup.color}10`; }}
                    onBlur={(e) => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
                  />
                </label>

                <label className="block">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#F5F5F5]/50">
                      <Clock className="size-3.5" style={{ color: selectedGroup.color }} strokeWidth={2} />
                      Duração
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${selectedGroup.color}99` }}>
                      min
                    </span>
                  </div>
                  <input
                    required
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={form.duration_minutes}
                    onChange={(e) => setForm((cur) => ({ ...cur, duration_minutes: e.target.value }))}
                    placeholder="60"
                    className="h-12 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 text-lg font-semibold text-[#F5F5F5] outline-none transition-all placeholder:text-[#F5F5F5]/16 focus:bg-white/[0.05]"
                    onFocus={(e) => { e.target.style.borderColor = `${selectedGroup.color}50`; e.target.style.boxShadow = `0 0 0 3px ${selectedGroup.color}10`; }}
                    onBlur={(e) => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
                  />
                </label>
              </div>

              {/* Intensity */}
              <div className="border-t border-white/[0.05] px-4 py-4 sm:px-6">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/30">
                  Intensidade <span className="font-normal text-[#F5F5F5]/20">(opcional)</span>
                </p>
                <div className="flex gap-2">
                  {INTENSITIES.map((int) => (
                    <button
                      key={int.value}
                      type="button"
                      onClick={() =>
                        setForm((cur) => ({
                          ...cur,
                          intensity: cur.intensity === int.value ? "" : int.value,
                        }))
                      }
                      className="rounded-xl border px-4 py-2 text-xs font-semibold transition-all duration-200"
                      style={
                        form.intensity === int.value
                          ? { borderColor: `${int.color}55`, background: `${int.color}14`, color: int.color }
                          : { borderColor: "rgba(245,245,245,0.07)", background: "rgba(245,245,245,0.03)", color: "rgba(245,245,245,0.4)" }
                      }
                    >
                      {int.label}
                    </button>
                  ))}
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
                    className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm font-medium text-[#F5F5F5] outline-none transition-all placeholder:text-[#F5F5F5]/16 focus:border-[#60A5FA]/28 focus:bg-white/[0.05]"
                  />
                </label>
              </div>

              {/* Footer */}
              <div className="flex flex-col gap-3 border-t border-white/[0.05] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex flex-wrap items-center gap-1.5">
                  {form.muscle_groups.map((v) => {
                    const g = getMuscleGroup(v);
                    return (
                      <span
                        key={v}
                        className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                        style={{ borderColor: `${g.color}35`, color: g.color, background: `${g.color}0E` }}
                      >
                        {g.name}
                      </span>
                    );
                  })}
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-[#080808] transition-all duration-200 hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-55"
                  style={{ background: selectedGroup.color, boxShadow: `0 0 24px ${selectedGroup.color}28` }}
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  {isSaving ? "Salvando..." : "Salvar treino"}
                </button>
              </div>

              {/* Feedback */}
              {message ? (
                <div className="mx-4 mb-4 sm:mx-6 sm:mb-5">
                  <div
                    className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                      status === "success"
                        ? "border-[#60A5FA]/18 bg-[#60A5FA]/[0.07] text-[#BFDBFE]"
                        : "border-red-500/20 bg-red-500/[0.07] text-red-300/90"
                    }`}
                  >
                    {message}
                  </div>
                </div>
              ) : null}
              {progressUpdates.length > 0 && (
                <div className="mx-4 mb-4 sm:mx-6 sm:mb-5">
                  <ProgressPulse updates={progressUpdates} />
                </div>
              )}
              {xpFeedback && xpFeedback.gainedXp > 0 && (
                <div className="mx-4 mb-4 sm:mx-6 sm:mb-5">
                  <XPToast feedback={xpFeedback} />
                </div>
              )}
            </form>

            <SectionCard label="Leaderboard" title="Atualização automática">
              <div className="space-y-3 p-5">
                <AutoRule label="Academia" value="+1 sessão" color="#60A5FA" />
                <AutoRule label="Streak" value="sequência de dias" color="#B6FF00" />
                <AutoRule label="Híbrido" value="pontos combinados" color="#A78BFA" />
              </div>
            </SectionCard>
          </div>

          {/* Saved workouts */}
          <SavedWorkoutsSection
            workouts={workouts}
            status={workoutsStatus}
            deletingId={deletingId}
            deleteLoading={deleteLoading}
            onRefresh={() => void loadWorkouts()}
            onDeleteRequest={(id) => setDeletingId(id)}
            onDeleteCancel={() => setDeletingId(null)}
            onDeleteConfirm={handleDelete}
            onEdit={(w) => setEditingWorkout(w)}
          />
        </div>
      </AppShell>
    </>
  );
}

// ─── Muscle card ──────────────────────────────────────────────────────────────

function MuscleCard({
  value,
  name,
  color,
  active,
  onSelect,
}: {
  value: string;
  name: string;
  color: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative flex flex-col items-center overflow-hidden rounded-2xl border bg-[#111111] pb-3 pt-3 text-center transition-all duration-300 hover:-translate-y-0.5"
      style={
        active
          ? { borderColor: `${color}45`, boxShadow: `0 0 20px ${color}18, 0 4px 16px ${color}0A` }
          : { borderColor: "rgba(255,255,255,0.06)" }
      }
    >
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-px transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}${active ? "70" : "20"}, transparent)`,
        }}
      />

      {/* Radial glow behind illustration */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at 50% 45%, ${color}${active ? "14" : "06"} 0%, transparent 70%)`,
        }}
      />

      {/* Illustration */}
      <div className="relative z-10 mb-2 h-16 w-full px-3">
        <MuscleIllustration group={value} color={color} active={active} />
      </div>

      {/* Name */}
      <p
        className="relative z-10 text-[11px] font-bold leading-tight tracking-[0.02em] transition-colors duration-200"
        style={{ color: active ? color : "rgba(245,245,245,0.45)" }}
      >
        {name}
      </p>

      {/* Bottom progress bar */}
      <div className="absolute bottom-0 inset-x-0 h-[2px] overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: active ? "100%" : "0%",
            background: `linear-gradient(90deg, transparent, ${color}CC, transparent)`,
          }}
        />
      </div>
    </button>
  );
}

function AutoRule({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <span className="text-xs font-semibold text-[#F5F5F5]/45">{label}</span>
      <span className="text-xs font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Saved workouts ───────────────────────────────────────────────────────────

function SavedWorkoutsSection({
  workouts,
  status,
  deletingId,
  deleteLoading,
  onRefresh,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
  onEdit,
}: {
  workouts: Workout[];
  status: WorkoutsStatus;
  deletingId: string | null;
  deleteLoading: boolean;
  onRefresh: () => void;
  onDeleteRequest: (id: string) => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: (id: string) => void;
  onEdit: (w: Workout) => void;
}) {
  const isLoading = status === "loading";

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3 sm:px-5 sm:py-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#60A5FA]/70">Histórico</p>
          <h2 className="font-display text-base font-semibold">Treinos salvos</h2>
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
            Não foi possível carregar os treinos.
          </div>
        )}
        {status === "ready" && workouts.length === 0 && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 grid size-10 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-[#F5F5F5]/22">
              <Dumbbell className="size-5" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-[#F5F5F5]/35">Nenhum treino salvo ainda</p>
            <p className="mt-1 text-xs text-[#F5F5F5]/20">Registre uma sessão para movimentar suas competições.</p>
          </div>
        )}
        {isLoading && workouts.length === 0 && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02]" />
            ))}
          </div>
        )}
        {workouts.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {workouts.map((w) => (
              <WorkoutCard
                key={w.id}
                workout={w}
                isDeleting={deletingId === w.id}
                deleteLoading={deleteLoading}
                onDeleteRequest={() => onDeleteRequest(w.id)}
                onDeleteCancel={onDeleteCancel}
                onDeleteConfirm={() => onDeleteConfirm(w.id)}
                onEdit={() => onEdit(w)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Workout card ─────────────────────────────────────────────────────────────

function WorkoutCard({
  workout,
  isDeleting,
  deleteLoading,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
  onEdit,
}: {
  workout: Workout;
  isDeleting: boolean;
  deleteLoading: boolean;
  onDeleteRequest: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
  onEdit: () => void;
}) {
  const group = getMuscleGroup(workout.muscle_group);
  const intensity = getIntensity(workout.intensity);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  if (isDeleting) {
    return (
      <article className="relative overflow-hidden rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-4">
        <div className="flex flex-col items-center justify-center gap-3 py-2 text-center">
          <div className="grid size-10 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
            <AlertTriangle className="size-5" strokeWidth={1.8} />
          </div>
          <p className="text-sm font-semibold text-[#F5F5F5]/80">Excluir este treino?</p>
          <p className="text-xs text-[#F5F5F5]/38">{workout.title} · {formatDate(workout.created_at)}</p>
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
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#151515] p-4 transition-all duration-300 hover:border-white/[0.1] hover:bg-[#181818]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border p-0.5"
            style={{ borderColor: `${group.color}22`, background: `${group.color}10` }}
          >
            <MuscleIllustration group={workout.muscle_group} color={group.color} active />
          </div>
          <span
            className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ borderColor: `${group.color}22`, color: `${group.color}cc`, background: `${group.color}0A` }}
          >
            {group.name}
          </span>
        </div>

        {/* Action menu */}
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
                <Pencil className="size-3.5" style={{ color: group.color }} />
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

      <p className="font-display text-base font-bold text-[#F5F5F5]/82 leading-tight">{workout.title}</p>

      <div className="mt-3 space-y-1.5">
        <WorkoutStat icon={Clock} label="Duração" value={`${workout.duration_minutes} min`} color={group.color} />
        {intensity && (
          <WorkoutStat icon={Flame} label="Intensidade" value={intensity.label} color={intensity.color} />
        )}
        <WorkoutStat icon={CalendarDays} label="Data" value={formatDate(workout.created_at)} color={group.color} />
      </div>

      {workout.notes && (
        <div className="mt-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#F5F5F5]/25">Obs.</p>
          <p className="mt-0.5 text-xs text-[#F5F5F5]/50 line-clamp-2">{workout.notes}</p>
        </div>
      )}
    </article>
  );
}

function WorkoutStat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
      <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#F5F5F5]/30">
        <Icon className="size-3" style={{ color }} strokeWidth={2} />
        {label}
      </span>
      <span className="font-mono text-xs font-semibold text-[#F5F5F5]/75">{value}</span>
    </div>
  );
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

function EditWorkoutModal({
  workout,
  onClose,
  onSave,
}: {
  workout: Workout;
  onClose: () => void;
  onSave: (id: string, form: FormState) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>({
    title: workout.title,
    muscle_groups: [workout.muscle_group],
    duration_minutes: String(workout.duration_minutes),
    intensity: workout.intensity ?? "",
    notes: workout.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const group = getPrimaryGroup(form.muscle_groups);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(workout.id, form);
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
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#60A5FA]/20 to-transparent" />
          <h2 className="font-display text-base font-semibold">Editar treino</h2>
          <p className="mt-1 text-xs text-[#F5F5F5]/38">{formatDate(workout.created_at)}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 p-6">
          {/* Muscle group */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/30">Grupo muscular</p>
            <div className="grid grid-cols-4 gap-2">
              {MUSCLE_GROUPS.map((g) => {
                const active = form.muscle_groups[0] === g.value;
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setForm((cur) => ({ ...cur, muscle_groups: [g.value] }))}
                    className="relative flex flex-col items-center overflow-hidden rounded-xl border pb-2 pt-2 text-center transition-all duration-200"
                    style={
                      active
                        ? { borderColor: `${g.color}45`, background: `${g.color}0E`, boxShadow: `0 0 14px ${g.color}14` }
                        : { borderColor: "rgba(245,245,245,0.07)", background: "rgba(245,245,245,0.02)" }
                    }
                  >
                    <div className="h-10 w-full px-2">
                      <MuscleIllustration group={g.value} color={g.color} active={active} />
                    </div>
                    <span
                      className="mt-1 text-[9px] font-bold leading-tight"
                      style={{ color: active ? g.color : "rgba(245,245,245,0.35)" }}
                    >
                      {g.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_120px] gap-3">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-[#F5F5F5]/50">Nome do treino</span>
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => setForm((cur) => ({ ...cur, title: e.target.value }))}
                placeholder="Força total..."
                className="h-12 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 text-base font-semibold text-[#F5F5F5] outline-none transition-all focus:bg-white/[0.05]"
                onFocus={(e) => { e.target.style.borderColor = `${group.color}50`; }}
                onBlur={(e) => { e.target.style.borderColor = ""; }}
              />
            </label>
            <label className="block">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F5F5F5]/50">Duração</span>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${group.color}99` }}>min</span>
              </div>
              <input
                required
                type="number"
                min="1"
                value={form.duration_minutes}
                onChange={(e) => setForm((cur) => ({ ...cur, duration_minutes: e.target.value }))}
                placeholder="60"
                className="h-12 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 text-lg font-semibold text-[#F5F5F5] outline-none transition-all focus:bg-white/[0.05]"
                onFocus={(e) => { e.target.style.borderColor = `${group.color}50`; }}
                onBlur={(e) => { e.target.style.borderColor = ""; }}
              />
            </label>
          </div>

          {/* Intensity */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/30">
              Intensidade <span className="font-normal text-[#F5F5F5]/20">(opcional)</span>
            </p>
            <div className="flex gap-2">
              {INTENSITIES.map((int) => (
                <button
                  key={int.value}
                  type="button"
                  onClick={() => setForm((cur) => ({ ...cur, intensity: cur.intensity === int.value ? "" : int.value }))}
                  className="rounded-xl border px-4 py-2 text-xs font-semibold transition-all"
                  style={
                    form.intensity === int.value
                      ? { borderColor: `${int.color}55`, background: `${int.color}14`, color: int.color }
                      : { borderColor: "rgba(245,245,245,0.07)", background: "rgba(245,245,245,0.03)", color: "rgba(245,245,245,0.4)" }
                  }
                >
                  {int.label}
                </button>
              ))}
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
              className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-[#F5F5F5] outline-none transition-all focus:border-[#60A5FA]/28 focus:bg-white/[0.05]"
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
              style={{ background: group.color }}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" strokeWidth={2.5} />}
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
  const accent = "#60A5FA";
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
  const accent = "#60A5FA";
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
