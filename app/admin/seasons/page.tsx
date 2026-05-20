"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Pencil, Check, X, Zap } from "lucide-react";
import Link from "next/link";

import type { Season } from "@/lib/seasons";

type FormState = {
  name: string;
  description: string;
  color: string;
  xp_multiplier: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

const DEFAULT_FORM: FormState = {
  name: "",
  description: "",
  color: "#B6FF00",
  xp_multiplier: "1.0",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10),
  is_active: false,
};

export default function AdminSeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadSeasons() {
    setLoading(true);
    const res = await fetch("/api/admin/seasons", { credentials: "include" });
    if (res.ok) {
      const { seasons: s } = await res.json() as { seasons: Season[] };
      setSeasons(s);
    } else {
      setError("Acesso negado ou erro ao carregar temporadas.");
    }
    setLoading(false);
  }

  useEffect(() => { loadSeasons(); }, []);

  function startCreate() {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
    setError(null);
  }

  function startEdit(season: Season) {
    setEditingId(season.id);
    setForm({
      name: season.name,
      description: season.description ?? "",
      color: season.color,
      xp_multiplier: String(season.xpMultiplier),
      start_date: season.startDate,
      end_date: season.endDate,
      is_active: season.isActive,
    });
    setShowForm(true);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const body = {
        ...form,
        xp_multiplier: parseFloat(form.xp_multiplier) || 1.0,
        ...(editingId ? { id: editingId } : {}),
      };

      const res = await fetch("/api/admin/seasons", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const json = await res.json() as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Erro ao salvar temporada.");
        return;
      }

      setShowForm(false);
      setEditingId(null);
      await loadSeasons();
    });
  }

  async function toggleActive(season: Season) {
    await fetch("/api/admin/seasons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: season.id, is_active: !season.isActive }),
    });
    await loadSeasons();
  }

  return (
    <div className="min-h-screen bg-[#080808] p-6 text-[#F5F5F5]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-xs text-[#F5F5F5]/30 hover:text-[#F5F5F5]/60">
            ← Admin
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold">Temporadas</h1>
          <p className="text-sm text-[#F5F5F5]/40">Gerencie as temporadas e eventos especiais.</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="flex items-center gap-2 rounded-xl bg-[#B6FF00] px-4 py-2.5 text-sm font-bold text-[#080808] transition-all active:scale-95"
        >
          <Plus className="size-4" />
          Nova temporada
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <section className="mb-6 rounded-2xl border border-white/[0.09] bg-[#111] p-5">
          <h2 className="mb-4 text-base font-semibold">
            {editingId ? "Editar temporada" : "Criar temporada"}
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#F5F5F5]/40">Nome *</span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Season 2 — Hybrid Era"
                required
                className="rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#F5F5F5]/20 outline-none focus:border-[#B6FF00]/30"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#F5F5F5]/40">Cor</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="size-10 cursor-pointer rounded-lg border border-white/[0.09] bg-transparent"
                />
                <input
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="flex-1 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 text-sm text-[#F5F5F5] font-mono outline-none focus:border-[#B6FF00]/30"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#F5F5F5]/40">Descrição</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descrição da temporada..."
                rows={2}
                className="rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#F5F5F5]/20 outline-none focus:border-[#B6FF00]/30 resize-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#F5F5F5]/40">Início *</span>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                required
                className="rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 text-sm text-[#F5F5F5] outline-none focus:border-[#B6FF00]/30"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#F5F5F5]/40">Fim *</span>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                required
                className="rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 text-sm text-[#F5F5F5] outline-none focus:border-[#B6FF00]/30"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#F5F5F5]/40">Multiplicador XP</span>
              <input
                type="number"
                min="0.5"
                max="5"
                step="0.1"
                value={form.xp_multiplier}
                onChange={(e) => setForm((f) => ({ ...f, xp_multiplier: e.target.value }))}
                className="rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 text-sm text-[#F5F5F5] outline-none focus:border-[#B6FF00]/30"
              />
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="size-4 rounded accent-[#B6FF00]"
              />
              <span className="text-sm text-[#F5F5F5]/70">Ativar imediatamente</span>
            </label>

            {error && (
              <p className="sm:col-span-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="flex gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 rounded-xl bg-[#B6FF00] px-5 py-2.5 text-sm font-bold text-[#080808] disabled:opacity-50"
              >
                <Check className="size-4" />
                {isPending ? "Salvando..." : "Salvar"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex items-center gap-2 rounded-xl border border-white/[0.09] px-5 py-2.5 text-sm font-medium text-[#F5F5F5]/50"
              >
                <X className="size-4" />
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Seasons list */}
      {loading ? (
        <div className="py-12 text-center text-sm text-[#F5F5F5]/30">Carregando...</div>
      ) : seasons.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#F5F5F5]/30">Nenhuma temporada criada.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {seasons.map((season) => (
            <div
              key={season.id}
              className="flex items-center gap-4 rounded-2xl border bg-[#111] p-4"
              style={{ borderColor: season.isActive ? `${season.color}40` : "rgba(255,255,255,0.07)" }}
            >
              {/* Color dot */}
              <div
                className="size-3 shrink-0 rounded-full"
                style={{ background: season.color, boxShadow: season.isActive ? `0 0 8px ${season.color}` : "none" }}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-[#F5F5F5]/90">{season.name}</p>
                  {season.isActive && (
                    <span className="rounded-full bg-[#B6FF00]/10 px-2 py-0.5 text-[9px] font-bold text-[#B6FF00]">
                      ATIVA
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#F5F5F5]/35">
                  {season.startDate} → {season.endDate}
                  {season.xpMultiplier !== 1 && (
                    <span className="ml-2 text-amber-400/70">
                      <Zap className="inline size-3" /> ×{season.xpMultiplier} XP
                    </span>
                  )}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(season)}
                  className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-[#F5F5F5]/50 transition-colors hover:border-[#B6FF00]/30 hover:text-[#B6FF00]"
                >
                  {season.isActive ? "Desativar" : "Ativar"}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(season)}
                  className="grid size-8 place-items-center rounded-lg border border-white/[0.08] text-[#F5F5F5]/40 transition-colors hover:border-white/[0.15] hover:text-[#F5F5F5]/70"
                >
                  <Pencil className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
