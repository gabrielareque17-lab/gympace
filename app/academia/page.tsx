"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Loader2,
  Pause,
  Pencil,
  Play,
  Search,
  Sparkles,
  Square,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

import { MuscleIllustration } from "@/components/academia/muscle-illustration";
import { AppShell } from "@/components/ui/layout/app-shell";
import { LevelUpOverlay } from "@/components/xp/level-up-overlay";
import { useProfile } from "@/hooks/use-profile";
import { formatShortDate as formatDate } from "@/lib/date-utils";
import {
  getMuscleDetailLabel,
  getMuscleGroup,
  getMuscleGroupLabel,
  MUSCLE_CATEGORY_SECTIONS,
  MUSCLE_GROUPS,
  normalizeMuscleGroups,
  WORKOUT_SPLITS,
} from "@/lib/muscles";

type Workout = {
  id: string;
  title: string;
  muscle_group: string;
  muscle_groups: string[] | null;
  muscle_details: string[] | null;
  workout_split: string | null;
  duration_minutes: number;
  intensity: string | null;
  notes: string | null;
  created_at: string;
};

type FormState = {
  title: string;
  muscle_groups: string[];
  muscle_details: string[];
  workout_split: string;
  duration_minutes: string;
  intensity: string;
  notes: string;
  workout_date?: string;
  workout_time?: string;
};

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

const INTENSITIES = [
  { value: "leve", label: "Leve", color: "#22D3EE" },
  { value: "moderado", label: "Moderado", color: "#B6FF00" },
  { value: "intenso", label: "Intenso", color: "#FB923C" },
] as const;

const initialForm: FormState = {
  title: "",
  muscle_groups: ["full-body"],
  muscle_details: [],
  workout_split: "custom",
  duration_minutes: "",
  intensity: "",
  notes: "",
  workout_date: "",
  workout_time: "",
};

function primaryGroup(groups: string[]) {
  return getMuscleGroup(groups[0] ?? "full-body");
}

function visibleDetails(groups: string[]) {
  const active = new Set(normalizeMuscleGroups(groups));
  return MUSCLE_GROUPS.filter((group) => active.has(group.value)).flatMap((group) =>
    group.details.map((detail) => ({
      value: detail,
      label: getMuscleDetailLabel(detail),
      group: group.name,
      color: group.color,
    }))
  );
}

function formatTimer(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function toDateInputValue(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function combineDateAndTime(dateValue?: string, timeValue?: string) {
  if (!dateValue || !timeValue) return undefined;
  const date = new Date(`${dateValue}T${timeValue}:00`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

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
      muscle_details: form.muscle_details,
      workout_split: form.workout_split,
      duration_minutes: Number(form.duration_minutes),
      intensity: form.intensity || null,
      notes: form.notes || null,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Não foi possível salvar o treino.");
  return data as { progressUpdates: ProgressUpdate[]; xpFeedback: XPFeedback | null };
}

async function editWorkoutApi(id: string, form: FormState) {
  const createdAt = combineDateAndTime(form.workout_date, form.workout_time);
  const res = await fetch(`/api/workouts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: form.title,
      muscle_group: form.muscle_groups[0] ?? "full-body",
      muscle_groups: form.muscle_groups,
      muscle_details: form.muscle_details,
      workout_split: form.workout_split,
      duration_minutes: Number(form.duration_minutes),
      intensity: form.intensity || null,
      notes: form.notes || null,
      ...(createdAt ? { created_at: createdAt } : {}),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Não foi possível editar.");
  return data as { progressUpdates: ProgressUpdate[]; xpFeedback: XPFeedback | null };
}

async function deleteWorkoutApi(id: string) {
  const res = await fetch(`/api/workouts/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Não foi possível excluir.");
  return data as { progressUpdates: ProgressUpdate[]; xpFeedback: XPFeedback | null };
}

export default function AcademiaPage() {
  const { refetch: refetchProfile } = useProfile();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [xpFeedback, setXpFeedback] = useState<XPFeedback | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [workoutTimerOpen, setWorkoutTimerOpen] = useState(false);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);

  const selectedGroup = primaryGroup(form.muscle_groups);
  const detailOptions = visibleDetails(form.muscle_groups);
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MUSCLE_GROUPS;
    return MUSCLE_GROUPS.filter((group) =>
      `${group.name} ${group.details.map(getMuscleDetailLabel).join(" ")}`.toLowerCase().includes(q)
    );
  }, [query]);
  const groupedMuscles = MUSCLE_CATEGORY_SECTIONS.map((section) => ({
    ...section,
    groups: filteredGroups.filter((group) => group.category === section.key),
  })).filter((section) => section.groups.length > 0);

  const loadWorkouts = useCallback(async () => {
    setStatus("loading");
    try {
      setWorkouts(await fetchWorkouts());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    let alive = true;
    fetchWorkouts()
      .then((items) => {
        if (alive) {
          setWorkouts(items);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (alive) setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, []);

  function applySplit(split: (typeof WORKOUT_SPLITS)[number]) {
    const groups = [...split.groups];
    setForm((cur) => ({
      ...cur,
      title: cur.title || split.label,
      workout_split: split.value,
      muscle_groups: groups,
      muscle_details: cur.muscle_details.filter((detail) =>
        visibleDetails(groups).some((option) => option.value === detail)
      ),
    }));
  }

  function toggleGroup(value: string) {
    setForm((cur) => {
      const has = cur.muscle_groups.includes(value);
      const nextGroups = has
        ? cur.muscle_groups.filter((group) => group !== value)
        : [...cur.muscle_groups.filter((group) => group !== "full-body"), value];
      const safeGroups = nextGroups.length > 0 ? nextGroups : ["full-body"];
      const availableDetails = new Set(visibleDetails(safeGroups).map((detail) => detail.value));
      return {
        ...cur,
        workout_split: "custom",
        muscle_groups: safeGroups,
        muscle_details: cur.muscle_details.filter((detail) => availableDetails.has(detail)),
      };
    });
  }

  function toggleDetail(value: string) {
    setForm((cur) => ({
      ...cur,
      muscle_details: cur.muscle_details.includes(value)
        ? cur.muscle_details.filter((detail) => detail !== value)
        : [...cur.muscle_details, value],
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");
    setProgressUpdates([]);
    setXpFeedback(null);
    try {
      const { progressUpdates: updates, xpFeedback: xp } = await saveWorkoutApi(form);
      setForm(initialForm);
      setShowWorkoutForm(false);
      setMessage(updates.length > 0 ? "Treino salvo e progresso competitivo atualizado." : "Treino salvo com sucesso.");
      setProgressUpdates(updates);
      setXpFeedback(xp);
      if (xp?.leveledUp) setShowLevelUp(true);
      refetchProfile();
      await loadWorkouts();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Não foi possível salvar o treino.");
    } finally {
      setIsSaving(false);
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

  async function handleDelete(id: string) {
    setIsSaving(true);
    try {
      const { xpFeedback: xp } = await deleteWorkoutApi(id);
      setDeletingId(null);
      setXpFeedback(xp);
      if (xp?.leveledUp) setShowLevelUp(true);
      refetchProfile();
      await loadWorkouts();
    } finally {
      setIsSaving(false);
    }
  }

  function handleTimedWorkoutFinish(elapsedSeconds: number) {
    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    setWorkoutTimerOpen(false);
    setForm((cur) => ({
      ...cur,
      title: cur.title || "Treino cronometrado",
      duration_minutes: String(minutes),
    }));
    setShowWorkoutForm(true);
    setMessage("Cronômetro finalizado. Complete os dados do treino para salvar.");
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function openManualRegistration() {
    setShowWorkoutForm(true);
    setMessage("");
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <>
      {workoutTimerOpen && (
        <ActiveWorkoutTimer
          onCancel={() => setWorkoutTimerOpen(false)}
          onFinish={handleTimedWorkoutFinish}
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
      {editingWorkout && (
        <EditWorkoutModal
          workout={editingWorkout}
          onClose={() => setEditingWorkout(null)}
          onSave={handleEditSave}
        />
      )}
      <AppShell>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <header className="mb-6">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#22D3EE]/70">
              Musculação
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight">Registrar treino</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#F5F5F5]/40">
              Selecione grupos musculares, músculos específicos e divisões profissionais como Push, Pull e Legs.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setWorkoutTimerOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#22D3EE] px-4 py-3 text-sm font-bold text-[#061014] shadow-[0_0_24px_rgba(34,211,238,0.22)] transition active:scale-[0.97]"
              >
                <Play className="size-4 fill-current stroke-none" />
                Iniciar treino com cronômetro
              </button>
              <button
                type="button"
                onClick={openManualRegistration}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-[#F5F5F5]/55 transition hover:bg-white/[0.07]"
              >
                Registrar manualmente
              </button>
            </div>
          </header>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className={`${showWorkoutForm ? "block" : "hidden md:block"} overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]`}
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/[0.05] p-5">
                <div>
                  <h2 className="font-display text-base font-semibold">Sessão</h2>
                  <p className="mt-1 text-sm text-[#F5F5F5]/38">Registro inteligente para feed, XP, streaks e competições.</p>
                </div>
                <div className="grid size-12 place-items-center rounded-2xl" style={{ background: `${selectedGroup.color}16`, color: selectedGroup.color }}>
                  <MuscleIllustration group={selectedGroup.value} color={selectedGroup.color} active />
                </div>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-[1fr_150px]">
                <label>
                  <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#F5F5F5]/50">
                    <Dumbbell className="size-3.5" style={{ color: selectedGroup.color }} />
                    Nome do treino
                  </span>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm((cur) => ({ ...cur, title: e.target.value }))}
                    placeholder="Push, Pull, Legs, Upper..."
                    className="h-12 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 text-base font-semibold outline-none transition focus:border-[#B6FF00]/35"
                  />
                </label>
                <label>
                  <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#F5F5F5]/50">
                    <Clock className="size-3.5" style={{ color: selectedGroup.color }} />
                    Duração
                  </span>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.duration_minutes}
                    onChange={(e) => setForm((cur) => ({ ...cur, duration_minutes: e.target.value }))}
                    placeholder="60"
                    className="h-12 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 text-lg font-semibold outline-none transition focus:border-[#B6FF00]/35"
                  />
                </label>
              </div>

              <section className="border-t border-white/[0.05] p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/30">Sugestões rápidas</p>
                  <span className="text-[10px] text-[#F5F5F5]/25">{form.muscle_groups.length} grupos</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {WORKOUT_SPLITS.map((split) => (
                    <button
                      key={split.value}
                      type="button"
                      onClick={() => applySplit(split)}
                      className="shrink-0 rounded-xl border px-4 py-2 text-xs font-bold transition-all"
                      style={
                        form.workout_split === split.value
                          ? { borderColor: "#B6FF0055", background: "#B6FF0014", color: "#B6FF00" }
                          : { borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", color: "rgba(245,245,245,0.45)" }
                      }
                    >
                      {split.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="border-t border-white/[0.05] p-5">
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3">
                  <Search className="size-4 text-[#F5F5F5]/25" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar grupo ou músculo"
                    className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#F5F5F5]/20"
                  />
                </div>
                <div className="space-y-5">
                  {groupedMuscles.map((section) => (
                    <div key={section.key}>
                      <div className="mb-2 flex items-end justify-between gap-3">
                        <div>
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/45">
                            {section.label}
                          </h3>
                          <p className="mt-0.5 text-[11px] leading-4 text-[#F5F5F5]/25">{section.description}</p>
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold tabular-nums text-[#F5F5F5]/25">
                          {section.groups.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {section.groups.map((group) => {
                          const Icon = group.icon;
                          const active = form.muscle_groups.includes(group.value);
                          return (
                            <button
                              key={group.value}
                              type="button"
                              onClick={() => toggleGroup(group.value)}
                              className="group min-h-[118px] rounded-2xl border p-3 text-left transition-all active:scale-[0.98]"
                              style={
                                active
                                  ? { borderColor: `${group.color}55`, background: `${group.color}12`, boxShadow: `0 0 20px ${group.color}12` }
                                  : { borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)" }
                              }
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="grid size-8 place-items-center rounded-xl" style={{ background: `${group.color}14` }}>
                                    <Icon className="size-4" style={{ color: active ? group.color : "rgba(245,245,245,0.34)" }} />
                                  </div>
                                  <span className="text-sm font-bold" style={{ color: active ? group.color : "rgba(245,245,245,0.72)" }}>
                                    {group.name}
                                  </span>
                                </div>
                                {active && <CheckCircle2 className="size-4 shrink-0" style={{ color: group.color }} />}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {group.details.slice(0, 4).map((detail) => (
                                  <span
                                    key={detail}
                                    className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                                    style={{
                                      borderColor: active ? `${group.color}24` : "rgba(255,255,255,0.06)",
                                      background: active ? `${group.color}0A` : "rgba(255,255,255,0.02)",
                                      color: active ? `${group.color}CC` : "rgba(245,245,245,0.28)",
                                    }}
                                  >
                                    {getMuscleDetailLabel(detail)}
                                  </span>
                                ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="border-t border-white/[0.05] p-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/30">
                  Músculos específicos <span className="font-normal text-[#F5F5F5]/20">(opcional)</span>
                </p>
                {detailOptions.length === 0 ? (
                  <p className="text-sm text-[#F5F5F5]/30">Selecione um grupo para ver músculos específicos.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {detailOptions.map((detail) => {
                      const active = form.muscle_details.includes(detail.value);
                      return (
                        <button
                          key={detail.value}
                          type="button"
                          onClick={() => toggleDetail(detail.value)}
                          className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
                          style={
                            active
                              ? { borderColor: `${detail.color}55`, background: `${detail.color}14`, color: detail.color }
                              : { borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(245,245,245,0.42)" }
                          }
                        >
                          {detail.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="grid gap-4 border-t border-white/[0.05] p-5 md:grid-cols-[1fr_1.2fr]">
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/30">Intensidade</p>
                  <div className="flex gap-2">
                    {INTENSITIES.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setForm((cur) => ({ ...cur, intensity: cur.intensity === item.value ? "" : item.value }))}
                        className="rounded-xl border px-4 py-2 text-xs font-semibold transition-all"
                        style={
                          form.intensity === item.value
                            ? { borderColor: `${item.color}55`, background: `${item.color}14`, color: item.color }
                            : { borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", color: "rgba(245,245,245,0.4)" }
                        }
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label>
                  <span className="mb-2 block text-xs font-semibold text-[#F5F5F5]/38">Observação</span>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm((cur) => ({ ...cur, notes: e.target.value }))}
                    placeholder="Exercícios, carga, sensação..."
                    className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm outline-none transition focus:border-[#B6FF00]/30"
                  />
                </label>
              </section>

              <div className="flex flex-col gap-3 border-t border-white/[0.05] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {form.muscle_groups.map((group) => (
                    <span key={group} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-[#F5F5F5]/55">
                      {getMuscleGroupLabel(group)}
                    </span>
                  ))}
                </div>
                <button
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B6FF00] px-5 py-3 text-sm font-bold text-[#080808] transition active:scale-[0.98] disabled:opacity-55"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  Salvar treino
                </button>
              </div>
            </form>

            <aside className="space-y-4">
              {message && (
                <div className="rounded-2xl border border-[#B6FF00]/20 bg-[#B6FF00]/[0.07] px-4 py-3 text-sm font-semibold text-[#B6FF00]/85">
                  {message}
                </div>
              )}
              {progressUpdates.length > 0 && <ProgressPulse updates={progressUpdates} />}
              {xpFeedback && <XPToast feedback={xpFeedback} />}
              <RecentWorkouts
                workouts={workouts}
                status={status}
                deletingId={deletingId}
                isSaving={isSaving}
                onEdit={setEditingWorkout}
                onDeleteRequest={setDeletingId}
                onDeleteCancel={() => setDeletingId(null)}
                onDeleteConfirm={handleDelete}
              />
            </aside>
          </div>
        </main>
      </AppShell>
    </>
  );
}

function ActiveWorkoutTimer({
  onCancel,
  onFinish,
}: {
  onCancel: () => void;
  onFinish: (elapsedSeconds: number) => void;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [paused, setPaused] = useState(false);

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
    if (paused) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div className="fixed inset-0 z-50 flex h-dvh flex-col overflow-hidden bg-[#080808] pt-safe-top">
      <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#22D3EE]/70">
            Treino ativo
          </p>
          <p className="mt-1 text-xs text-[#F5F5F5]/32">Musculação cronometrada</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="grid size-9 place-items-center rounded-xl text-[#F5F5F5]/35 transition hover:bg-white/[0.06] hover:text-[#F5F5F5]/70"
          aria-label="Cancelar treino"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
        <div className="mb-5 grid size-16 place-items-center rounded-2xl border border-[#22D3EE]/20 bg-[#22D3EE]/10 text-[#22D3EE] shadow-[0_0_36px_rgba(34,211,238,0.12)]">
          <Dumbbell className="size-8" strokeWidth={1.8} />
        </div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#F5F5F5]/28">
          Tempo de treino
        </p>
        <p
          className="font-display text-[64px] font-bold tabular-nums leading-none tracking-tight sm:text-[88px]"
          style={{ color: paused ? "rgba(245,245,245,0.35)" : "#F5F5F5" }}
        >
          {formatTimer(elapsedSeconds)}
        </p>
        <div className="mt-5 rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.15em]"
            style={{ color: paused ? "#FB923C" : "#22D3EE" }}
          >
            {paused ? "Pausado" : "Em andamento"}
          </span>
        </div>
      </div>

      <div
        className="shrink-0 px-5"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 2rem)" }}
      >
        <div className="flex items-end justify-center gap-8">
          <div className="flex flex-col items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              className="grid size-20 place-items-center rounded-full transition active:scale-95"
              style={
                paused
                  ? {
                      background: "#22D3EE",
                      boxShadow: "0 0 40px rgba(34,211,238,0.42), 0 0 80px rgba(34,211,238,0.14)",
                    }
                  : {
                      border: "1px solid rgba(245,245,245,0.14)",
                      background: "rgba(245,245,245,0.09)",
                    }
              }
            >
              {paused ? (
                <Play className="size-8 translate-x-0.5 fill-current stroke-none text-[#061014]" />
              ) : (
                <Pause className="size-8 text-[#F5F5F5]/90" strokeWidth={2.5} />
              )}
            </button>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/42">
              {paused ? "Retomar" : "Pausar"}
            </span>
          </div>

          <div className="mb-2 flex flex-col items-center gap-2.5">
            <button
              type="button"
              onClick={() => onFinish(elapsedSeconds)}
              className="grid size-14 place-items-center rounded-full border border-white/[0.1] bg-white/[0.05] transition active:scale-95 hover:bg-white/[0.09]"
            >
              <Square className="size-5 fill-current stroke-none text-[#F5F5F5]/60" />
            </button>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/28">
              Finalizar
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="mt-5 flex w-full items-center justify-center rounded-2xl border border-red-500/15 bg-red-500/[0.06] py-3 text-sm font-semibold text-red-300/75"
        >
          Cancelar treino
        </button>
      </div>
    </div>
  );
}

function RecentWorkouts({
  workouts,
  status,
  deletingId,
  isSaving,
  onEdit,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
}: {
  workouts: Workout[];
  status: "loading" | "ready" | "error";
  deletingId: string | null;
  isSaving: boolean;
  onEdit: (workout: Workout) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: (id: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
      <div className="border-b border-white/[0.05] px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">Histórico</p>
        <h2 className="mt-1 font-display text-base font-semibold">Últimos treinos</h2>
      </div>
      <div className="space-y-2 p-3">
        {status === "loading" && workouts.length === 0 && (
          <div className="h-32 animate-pulse rounded-2xl bg-white/[0.04]" />
        )}
        {status === "ready" && workouts.length === 0 && (
          <p className="px-3 py-10 text-center text-sm text-[#F5F5F5]/30">Nenhum treino salvo ainda.</p>
        )}
        {workouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            isDeleting={deletingId === workout.id}
            isSaving={isSaving}
            onEdit={() => onEdit(workout)}
            onDeleteRequest={() => onDeleteRequest(workout.id)}
            onDeleteCancel={onDeleteCancel}
            onDeleteConfirm={() => onDeleteConfirm(workout.id)}
          />
        ))}
      </div>
    </section>
  );
}

function WorkoutCard({
  workout,
  isDeleting,
  isSaving,
  onEdit,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
}: {
  workout: Workout;
  isDeleting: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onDeleteRequest: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
}) {
  const groups = normalizeMuscleGroups(workout.muscle_groups?.length ? workout.muscle_groups : [workout.muscle_group]);
  const group = getMuscleGroup(groups[0]);
  const intensity = INTENSITIES.find((item) => item.value === workout.intensity);

  if (isDeleting) {
    return (
      <article className="rounded-2xl border border-red-500/25 bg-red-500/[0.06] p-4 text-center">
        <AlertTriangle className="mx-auto mb-2 size-5 text-red-400" />
        <p className="text-sm font-semibold">Excluir este treino?</p>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={onDeleteCancel} className="flex-1 rounded-xl border border-white/[0.08] py-2 text-xs text-[#F5F5F5]/60">
            Cancelar
          </button>
          <button type="button" onClick={onDeleteConfirm} disabled={isSaving} className="flex-1 rounded-xl bg-red-500/85 py-2 text-xs font-bold text-white disabled:opacity-50">
            {isSaving ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: `${group.color}14` }}>
          <MuscleIllustration group={group.value} color={group.color} active />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold text-[#F5F5F5]/85">{workout.title}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {groups.slice(0, 4).map((value) => (
              <span key={value} className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-[#F5F5F5]/42">
                {getMuscleGroupLabel(value)}
              </span>
            ))}
            {groups.length > 4 && <span className="text-[10px] text-[#F5F5F5]/30">+{groups.length - 4}</span>}
          </div>
          {workout.muscle_details?.length ? (
            <p className="mt-2 line-clamp-1 text-xs text-[#F5F5F5]/30">
              {workout.muscle_details.map(getMuscleDetailLabel).join(" • ")}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-[#F5F5F5]/35">
        <span className="flex items-center gap-1"><Clock className="size-3" />{workout.duration_minutes} min</span>
        <span className="flex items-center gap-1"><CalendarDays className="size-3" />{formatDate(workout.created_at)}</span>
        <span className="flex items-center gap-1"><Flame className="size-3" />{intensity?.label ?? "Livre"}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onEdit} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] py-2 text-xs font-semibold text-[#F5F5F5]/50">
          <Pencil className="size-3.5" />
          Editar
        </button>
        <button type="button" onClick={onDeleteRequest} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-500/15 py-2 text-xs font-semibold text-red-400/65">
          <Trash2 className="size-3.5" />
          Excluir
        </button>
      </div>
    </article>
  );
}

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
    muscle_groups: normalizeMuscleGroups(workout.muscle_groups?.length ? workout.muscle_groups : [workout.muscle_group]),
    muscle_details: workout.muscle_details ?? [],
    workout_split: workout.workout_split ?? "custom",
    duration_minutes: String(workout.duration_minutes),
    intensity: workout.intensity ?? "",
    notes: workout.notes ?? "",
    workout_date: toDateInputValue(workout.created_at),
    workout_time: toTimeInputValue(workout.created_at),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const details = visibleDetails(form.muscle_groups);

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

  async function submit(e: React.FormEvent<HTMLFormElement>) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#111111] p-5"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.25rem)" }}
      >
        <h2 className="font-display text-lg font-bold">Editar treino</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px]">
          <input required value={form.title} onChange={(e) => setForm((cur) => ({ ...cur, title: e.target.value }))} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none" />
          <input required type="number" min="1" value={form.duration_minutes} onChange={(e) => setForm((cur) => ({ ...cur, duration_minutes: e.target.value }))} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-2 block text-xs font-semibold text-[#F5F5F5]/38">Data do treino</span>
            <input
              required
              type="date"
              value={form.workout_date ?? ""}
              onChange={(e) => setForm((cur) => ({ ...cur, workout_date: e.target.value }))}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none"
            />
          </label>
          <label>
            <span className="mb-2 block text-xs font-semibold text-[#F5F5F5]/38">Horário</span>
            <input
              required
              type="time"
              value={form.workout_time ?? ""}
              onChange={(e) => setForm((cur) => ({ ...cur, workout_time: e.target.value }))}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none"
            />
          </label>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MUSCLE_GROUPS.map((group) => {
            const active = form.muscle_groups.includes(group.value);
            return (
              <button
                key={group.value}
                type="button"
                onClick={() => {
                  const next = active ? form.muscle_groups.filter((g) => g !== group.value) : [...form.muscle_groups, group.value];
                  setForm((cur) => ({ ...cur, muscle_groups: next.length ? next : ["full-body"], workout_split: "custom" }));
                }}
                className="rounded-xl border px-2 py-2 text-xs font-semibold"
                style={active ? { borderColor: `${group.color}55`, background: `${group.color}14`, color: group.color } : { borderColor: "rgba(255,255,255,0.08)", color: "rgba(245,245,245,0.42)" }}
              >
                {group.name}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {details.map((detail) => (
            <button
              key={detail.value}
              type="button"
              onClick={() => setForm((cur) => ({ ...cur, muscle_details: cur.muscle_details.includes(detail.value) ? cur.muscle_details.filter((d) => d !== detail.value) : [...cur.muscle_details, detail.value] }))}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={form.muscle_details.includes(detail.value) ? { borderColor: `${detail.color}55`, background: `${detail.color}14`, color: detail.color } : { borderColor: "rgba(255,255,255,0.08)", color: "rgba(245,245,245,0.42)" }}
            >
              {detail.label}
            </button>
          ))}
        </div>
        <textarea value={form.notes} onChange={(e) => setForm((cur) => ({ ...cur, notes: e.target.value }))} rows={2} className="mt-4 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none" />
        {error && <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm text-[#F5F5F5]/55">Cancelar</button>
          <button disabled={saving} className="flex-1 rounded-xl bg-[#B6FF00] py-2.5 text-sm font-bold text-[#080808] disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ProgressPulse({ updates }: { updates: ProgressUpdate[] }) {
  return (
    <div className="rounded-2xl border border-[#60A5FA]/20 bg-[#60A5FA]/[0.07] px-4 py-3">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#60A5FA]">
        <Trophy className="size-4" />
        Progresso competitivo
      </p>
      <div className="mt-2 space-y-1">
        {updates.map((update) => (
          <div key={update.competitionId} className="flex justify-between gap-3 text-xs">
            <span className="truncate text-[#F5F5F5]/65">{update.title}</span>
            <span className="font-bold text-[#60A5FA]">+{update.delta} {update.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function XPToast({ feedback }: { feedback: XPFeedback }) {
  return (
    <div className="rounded-2xl border border-[#B6FF00]/20 bg-[#B6FF00]/[0.07] px-4 py-3">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#B6FF00]">
        <Sparkles className="size-4" />
        {feedback.leveledUp ? "Level up" : "XP ganho"}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#F5F5F5]/75">+{feedback.gainedXp} XP · Nível {feedback.currentLevel}</p>
    </div>
  );
}
