import { redirect } from "next/navigation";
import { Bell, Bug, CalendarDays, Megaphone, Sparkles, Zap } from "lucide-react";

import { AppShell } from "@/components/ui/layout/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AppUpdate = {
  id: string;
  title: string;
  summary: string | null;
  features: string;
  update_type: "feature" | "bugfix" | "season" | "announcement";
  created_at: string;
};

const UPDATE_TYPE_META = {
  feature: { label: "Novidade", icon: Sparkles, tone: "lime" },
  bugfix: { label: "Correcao", icon: Bug, tone: "cyan" },
  season: { label: "Temporada", icon: Zap, tone: "gold" },
  announcement: { label: "Comunicado", icon: Megaphone, tone: "purple" },
} as const;

export default async function UpdatesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: updates } = await supabase
    .from("app_updates")
    .select("id,title,summary,features,update_type,created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = (updates ?? []) as AppUpdate[];

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-2xl px-3.5 pb-4 pt-4 sm:px-4 sm:py-8 md:px-6">
        <header className="mb-4 sm:mb-8">
          <div className="mb-2.5 flex items-center gap-2.5">
            <div className="grid size-7 place-items-center rounded-xl border border-[#B6FF00]/20 bg-[#B6FF00]/10">
              <Bell className="size-4 text-[#B6FF00]" strokeWidth={2} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
              GymPace
            </p>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Atualizações
          </h1>
          <p className="mt-1 text-sm text-[#F5F5F5]/40 sm:mt-2">
            Novas funcionalidades, correções e temporadas do app.
          </p>
        </header>

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {items.map((update) => (
              <UpdateCard key={update.id} update={update} />
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}

function UpdateCard({ update }: { update: AppUpdate }) {
  const meta = UPDATE_TYPE_META[update.update_type] ?? UPDATE_TYPE_META.feature;
  const Icon = meta.icon;
  const featureLines = update.features
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean);

  return (
    <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111]/92 shadow-[0_12px_34px_rgba(0,0,0,0.28)]">
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <div
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-2xl border",
            toneClasses(meta.tone).icon
          )}
        >
          <Icon className="size-5" strokeWidth={1.9} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]",
                toneClasses(meta.tone).badge
              )}
            >
              {meta.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#F5F5F5]/30">
              <CalendarDays className="size-3" strokeWidth={1.8} />
              {formatDate(update.created_at)}
            </span>
          </div>

          <h2 className="text-[17px] font-bold leading-snug tracking-tight text-[#F5F5F5] sm:text-lg">
            {update.title}
          </h2>
          {update.summary && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#F5F5F5]/50">
              {update.summary}
            </p>
          )}

          {featureLines.length > 0 && (
            <div className="mt-3 space-y-2.5">
              {featureLines.map((line) => (
                <div key={line} className="flex gap-2.5 text-[13px] leading-relaxed text-[#F5F5F5]/68">
                  <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", toneClasses(meta.tone).dot)} />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111111] px-5 py-14 text-center">
      <div className="mx-auto mb-4 grid size-11 place-items-center rounded-2xl border border-[#B6FF00]/20 bg-[#B6FF00]/10">
        <Bell className="size-5 text-[#B6FF00]" strokeWidth={1.8} />
      </div>
      <p className="text-sm font-semibold text-[#F5F5F5]/55">Nenhuma atualização publicada ainda</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#F5F5F5]/30">
        Quando o time publicar novidades, elas vão aparecer aqui.
      </p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function toneClasses(tone: string) {
  switch (tone) {
    case "cyan":
      return {
        icon: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
        badge: "border-cyan-400/18 bg-cyan-400/8 text-cyan-300/80",
        dot: "bg-cyan-300",
      };
    case "gold":
      return {
        icon: "border-amber-300/22 bg-amber-300/10 text-amber-200",
        badge: "border-amber-300/18 bg-amber-300/8 text-amber-200/85",
        dot: "bg-amber-200",
      };
    case "purple":
      return {
        icon: "border-violet-400/22 bg-violet-400/10 text-violet-300",
        badge: "border-violet-400/18 bg-violet-400/8 text-violet-300/85",
        dot: "bg-violet-300",
      };
    default:
      return {
        icon: "border-[#B6FF00]/22 bg-[#B6FF00]/10 text-[#B6FF00]",
        badge: "border-[#B6FF00]/18 bg-[#B6FF00]/8 text-[#B6FF00]/85",
        dot: "bg-[#B6FF00]",
      };
  }
}
