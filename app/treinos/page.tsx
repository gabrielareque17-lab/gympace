import Link from "next/link";
import { Activity, Dumbbell, History, MapPin, Plus, Timer } from "lucide-react";

import { AppShell } from "@/components/ui/layout/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { formatShortDate } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

type RecentRun = {
  id: string;
  distance: number | null;
  duration: string | null;
  created_at: string;
};

type RecentWorkout = {
  id: string;
  title: string | null;
  duration_minutes: number | null;
  created_at: string;
};

export default async function TreinosPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [runsRes, workoutsRes] = user
    ? await Promise.all([
        supabase
          .from("runs")
          .select("id,distance,duration,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("workouts")
          .select("id,title,duration_minutes,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ])
    : [{ data: [] }, { data: [] }];

  const recent = [
    ...((runsRes.data ?? []) as RecentRun[]).map((run) => ({
      id: `run-${run.id}`,
      label: "Corrida",
      title: `${Number(run.distance ?? 0).toFixed(1)} km`,
      meta: run.duration ?? "Sem duração",
      date: run.created_at,
      icon: Timer,
      color: "#B6FF00",
    })),
    ...((workoutsRes.data ?? []) as RecentWorkout[]).map((workout) => ({
      id: `workout-${workout.id}`,
      label: "Musculação",
      title: workout.title ?? "Treino",
      meta: `${workout.duration_minutes ?? 0} min`,
      date: workout.created_at,
      icon: Dumbbell,
      color: "#22D3EE",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  return (
    <AppShell>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <header className="mb-6">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
            Registro
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Treinos</h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[#F5F5F5]/40">
            Corrida e musculação ficam no mesmo ponto de partida, preservando GPS, XP, feed e progresso competitivo.
          </p>
        </header>

        <div className="grid max-w-4xl gap-4 md:grid-cols-2">
          <TrainingCard
            href="/academia"
            title="Musculação"
            description="Registrar treino de força, grupos musculares, duração e intensidade."
            icon={Dumbbell}
            color="#22D3EE"
          />
          <TrainingCard
            href="/corridas"
            title="Corrida"
            description="Registrar manualmente ou iniciar o tracking GPS em tempo real."
            icon={MapPin}
            color="#B6FF00"
          />
        </div>

        <section className="mt-6 max-w-4xl overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
          <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F5F5F5]/30">
                Histórico
              </p>
              <h2 className="mt-1 flex items-center gap-2 font-display text-base font-semibold">
                <History className="size-4 text-[#B6FF00]" />
                Últimas atividades
              </h2>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recent.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#F5F5F5]/30">
                Nenhum treino registrado ainda.
              </p>
            ) : (
              recent.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="grid size-9 place-items-center rounded-xl" style={{ background: `${item.color}14`, color: item.color }}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#F5F5F5]/80">{item.title}</p>
                      <p className="text-xs text-[#F5F5F5]/32">{item.label} · {item.meta}</p>
                    </div>
                    <span className="text-xs text-[#F5F5F5]/28">{formatShortDate(item.date)}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function TrainingCard({
  href,
  title,
  description,
  icon: Icon,
  color,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-5 transition-all duration-200 hover:border-white/[0.13] active:scale-[0.99]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div className="grid size-11 place-items-center rounded-2xl" style={{ background: `${color}16`, color }}>
          <Icon className="size-5" strokeWidth={2} />
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-xl bg-[#B6FF00] px-3 py-1.5 text-xs font-bold text-[#080808]">
          <Plus className="size-3.5" />
          Registrar
        </div>
      </div>
      <h2 className="mt-5 font-display text-xl font-bold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#F5F5F5]/40">{description}</p>
      <div className="mt-5 flex items-center gap-2 text-xs font-semibold" style={{ color }}>
        <Activity className="size-3.5" />
        Abrir aba de {title.toLowerCase()}
      </div>
    </Link>
  );
}
