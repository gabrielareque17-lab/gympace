"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ElementType } from "react";
import { useState } from "react";
import { CalendarDays, CheckCircle2, Crown, History, Inbox, Loader2, Send, Trophy, Users, X } from "lucide-react";

import { JoinButton } from "@/components/competitions/join-button";
import { PendingInviteCard } from "@/components/competitions/pending-invite-card";
import { formatShortDate } from "@/lib/date-utils";

export type CompetitionSummary = {
  id: string;
  title: string;
  description: string | null;
  type: "corrida" | "academia" | "streak" | "hibrido";
  target_value: number;
  start_date: string;
  end_date: string;
  status: "active" | "finished" | "canceled" | null;
  winner_id: string | null;
  competition_participants: { user_id: string }[];
};

export type CompetitionInviteSummary = {
  id: string;
  competition_id: string;
  status: string;
  competition: {
    id: string;
    title: string;
    description: string | null;
    type: "corrida" | "academia" | "streak" | "hibrido";
    target_value: number;
    start_date: string;
    end_date: string;
    competition_participants?: { user_id: string }[];
  } | null;
  inviter: {
    user_id: string;
    username: string | null;
    display_name: string | null;
  } | null;
  invited: {
    user_id: string;
    username: string | null;
    display_name: string | null;
  } | null;
};

type Tab = "received" | "sent" | "active" | "history";

const TABS: {
  key: Tab;
  label: string;
  icon: ElementType;
  emptyMessage: string;
  emptyHint: string;
}[] = [
  {
    key: "received",
    label: "Recebidas",
    icon: Inbox,
    emptyMessage: "Nenhum convite recebido",
    emptyHint: "Convites para competições aparecem aqui.",
  },
  {
    key: "sent",
    label: "Enviadas",
    icon: Send,
    emptyMessage: "Nenhum convite enviado",
    emptyHint: "Convide atletas dentro de uma competição.",
  },
  {
    key: "active",
    label: "Ativas",
    icon: CheckCircle2,
    emptyMessage: "Nenhuma competição ativa",
    emptyHint: "Entre ou crie uma competição em grupo.",
  },
  {
    key: "history",
    label: "Histórico",
    icon: History,
    emptyMessage: "Histórico vazio",
    emptyHint: "Competições encerradas aparecem aqui.",
  },
];

export function CompetitionTabs({
  received,
  sent,
  active,
  history,
  currentUserId,
}: {
  received: CompetitionInviteSummary[];
  sent: CompetitionInviteSummary[];
  active: CompetitionSummary[];
  history: CompetitionSummary[];
  currentUserId: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>(
    received.length > 0 ? "received" : active.length > 0 ? "active" : "active"
  );

  const counts: Record<Tab, number> = {
    received: received.length,
    sent: sent.length,
    active: active.length,
    history: history.length,
  };

  const tab = TABS.find((item) => item.key === activeTab)!;

  return (
    <div>
      <div className="mb-5 flex gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold transition-all duration-150"
              style={
                isActive
                  ? { background: "rgba(182,255,0,0.1)", color: "#B6FF00" }
                  : { color: "rgba(245,245,245,0.35)" }
              }
            >
              <Icon className="size-3.5" strokeWidth={isActive ? 2.2 : 1.8} />
              {label}
              {counts[key] > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[8px] font-black tabular-nums text-[#080808]"
                  style={{ background: isActive ? "#B6FF00" : "rgba(182,255,0,0.55)" }}
                >
                  {counts[key] > 9 ? "9+" : counts[key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === "received" && <InviteList invites={received} emptyTab={tab} />}
      {activeTab === "sent" && <SentInviteList invites={sent} emptyTab={tab} />}
      {activeTab === "active" && <CompetitionList competitions={active} currentUserId={currentUserId} emptyTab={tab} />}
      {activeTab === "history" && <CompetitionList competitions={history} currentUserId={currentUserId} emptyTab={tab} />}
    </div>
  );
}

function InviteList({ invites, emptyTab }: { invites: CompetitionInviteSummary[]; emptyTab: (typeof TABS)[number] }) {
  if (invites.length === 0) return <EmptyState tab={emptyTab} />;

  return (
    <div className="space-y-3">
      {invites.map((invite) => {
        if (!invite.competition) return null;
        return (
          <PendingInviteCard
            key={invite.id}
            inviteId={invite.id}
            competitionId={invite.competition_id}
            competitionTitle={invite.competition.title}
            competitionType={invite.competition.type}
            inviterUsername={invite.inviter?.username ?? null}
            inviterDisplayName={invite.inviter?.display_name ?? null}
            competitionDescription={invite.competition.description}
            targetValue={invite.competition.target_value}
            startDate={invite.competition.start_date}
            endDate={invite.competition.end_date}
            participantCount={invite.competition.competition_participants?.length ?? 0}
            compact
          />
        );
      })}
    </div>
  );
}

function SentInviteList({ invites, emptyTab }: { invites: CompetitionInviteSummary[]; emptyTab: (typeof TABS)[number] }) {
  const router = useRouter();
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  if (invites.length === 0) return <EmptyState tab={emptyTab} />;

  async function cancelInvite(invite: CompetitionInviteSummary) {
    setCancelingId(invite.id);
    setErrorById((current) => ({ ...current, [invite.id]: "" }));

    try {
      const response = await fetch(`/api/competitions/${invite.competition_id}/invites/${invite.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorById((current) => ({
          ...current,
          [invite.id]: data.error ?? "Não foi possível cancelar o convite.",
        }));
        return;
      }

      setHiddenIds((current) => new Set(current).add(invite.id));
      router.refresh();
    } catch {
      setErrorById((current) => ({ ...current, [invite.id]: "Falha de conexão. Tente novamente." }));
    } finally {
      setCancelingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {invites.map((invite) => {
        const competition = invite.competition;
        if (hiddenIds.has(invite.id)) return null;
        if (!competition) return null;
        return (
          <article key={invite.id} className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B6FF00]/60">
                  Convite enviado
                </p>
                <h3 className="mt-1 truncate font-display text-base font-bold">{competition.title}</h3>
                <p className="mt-1 text-xs text-[#F5F5F5]/35">
                  Para {invite.invited?.display_name || invite.invited?.username || "Atleta"}
                </p>
              </div>
              <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase text-[#F5F5F5]/40">
                {getInviteStatusLabel(invite.status)}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href={`/competicoes/${competition.id}`} className="text-xs font-semibold text-[#B6FF00]/70">
                Ver competição
              </Link>
              <button
                type="button"
                onClick={() => cancelInvite(invite)}
                disabled={cancelingId === invite.id}
                className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-red-500/15 bg-red-500/[0.05] px-3 text-xs font-semibold text-red-300/75 transition-all hover:border-red-500/25 hover:bg-red-500/[0.08] disabled:pointer-events-none disabled:opacity-60"
              >
                {cancelingId === invite.id ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                Cancelar convite
              </button>
            </div>
            {errorById[invite.id] && (
              <p className="mt-3 rounded-lg border border-red-500/15 bg-red-500/[0.06] px-3 py-2 text-xs text-red-300/80">
                {errorById[invite.id]}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}

function CompetitionList({
  competitions,
  currentUserId,
  emptyTab,
}: {
  competitions: CompetitionSummary[];
  currentUserId: string;
  emptyTab: (typeof TABS)[number];
}) {
  if (competitions.length === 0) return <EmptyState tab={emptyTab} />;

  return (
    <div className="space-y-3">
      {competitions.map((competition) => (
        <CompetitionCard key={competition.id} competition={competition} currentUserId={currentUserId} />
      ))}
    </div>
  );
}

function EmptyState({ tab }: { tab: (typeof TABS)[number] }) {
  const Icon = tab.icon;
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="grid size-14 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
        <Icon className="size-6 text-[#F5F5F5]/20" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-display text-sm font-bold text-[#F5F5F5]/55">{tab.emptyMessage}</p>
        <p className="mt-1 text-xs text-[#F5F5F5]/28">{tab.emptyHint}</p>
      </div>
    </div>
  );
}

function CompetitionCard({ competition, currentUserId }: { competition: CompetitionSummary; currentUserId: string }) {
  const isJoined = competition.competition_participants.some((p) => p.user_id === currentUserId);
  const status = getStatus(competition);
  const typeLabel = {
    corrida: "Corrida",
    academia: "Musculação",
    streak: "Sequência",
    hibrido: "Híbrido",
  }[competition.type];
  const isWinner = competition.winner_id === currentUserId;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-4">
      {isWinner && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#EAB308]/50 to-transparent" />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-base font-bold">{competition.title}</h3>
            <span className="rounded bg-[#B6FF00]/10 px-2 py-0.5 text-[10px] font-bold text-[#B6FF00]">{typeLabel}</span>
            <span className="rounded bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-[#F5F5F5]/40">{status}</span>
            {isWinner && (
              <span className="inline-flex items-center gap-1 rounded bg-[#EAB308]/15 px-2 py-0.5 text-[10px] font-bold text-[#EAB308]">
                <Crown className="size-3" />
                Campeão
              </span>
            )}
          </div>
          {competition.description && (
            <p className="mt-1 line-clamp-2 text-sm text-[#F5F5F5]/38">{competition.description}</p>
          )}
        </div>
        <JoinButton competitionId={competition.id} initialIsJoined={isJoined} disabled={status !== "Ativa" && status !== "Em breve"} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#F5F5F5]/35">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          {formatShortDate(competition.start_date)} - {formatShortDate(competition.end_date)}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5" />
          {competition.competition_participants.length} participantes
        </span>
        <span className="flex items-center gap-1.5">
          <Trophy className="size-3.5" />
          Meta: {competition.target_value}
        </span>
      </div>
      <Link href={`/competicoes/${competition.id}`} className="mt-4 inline-block text-xs font-semibold text-[#B6FF00]/70">
        Ver ranking e progresso
      </Link>
    </article>
  );
}

function getInviteStatusLabel(status: string) {
  if (status === "pending") return "Pendente";
  if (status === "accepted") return "Aceito";
  if (status === "rejected") return "Recusado";
  if (status === "canceled") return "Cancelado";
  return status;
}

function getStatus(competition: CompetitionSummary) {
  if (competition.status === "finished") return "Encerrada";
  if (competition.status === "canceled") return "Cancelada";
  const now = new Date();
  if (now < new Date(competition.start_date)) return "Em breve";
  if (now > new Date(competition.end_date)) return "Encerrada";
  return "Ativa";
}
