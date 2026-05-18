import Link from "next/link";
import { Bell, CalendarDays, Dumbbell, Flame, Plus, Route, Trophy, Users, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AppShell } from "@/components/ui/layout/app-shell";
import { JoinButton } from "@/components/competitions/join-button";
import { PendingInviteCard } from "@/components/competitions/pending-invite-card";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { formatShortDate as fmtDate } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

type CompType = "corrida" | "academia" | "streak" | "hibrido";

interface Competition {
  id: string;
  title: string;
  description: string | null;
  type: CompType;
  target_value: number;
  start_date: string;
  end_date: string;
  created_at: string;
  competition_participants: { user_id: string }[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<CompType, { label: string; icon: LucideIcon; color: string; unit: string }> = {
  corrida:  { label: "Corrida",    icon: Route,    color: "#B6FF00", unit: "km" },
  academia: { label: "Academia",   icon: Dumbbell, color: "#60A5FA", unit: "sessões" },
  streak:   { label: "Sequência",  icon: Flame,    color: "#FB923C", unit: "dias" },
  hibrido:  { label: "Híbrido",    icon: Zap,      color: "#A78BFA", unit: "pts" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatus(start: string, end: string): "active" | "upcoming" | "ended" {
  const now = new Date();
  if (now < new Date(start)) return "upcoming";
  if (now > new Date(end)) return "ended";
  return "active";
}

function daysLeft(end: string) {
  const diff = Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000);
  return diff;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CompeticoesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Pending invites for the current user
  const rawInvites = user ? await (async () => {
    const { data: invites } = await supabase
      .from("competition_invites")
      .select("id, competition_id, invited_by")
      .eq("invited_user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!invites || invites.length === 0) return [];

    const compIds = [...new Set(invites.map(i => i.competition_id))];
    const inviterIds = [...new Set(invites.map(i => i.invited_by))];

    const [{ data: comps }, { data: inviters }] = await Promise.all([
      supabase.from("competitions").select("id, title, type").in("id", compIds),
      supabase.from("profiles").select("user_id, username, display_name").in("user_id", inviterIds),
    ]);

    return invites.map(inv => ({
      id: inv.id,
      competition_id: inv.competition_id,
      competition: comps?.find(c => c.id === inv.competition_id) ?? null,
      inviter: inviters?.find(p => p.user_id === inv.invited_by) ?? null,
    }));
  })() : [];

  const pendingInvites = rawInvites.filter(i => i.competition !== null);

  const { data: raw } = await supabase
    .from("competitions")
    .select("id, title, description, type, target_value, start_date, end_date, created_at, competition_participants(user_id)")
    .order("end_date", { ascending: true });

  const competitions: Competition[] = (raw ?? []) as Competition[];

  const active   = competitions.filter(c => getStatus(c.start_date, c.end_date) === "active");
  const upcoming = competitions.filter(c => getStatus(c.start_date, c.end_date) === "upcoming");
  const ended    = competitions.filter(c => getStatus(c.start_date, c.end_date) === "ended");

  const isEmpty = competitions.length === 0;

  return (
    <AppShell>
      <div className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
              Social
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight">Competições</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#F5F5F5]/40">
              Desafie outros atletas, acompanhe o ranking e quebre seus recordes.
            </p>
          </div>
          <Link
            href="/competicoes/criar"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#B6FF00] px-4 py-2.5 text-sm font-bold text-[#080808] shadow-[0_0_20px_rgba(182,255,0,0.12)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_0_28px_rgba(182,255,0,0.22)] active:translate-y-0"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Criar
          </Link>
        </header>

        {/* ── Pending invites ── */}
        {pendingInvites.length > 0 && (
          <div className="mb-8 max-w-3xl">
            <div className="mb-4 flex items-center gap-3">
              <Bell className="size-3.5 text-[#B6FF00]/60" strokeWidth={2} />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5F5F5]/45">
                Convites Pendentes
              </h2>
              <span className="rounded-full bg-[#B6FF00]/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-[#B6FF00]/80">
                {pendingInvites.length}
              </span>
              <div className="h-px flex-1 bg-white/[0.05]" />
            </div>
            <div className="space-y-2.5">
              {pendingInvites.map(inv => (
                <PendingInviteCard
                  key={inv.id}
                  inviteId={inv.id}
                  competitionId={inv.competition_id}
                  competitionTitle={inv.competition!.title}
                  competitionType={inv.competition!.type}
                  inviterUsername={inv.inviter?.username ?? null}
                  inviterDisplayName={inv.inviter?.display_name ?? null}
                  compact
                />
              ))}
            </div>
          </div>
        )}

        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="max-w-3xl space-y-8">
            {active.length > 0 && (
              <Section title="Em andamento" accent="#B6FF00">
                {active.map(c => (
                  <CompetitionCard key={c.id} competition={c} currentUserId={user?.id ?? null} />
                ))}
              </Section>
            )}

            {upcoming.length > 0 && (
              <Section title="Em breve">
                {upcoming.map(c => (
                  <CompetitionCard key={c.id} competition={c} currentUserId={user?.id ?? null} />
                ))}
              </Section>
            )}

            {ended.length > 0 && (
              <Section title="Encerradas">
                {ended.map(c => (
                  <CompetitionCard key={c.id} competition={c} currentUserId={user?.id ?? null} />
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        {accent && (
          <div className="size-1.5 rounded-full" style={{ background: accent }} />
        )}
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5F5F5]/45">{title}</h2>
        <div className="h-px flex-1 bg-white/[0.05]" />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function CompetitionCard({
  competition: c,
  currentUserId,
}: {
  competition: Competition;
  currentUserId: string | null;
}) {
  const cfg = TYPE_CONFIG[c.type] ?? TYPE_CONFIG.corrida;
  const Icon = cfg.icon;
  const status = getStatus(c.start_date, c.end_date);
  const isJoined = currentUserId ? c.competition_participants.some(p => p.user_id === currentUserId) : false;
  const participantCount = c.competition_participants.length;
  const ended = status === "ended";
  const days = ended ? null : daysLeft(c.end_date);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] transition-all duration-200 hover:border-white/[0.13]"
      style={isJoined ? { boxShadow: `0 0 32px ${cfg.color}0C` } : undefined}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
      {isJoined && (
        <div
          className="pointer-events-none absolute -left-6 -top-6 size-36 rounded-full blur-[60px]"
          style={{ background: cfg.color + "10" }}
        />
      )}

      <div className="relative p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* Type icon */}
            <div
              className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl"
              style={{ background: cfg.color + "18", color: cfg.color }}
            >
              <Icon className="size-4" strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-base font-bold tracking-tight text-[#F5F5F5]">
                  {c.title}
                </h3>
                <span
                  className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]"
                  style={{ background: cfg.color + "18", color: cfg.color }}
                >
                  {cfg.label}
                </span>
                {status === "active" && (
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] bg-emerald-500/10 text-emerald-400">
                    Ativa
                  </span>
                )}
                {status === "upcoming" && (
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] bg-blue-500/10 text-blue-400">
                    Em breve
                  </span>
                )}
                {ended && (
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] bg-white/[0.04] text-[#F5F5F5]/30">
                    Encerrada
                  </span>
                )}
              </div>
              {c.description && (
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#F5F5F5]/40">
                  {c.description}
                </p>
              )}
            </div>
          </div>

          {/* Join button */}
          {currentUserId && (
            <div className="shrink-0">
              <JoinButton
                competitionId={c.id}
                initialIsJoined={isJoined}
                disabled={ended}
              />
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[#F5F5F5]/35">
          <span className="flex items-center gap-1.5 text-xs">
            <CalendarDays className="size-3.5" strokeWidth={1.8} />
            {fmtDate(c.start_date)} – {fmtDate(c.end_date)}
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <Users className="size-3.5" strokeWidth={1.8} />
            {participantCount} {participantCount === 1 ? "participante" : "participantes"}
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <Trophy className="size-3.5" strokeWidth={1.8} />
            Meta: {c.target_value} {cfg.unit}
          </span>
          {days !== null && days >= 0 && (
            <span
              className="ml-auto text-xs font-bold tabular-nums"
              style={{ color: days <= 3 ? "#FB923C" : cfg.color }}
            >
              {days === 0 ? "Encerra hoje" : `${days} ${days === 1 ? "dia restante" : "dias restantes"}`}
            </span>
          )}
        </div>

        {/* View link */}
        <div className="mt-4 border-t border-white/[0.04] pt-3">
          <Link
            href={`/competicoes/${c.id}`}
            className="text-xs font-semibold text-[#F5F5F5]/35 transition-colors hover:text-[#F5F5F5]/70"
          >
            Ver ranking e detalhes →
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex max-w-sm flex-col items-center gap-5 py-16 text-center">
      <div className="relative grid size-16 place-items-center rounded-2xl border border-white/[0.07] bg-[#111111]">
        <Trophy className="size-7 text-[#F5F5F5]/20" strokeWidth={1.5} />
        <div className="absolute -right-1 -top-1 size-3 rounded-full bg-[#B6FF00] shadow-[0_0_8px_rgba(182,255,0,0.5)]" />
      </div>
      <div>
        <p className="font-display text-base font-bold text-[#F5F5F5]/70">
          Nenhuma competição ainda
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-[#F5F5F5]/35">
          As competições aparecerão aqui assim que forem criadas.
          Prepare-se para competir.
        </p>
      </div>
    </div>
  );
}
