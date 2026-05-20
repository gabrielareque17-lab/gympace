import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, CalendarDays, Plus, Swords, Trophy, Users } from "lucide-react";

import { ChallengeTabs } from "@/components/challenges/challenge-tabs";
import { JoinButton } from "@/components/competitions/join-button";
import { PendingInviteCard } from "@/components/competitions/pending-invite-card";
import { AppShell } from "@/components/ui/layout/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { formatShortDate } from "@/lib/date-utils";
import type { ChallengeProfile, ChallengeRow } from "@/lib/challenge-progress";

export const dynamic = "force-dynamic";

type Competition = {
  id: string;
  title: string;
  description: string | null;
  type: "corrida" | "academia" | "streak" | "hibrido";
  target_value: number;
  start_date: string;
  end_date: string;
  competition_participants: { user_id: string }[];
};

function getStatus(start: string, end: string) {
  const now = new Date();
  if (now < new Date(start)) return "Em breve";
  if (now > new Date(end)) return "Encerrada";
  return "Ativa";
}

export default async function DesafiosCompeticoesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [challengesRes, competitionsRes, invitesRes] = await Promise.all([
    supabase
      .from("challenges")
      .select("*")
      .or(`creator_id.eq.${user.id},challenged_id.eq.${user.id}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("competitions")
      .select("id,title,description,type,target_value,start_date,end_date,competition_participants(user_id)")
      .order("end_date", { ascending: true }),
    supabase
      .from("competition_invites")
      .select("id, competition_id, invited_by")
      .eq("invited_user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const challenges = (challengesRes.data ?? []) as ChallengeRow[];
  const challengeUserIds = [
    ...new Set([
      ...challenges.map((c) => c.creator_id),
      ...challenges.map((c) => c.challenged_id),
    ]),
  ];

  const { data: profilesData } = challengeUserIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_id")
        .in("user_id", challengeUserIds)
    : { data: [] };

  const profileMap = Object.fromEntries(
    (profilesData ?? []).map((p) => [p.user_id, p as ChallengeProfile])
  );
  const getProfile = (userId: string): ChallengeProfile =>
    profileMap[userId] ?? { user_id: userId, username: null, display_name: null, avatar_id: null };
  const mapChallenge = (c: ChallengeRow) => ({
    challenge: c,
    creator: getProfile(c.creator_id),
    challenged: getProfile(c.challenged_id),
  });

  const received = challenges.filter((c) => c.challenged_id === user.id && c.status === "pending").map(mapChallenge);
  const sent = challenges.filter((c) => c.creator_id === user.id && c.status === "pending").map(mapChallenge);
  const active = challenges.filter((c) => c.status === "active").map(mapChallenge);
  const history = challenges.filter((c) => ["finished", "declined", "canceled"].includes(c.status)).map(mapChallenge);

  const competitions = (competitionsRes.data ?? []) as unknown as Competition[];

  const rawInvites = invitesRes.data ?? [];
  const pendingInvites = rawInvites.length
    ? await (async () => {
        const compIds = [...new Set(rawInvites.map((i) => i.competition_id))];
        const inviterIds = [...new Set(rawInvites.map((i) => i.invited_by))];
        const [{ data: comps }, { data: inviters }] = await Promise.all([
          supabase.from("competitions").select("id, title, type").in("id", compIds),
          supabase.from("profiles").select("user_id, username, display_name").in("user_id", inviterIds),
        ]);
        return rawInvites.map((inv) => ({
          id: inv.id,
          competition_id: inv.competition_id,
          competition: comps?.find((c) => c.id === inv.competition_id) ?? null,
          inviter: inviters?.find((p) => p.user_id === inv.invited_by) ?? null,
        })).filter((i) => i.competition);
      })()
    : [];

  return (
    <AppShell>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <header className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
              Competitivo
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight">Desafios & Competições</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#F5F5F5]/40">
              Duelos 1x1 e competições em grupo, cada um com seus dados e regras preservados.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href="/desafios/novo" className="rounded-xl bg-[#B6FF00] px-3 py-2 text-xs font-bold text-[#080808]">
              Desafio
            </Link>
            <Link href="/competicoes/criar" className="rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-bold text-[#F5F5F5]/70">
              Competição
            </Link>
          </div>
        </header>

        <div className="grid max-w-6xl gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section>
            <SectionHeader icon={Swords} title="Desafios 1x1" actionHref="/desafios/novo" actionLabel="Criar desafio" />
            <ChallengeTabs received={received} sent={sent} active={active} history={history} currentUserId={user.id} />
          </section>

          <section>
            <SectionHeader icon={Trophy} title="Competições em grupo" actionHref="/competicoes/criar" actionLabel="Criar competição" />
            {pendingInvites.length > 0 && (
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#B6FF00]/60">
                  <Bell className="size-3.5" />
                  Convites pendentes
                </div>
                {pendingInvites.map((inv) => (
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
            )}
            <div className="space-y-3">
              {competitions.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.07] bg-[#111111] px-5 py-10 text-center text-sm text-[#F5F5F5]/30">
                  Nenhuma competição criada ainda.
                </div>
              ) : (
                competitions.map((competition) => (
                  <CompetitionCard key={competition.id} competition={competition} currentUserId={user.id} />
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  actionHref,
  actionLabel,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <Icon className="size-5 text-[#B6FF00]" strokeWidth={2} />
        {title}
      </h2>
      <Link href={actionHref} className="inline-flex items-center gap-1 rounded-xl border border-[#B6FF00]/20 bg-[#B6FF00]/[0.07] px-3 py-1.5 text-xs font-bold text-[#B6FF00]">
        <Plus className="size-3.5" />
        {actionLabel}
      </Link>
    </div>
  );
}

function CompetitionCard({ competition, currentUserId }: { competition: Competition; currentUserId: string }) {
  const isJoined = competition.competition_participants.some((p) => p.user_id === currentUserId);
  const status = getStatus(competition.start_date, competition.end_date);
  const typeLabel = {
    corrida: "Corrida",
    academia: "Musculação",
    streak: "Sequência",
    hibrido: "Híbrido",
  }[competition.type];

  return (
    <article className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-base font-bold">{competition.title}</h3>
            <span className="rounded bg-[#B6FF00]/10 px-2 py-0.5 text-[10px] font-bold text-[#B6FF00]">{typeLabel}</span>
            <span className="rounded bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-[#F5F5F5]/40">{status}</span>
          </div>
          {competition.description && (
            <p className="mt-1 line-clamp-2 text-sm text-[#F5F5F5]/38">{competition.description}</p>
          )}
        </div>
        <JoinButton competitionId={competition.id} initialIsJoined={isJoined} disabled={status === "Encerrada"} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#F5F5F5]/35">
        <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />{formatShortDate(competition.start_date)} - {formatShortDate(competition.end_date)}</span>
        <span className="flex items-center gap-1.5"><Users className="size-3.5" />{competition.competition_participants.length} participantes</span>
        <span>Meta: {competition.target_value}</span>
      </div>
      <Link href={`/competicoes/${competition.id}`} className="mt-4 inline-block text-xs font-semibold text-[#B6FF00]/70">
        Ver ranking e progresso
      </Link>
    </article>
  );
}
