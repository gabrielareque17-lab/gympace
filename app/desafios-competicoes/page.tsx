import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Swords, Trophy } from "lucide-react";
import type { ComponentType } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { ChallengeTabs } from "@/components/challenges/challenge-tabs";
import {
  CompetitionTabs,
  type CompetitionInviteSummary,
  type CompetitionSummary,
} from "@/components/competitions/competition-tabs";
import { AppShell } from "@/components/ui/layout/app-shell";
import type { ChallengeProfile, ChallengeRow } from "@/lib/challenge-progress";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type InviteRow = {
  id: string;
  competition_id: string;
  invited_by?: string;
  invited_user_id?: string;
  status: string;
};

export default async function DesafiosCompeticoesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [challengesRes, competitionsRes, receivedInvitesRes, sentInvitesRes] = await Promise.all([
    supabase
      .from("challenges")
      .select("*")
      .or(`creator_id.eq.${user.id},challenged_id.eq.${user.id}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("competitions")
      .select("id,title,description,type,target_value,start_date,end_date,status,winner_id,competition_participants(user_id)")
      .order("end_date", { ascending: true }),
    supabase
      .from("competition_invites")
      .select("id, competition_id, invited_by, status")
      .eq("invited_user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("competition_invites")
      .select("id, competition_id, invited_user_id, status")
      .eq("invited_by", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const challenges = (challengesRes.data ?? []) as ChallengeRow[];
  const challengeUserIds = [
    ...new Set([
      ...challenges.map((challenge) => challenge.creator_id),
      ...challenges.map((challenge) => challenge.challenged_id),
    ]),
  ];

  const { data: profilesData } = challengeUserIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_id")
        .in("user_id", challengeUserIds)
    : { data: [] };

  const profileMap = Object.fromEntries(
    (profilesData ?? []).map((profile) => [profile.user_id, profile as ChallengeProfile])
  );
  const getProfile = (userId: string): ChallengeProfile =>
    profileMap[userId] ?? { user_id: userId, username: null, display_name: null, avatar_id: null };
  const mapChallenge = (challenge: ChallengeRow) => ({
    challenge,
    creator: getProfile(challenge.creator_id),
    challenged: getProfile(challenge.challenged_id),
  });

  const received = challenges
    .filter((challenge) => challenge.challenged_id === user.id && challenge.status === "pending")
    .map(mapChallenge);
  const sent = challenges
    .filter((challenge) => challenge.creator_id === user.id && challenge.status === "pending")
    .map(mapChallenge);
  const active = challenges.filter((challenge) => challenge.status === "active").map(mapChallenge);
  const history = challenges
    .filter((challenge) => ["finished", "declined", "canceled"].includes(challenge.status))
    .map(mapChallenge);

  const competitions = (competitionsRes.data ?? []) as unknown as CompetitionSummary[];
  const receivedCompetitionInvites = await hydrateCompetitionInvites(
    supabase,
    (receivedInvitesRes.data ?? []) as InviteRow[],
    "received"
  );
  const sentCompetitionInvites = await hydrateCompetitionInvites(
    supabase,
    (sentInvitesRes.data ?? []) as InviteRow[],
    "sent"
  );

  const activeCompetitions = competitions.filter((competition) => {
    const joined = competition.competition_participants.some((participant) => participant.user_id === user.id);
    if (!joined) return false;
    if (competition.status === "finished" || competition.status === "canceled") return false;
    return new Date(competition.end_date) >= new Date();
  });
  const competitionHistory = competitions.filter((competition) => {
    const joined = competition.competition_participants.some((participant) => participant.user_id === user.id);
    if (!joined && competition.winner_id !== user.id) return false;
    return (
      competition.status === "finished" ||
      competition.status === "canceled" ||
      new Date(competition.end_date) < new Date()
    );
  });

  return (
    <AppShell>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <header className="mb-7">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
            Competitivo
          </p>
          <h1
            className="leading-none text-white"
            style={{ fontFamily: "var(--font-hero)", fontSize: "clamp(2rem, 4vw, 2.75rem)", letterSpacing: "0.04em" }}
          >Competitivo</h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[#F5F5F5]/40">
            Duelos 1x1 e competições em grupo, cada um com seus dados e regras preservados.
          </p>
        </header>

        <div className="grid max-w-6xl gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section>
            <SectionHeader icon={Swords} title="Duelo 1x1" actionHref="/desafios/novo" actionLabel="Criar desafio" />
            <ChallengeTabs received={received} sent={sent} active={active} history={history} currentUserId={user.id} />
          </section>

          <section>
            <SectionHeader
              icon={Trophy}
              title="Competições em grupo"
              actionHref="/competicoes/criar"
              actionLabel="Criar competição"
            />
            <CompetitionTabs
              received={receivedCompetitionInvites}
              sent={sentCompetitionInvites}
              active={activeCompetitions}
              history={competitionHistory}
              currentUserId={user.id}
            />
          </section>
        </div>
      </main>
    </AppShell>
  );
}

async function hydrateCompetitionInvites(
  supabase: SupabaseClient,
  invites: InviteRow[],
  direction: "received" | "sent"
): Promise<CompetitionInviteSummary[]> {
  if (invites.length === 0) return [];

  const competitionIds = [...new Set(invites.map((invite) => invite.competition_id))];
  const userIds = [
    ...new Set(
      invites
        .map((invite) => (direction === "received" ? invite.invited_by : invite.invited_user_id))
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const [{ data: competitions }, { data: profiles }] = await Promise.all([
    supabase
      .from("competitions")
      .select("id,title,description,type,target_value,start_date,end_date,competition_participants(user_id)")
      .in("id", competitionIds),
    userIds.length
      ? supabase.from("profiles").select("user_id, username, display_name").in("user_id", userIds)
      : Promise.resolve({ data: [] }),
  ]);

  return invites
    .map((invite) => {
      const profile = (profiles ?? []).find(
        (item) => item.user_id === (direction === "received" ? invite.invited_by : invite.invited_user_id)
      );

      return {
        id: invite.id,
        competition_id: invite.competition_id,
        status: invite.status,
        competition:
          ((competitions ?? []).find((competition) => competition.id === invite.competition_id) as CompetitionInviteSummary["competition"]) ??
          null,
        inviter: direction === "received" ? profile ?? null : null,
        invited: direction === "sent" ? profile ?? null : null,
      };
    })
    .filter((invite): invite is CompetitionInviteSummary => Boolean(invite.competition));
}

function SectionHeader({
  icon: Icon,
  title,
  actionHref,
  actionLabel,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 leading-none text-white" style={{ fontFamily: "var(--font-hero)", fontSize: "1.35rem", letterSpacing: "0.04em" }}>
        <Icon className="size-5 text-[#B6FF00]" strokeWidth={2} />
        {title}
      </h2>
      <Link
        href={actionHref}
        className="inline-flex items-center gap-1 rounded-xl border border-[#B6FF00]/20 bg-[#B6FF00]/[0.07] px-3 py-1.5 text-xs font-bold text-[#B6FF00]"
      >
        <Plus className="size-3.5" />
        {actionLabel}
      </Link>
    </div>
  );
}
