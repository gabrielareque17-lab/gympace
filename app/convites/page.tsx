import Link from "next/link";
import { Bell, Inbox, ShieldCheck, Sparkles, Swords } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PendingInviteCard } from "@/components/competitions/pending-invite-card";
import { AppShell } from "@/components/ui/layout/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Competition = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  target_value: number | null;
  start_date: string | null;
  end_date: string | null;
  competition_participants: { user_id: string }[];
};

type Invite = {
  id: string;
  competition_id: string;
  invited_by: string;
  created_at: string | null;
  competition: Competition | null;
  inviter: {
    user_id: string;
    username: string | null;
    display_name: string | null;
  } | null;
};

export default async function ConvitesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const invites = user ? await getPendingInvites(user.id) : [];
  const totalParticipants = invites.reduce(
    (sum, invite) => sum + (invite.competition?.competition_participants.length ?? 0),
    0
  );

  async function getPendingInvites(userId: string): Promise<Invite[]> {
    const { data: rawInvites } = await supabase
      .from("competition_invites")
      .select("id, competition_id, invited_by, created_at")
      .eq("invited_user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!rawInvites || rawInvites.length === 0) return [];

    const competitionIds = [...new Set(rawInvites.map((invite) => invite.competition_id))];
    const inviterIds = [...new Set(rawInvites.map((invite) => invite.invited_by))];

    const [{ data: competitions }, { data: inviters }] = await Promise.all([
      supabase
        .from("competitions")
        .select("id, title, description, type, target_value, start_date, end_date, competition_participants(user_id)")
        .in("id", competitionIds),
      supabase
        .from("profiles")
        .select("user_id, username, display_name")
        .in("user_id", inviterIds),
    ]);

    return rawInvites
      .map((invite) => ({
        id: invite.id,
        competition_id: invite.competition_id,
        invited_by: invite.invited_by,
        created_at: invite.created_at,
        competition: (competitions?.find((competition) => competition.id === invite.competition_id) as Competition | undefined) ?? null,
        inviter: inviters?.find((profile) => profile.user_id === invite.invited_by) ?? null,
      }))
      .filter((invite) => invite.competition !== null);
  }

  return (
    <AppShell>
      <main className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        <div className="max-w-5xl">
          <header className="mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#B6FF00]/15 bg-[#B6FF00]/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/70">
              <Bell className="size-3" strokeWidth={2.2} />
              Convites sociais
            </div>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Arena de convites
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#F5F5F5]/42">
                  Aceite desafios para entrar automaticamente nas competições e aparecer no ranking sem etapas extras.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Metric label="Pendentes" value={String(invites.length)} icon={Inbox} accent="#B6FF00" />
                <Metric label="Atletas" value={String(totalParticipants)} icon={Swords} accent="#60A5FA" />
                <Metric label="Entrada" value="Auto" icon={ShieldCheck} accent="#A78BFA" />
              </div>
            </div>
          </header>

          {!user ? (
            <EmptyState
              title="Entre para ver seus convites"
              description="Os convites ficam ligados à sua conta e aparecem aqui assim que outro atleta chamar você para competir."
              actionHref="/login?redirectTo=/convites"
              actionLabel="Entrar"
            />
          ) : invites.length === 0 ? (
            <EmptyState
              title="Nenhum convite pendente"
              description="Quando alguém desafiar você, o card aparece aqui com aceite direto, rejeição rápida e atualização automática do ranking."
              actionHref="/competicoes"
              actionLabel="Ver competições"
            />
          ) : (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="size-4 text-[#B6FF00]/70" strokeWidth={2} />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5F5F5]/45">
                  Prontos para resposta
                </h2>
                <div className="h-px flex-1 bg-white/[0.05]" />
              </div>

              <div className="grid gap-4">
                {invites.map((invite) => (
                  <PendingInviteCard
                    key={invite.id}
                    inviteId={invite.id}
                    competitionId={invite.competition_id}
                    competitionTitle={invite.competition!.title}
                    competitionType={invite.competition!.type}
                    competitionDescription={invite.competition!.description}
                    targetValue={invite.competition!.target_value}
                    startDate={invite.competition!.start_date}
                    endDate={invite.competition!.end_date}
                    participantCount={invite.competition!.competition_participants.length}
                    createdAt={invite.created_at}
                    inviterUsername={invite.inviter?.username ?? null}
                    inviterDisplayName={invite.inviter?.display_name ?? null}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/[0.06] bg-[#111111] px-3 py-2.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className="size-3.5 shrink-0" style={{ color: accent }} strokeWidth={2} />
        <p className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-[#F5F5F5]/28">
          {label}
        </p>
      </div>
      <p className="font-display text-lg font-bold tabular-nums" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] px-6 py-12 text-center">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B6FF00]/35 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-0 size-56 -translate-x-1/2 rounded-full bg-[#B6FF00]/[0.04] blur-[80px]" />
      <div className="relative mx-auto flex max-w-sm flex-col items-center gap-5">
        <div className="grid size-16 place-items-center rounded-2xl border border-[#B6FF00]/15 bg-[#B6FF00]/[0.06] text-[#B6FF00] shadow-[0_0_30px_rgba(182,255,0,0.08)]">
          <Inbox className="size-7" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-[#F5F5F5]/82">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#F5F5F5]/38">{description}</p>
        </div>
        <Link
          href={actionHref}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[#B6FF00] px-4 text-sm font-bold text-[#080808] shadow-[0_0_20px_rgba(182,255,0,0.16)] transition-all hover:-translate-y-px hover:shadow-[0_0_28px_rgba(182,255,0,0.25)]"
        >
          {actionLabel}
        </Link>
      </div>
    </section>
  );
}
