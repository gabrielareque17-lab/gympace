"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Dumbbell, Flame, Loader2, Route, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AppShell } from "@/components/ui/layout/app-shell";

type CompType = "corrida" | "academia" | "streak" | "hibrido";

const TYPE_OPTIONS: {
  type: CompType;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  unit: string;
  placeholder: string;
}[] = [
  {
    type: "corrida",
    label: "Corrida",
    description: "Distância percorrida",
    icon: Route,
    color: "#B6FF00",
    unit: "km",
    placeholder: "Ex: 100",
  },
  {
    type: "academia",
    label: "Academia",
    description: "Sessões de treino",
    icon: Dumbbell,
    color: "#60A5FA",
    unit: "sessões",
    placeholder: "Ex: 20",
  },
  {
    type: "streak",
    label: "Sequência",
    description: "Dias consecutivos",
    icon: Flame,
    color: "#FB923C",
    unit: "dias",
    placeholder: "Ex: 30",
  },
  {
    type: "hibrido",
    label: "Híbrido",
    description: "Pontuação mista",
    icon: Zap,
    color: "#A78BFA",
    unit: "pts",
    placeholder: "Ex: 500",
  },
];

export default function CriarCompeticaoPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CompType>("corrida");
  const [target, setTarget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedType = TYPE_OPTIONS.find(t => t.type === type)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) { setError("Título é obrigatório"); return; }
    if (!target || Number(target) <= 0) { setError("Meta deve ser maior que zero"); return; }
    if (!startDate || !endDate) { setError("Datas de início e término são obrigatórias"); return; }
    if (new Date(endDate) <= new Date(startDate)) { setError("Data de término deve ser após o início"); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          type,
          target_value: Number(target),
          start_date: startDate,
          end_date: endDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar competição");
        return;
      }
      router.push(`/competicoes/${data.id}`);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        <Link
          href="/competicoes"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F5F5F5]/35 transition-colors hover:text-[#F5F5F5]/65"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2} />
          Competições
        </Link>

        <header className="mb-8">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
            Nova competição
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Criar desafio</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#F5F5F5]/40">
            Configure um novo desafio competitivo para a comunidade.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
          {/* ── Informações ── */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <SectionHeader title="Informações" />
            <div className="space-y-4 p-5">
              <Field label="Título" required>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Corrida de Maio – 100 km"
                  maxLength={80}
                  className={inputCls}
                />
              </Field>
              <Field label="Descrição" hint="opcional">
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descreva regras, contexto ou prêmios do desafio..."
                  maxLength={300}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </div>
          </div>

          {/* ── Tipo ── */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <SectionHeader title="Tipo de competição" required />
            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
              {TYPE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const active = type === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setType(opt.type)}
                    className="flex flex-col items-center gap-2.5 rounded-xl border p-4 text-center transition-all duration-200"
                    style={
                      active
                        ? {
                            borderColor: opt.color + "50",
                            background: opt.color + "0C",
                            boxShadow: `0 0 20px ${opt.color}16`,
                          }
                        : {
                            borderColor: "rgba(255,255,255,0.06)",
                            background: "rgba(255,255,255,0.02)",
                          }
                    }
                  >
                    <div
                      className="grid size-10 shrink-0 place-items-center rounded-xl transition-all duration-200"
                      style={
                        active
                          ? { background: opt.color + "20", color: opt.color, boxShadow: `0 0 12px ${opt.color}28` }
                          : { background: "rgba(255,255,255,0.05)", color: "rgba(245,245,245,0.32)" }
                      }
                    >
                      <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                    </div>
                    <div>
                      <p
                        className="text-xs font-bold"
                        style={{ color: active ? opt.color : "rgba(245,245,245,0.60)" }}
                      >
                        {opt.label}
                      </p>
                      <p className="mt-0.5 text-[10px] leading-tight text-[#F5F5F5]/28">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Meta e período ── */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <SectionHeader title="Meta e período" />
            <div className="space-y-4 p-5">
              <Field label="Meta" required hint={`em ${selectedType.unit}`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="number"
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    placeholder={selectedType.placeholder}
                    min={1}
                    step={type === "corrida" ? 0.1 : 1}
                    className={`${inputCls} w-36 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                  />
                  <span
                    className="rounded-lg border px-3 py-2.5 text-xs font-bold transition-colors duration-200"
                    style={{
                      borderColor: selectedType.color + "30",
                      color: selectedType.color,
                      background: selectedType.color + "0C",
                    }}
                  >
                    {selectedType.unit}
                  </span>
                </div>
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Início" required>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className={`${inputCls} [color-scheme:dark]`}
                  />
                </Field>
                <Field label="Término" required>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    min={startDate || undefined}
                    className={`${inputCls} [color-scheme:dark]`}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
              <p className="text-sm font-medium text-red-400/80">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#B6FF00] px-6 text-sm font-bold text-[#080808] shadow-[0_0_20px_rgba(182,255,0,0.15)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_0_28px_rgba(182,255,0,0.25)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar competição"
              )}
            </button>
            <Link
              href="/competicoes"
              className="inline-flex h-11 items-center rounded-xl border border-white/[0.08] px-5 text-sm font-semibold text-[#F5F5F5]/40 transition-colors hover:border-white/[0.13] hover:text-[#F5F5F5]/62"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-[#F5F5F5] placeholder-[#F5F5F5]/20 outline-none transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]";

function SectionHeader({ title, required }: { title: string; required?: boolean }) {
  return (
    <div className="relative border-b border-white/[0.05] px-5 py-4">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
      <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#F5F5F5]/40">
        {title}
        {required && <span className="ml-1" style={{ color: "#B6FF00" }}>*</span>}
      </h2>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#F5F5F5]/50">
        {label}
        {required && <span style={{ color: "#B6FF00" }}>*</span>}
        {hint && <span className="text-[10px] font-normal text-[#F5F5F5]/25 normal-case">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
