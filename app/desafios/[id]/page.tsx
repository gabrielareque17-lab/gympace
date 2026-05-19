import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, CalendarDays, Trophy, Zap } from "lucide-react";

import { AppShell } from "@/components/ui/layout/app-shell";
import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { ChallengeRespondButtons } from "@/components/challenges/challenge-respond-buttons";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  getChallengeProgress,
  GOAL_CONFIG,
  STATUS_CONFIG,
  daysLeft,
  formatProgress,
  type ChallengeRow,
  type ChallengeProfile,
} from "@/lib/challenge-progress";
import { formatShortDate } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function displayName(p: ChallengeProfile) {
  return p.display_name || p.username || "Atleta";
}
function initials(p: ChallengeProfile) {
  return (displayName(p)[0] ?? "?").toUpperCase();
}

export default async function DesafioDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch challenge
  const { data: rawChallenge } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .single();

  if (!rawChallenge) notFound();
  const challenge = rawChallenge as ChallengeRow;

  // Authorization: only participants can view
  if (challenge.creator_id !== user.id && challenge.challenged_id !== user.id) {
    notFound();
  }

  // Fetch profiles
  const adminSupabase = createSupabaseAdminClient();
  const { data: profilesData } = await adminSupabase
    .from("profiles")
    .select("user_id, username, display_name, avatar_id")
    .in("user_id", [challenge.creator_id, challenge.challenged_id]);

  const profileMap = Object.fromEntries(
    (profilesData ?? []).map((p) => [p.user_id, p as ChallengeProfile])
  );

  const creator: ChallengeProfile = profileMap[challenge.creator_id] ?? {
    user_id: challenge.creator_id,
    username: null,
    display_name: null,
    avatar_id: null,
  };

  const challenged: ChallengeProfile = profileMap[challenge.challenged_id] ?? {
    user_id: challenge.challenged_id,
    username: null,
    display_name: null,
    avatar_id: null,
  };

  // Calculate progress for active/finished challenges
  let creatorProgress = 0;
  let challengedProgress = 0;

  if (
    (challenge.status === "active" || challenge.status === "finished") &&
    challenge.start_date &&
    challenge.end_date
  ) {
    [creatorProgress, challengedProgress] = await Promise.all([
      getChallengeProgress(
        adminSupabase,
        challenge.creator_id,
        challenge.goal_type,
        challenge.start_date,
        challenge.end_date
      ),
      getChallengeProgress(
        adminSupabase,
        challenge.challenged_id,
        challenge.goal_type,
        challenge.start_date,
        challenge.end_date
      ),
    ]);
  }

  const target = Number(challenge.target_value);
  const creatorPct = Math.min(100, Math.round((creatorProgress / target) * 100));
  const challengedPct = Math.min(100, Math.round((challengedProgress / target) * 100));

  const goalCfg = GOAL_CONFIG[challenge.goal_type];
  const statusCfg = STATUS_CONFIG[challenge.status];

  const isCreator = challenge.creator_id === user.id;
  const isChallenged = challenge.challenged_id === user.id;
  const isActive = challenge.status === "active";
  const isFinished = challenge.status === "finished";

  const days = challenge.end_date ? daysLeft(challenge.end_date) : null;

  const creatorWon = isFinished && challenge.winner_id === challenge.creator_id;
  const challengedWon = isFinished && challenge.winner_id === challenge.challenged_id;

  // Determine winner by progress if finished and no winner_id set
  const autoCreatorWon =
    isFinished && !challenge.winner_id && creatorProgress > challengedProgress;
  const autoChallengWon =
    isFinished && !challenge.winner_id && challengedProgress > creatorProgress;

  const creatorIsWinner = creatorWon || autoCreatorWon;
  const challengedIsWinner = challengedWon || autoChallengWon;

  return (
    <AppShell>
      <div className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        {/* ── Nav ── */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/desafios"
            className="grid size-9 place-items-center rounded-xl text-[#F5F5F5]/40 transition-all duration-150 hover:bg-white/[0.05] hover:text-[#F5F5F5]/70 active:scale-90"
          >
            <ArrowLeft className="size-4" strokeWidth={2} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/55">
              Desafio 1×1
            </p>
            <h1 className="truncate font-display text-lg font-bold tracking-tight">
              {challenge.title}
            </h1>
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.1em]"
            style={{ color: statusCfg.color, background: statusCfg.bg }}
          >
            {statusCfg.label}
          </span>
        </div>

        <div className="max-w-lg space-y-4">
          {/* ── VS Hero ── */}
          <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />

            {/* Ambient glows */}
            {isActive && (
              <>
                <div
                  className="pointer-events-none absolute -left-10 -top-10 size-48 rounded-full blur-[80px]"
                  style={{ background: "#B6FF00" + "0C" }}
                />
                <div
                  className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full blur-[80px]"
                  style={{ background: "#22D3EE" + "0C" }}
                />
              </>
            )}

            <div className="relative p-6">
              {/* ── Players row ── */}
              <div className="mb-6 flex items-start">
                {/* Creator */}
                <div className="flex flex-1 flex-col items-center gap-2 text-center">
                  <div className="relative">
                    <AvatarDisplay
                      avatarId={creator.avatar_id}
                      initials={initials(creator)}
                      size="md"
                    />
                    {creatorIsWinner && (
                      <div
                        className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full"
                        style={{ background: "#B6FF00" }}
                      >
                        <Trophy className="size-3 text-[#080808]" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#F5F5F5]/85">
                      {displayName(creator)}
                    </p>
                    {creator.username && (
                      <p className="text-[10px] text-[#F5F5F5]/30">
                        @{creator.username}
                      </p>
                    )}
                    {isCreator && (
                      <span className="mt-1 inline-block rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-[#F5F5F5]/35">
                        Você
                      </span>
                    )}
                  </div>
                </div>

                {/* VS center */}
                <div className="flex flex-col items-center justify-center px-4 pt-4">
                  <div
                    className="rounded-xl px-3 py-1.5 text-sm font-black tracking-widest"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: "rgba(245,245,245,0.35)",
                      boxShadow: "0 0 20px rgba(182,255,0,0.06)",
                    }}
                  >
                    VS
                  </div>
                </div>

                {/* Challenged */}
                <div className="flex flex-1 flex-col items-center gap-2 text-center">
                  <div className="relative">
                    <AvatarDisplay
                      avatarId={challenged.avatar_id}
                      initials={initials(challenged)}
                      size="md"
                    />
                    {challengedIsWinner && (
                      <div
                        className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full"
                        style={{ background: "#22D3EE" }}
                      >
                        <Trophy className="size-3 text-[#080808]" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#F5F5F5]/85">
                      {displayName(challenged)}
                    </p>
                    {challenged.username && (
                      <p className="text-[10px] text-[#F5F5F5]/30">
                        @{challenged.username}
                      </p>
                    )}
                    {isChallenged && (
                      <span className="mt-1 inline-block rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-[#F5F5F5]/35">
                        Você
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Progress visualization ── */}
              {(isActive || isFinished) && (
                <div className="space-y-3">
                  {/* Percentages */}
                  <div className="flex items-end justify-between text-[11px] font-bold">
                    <span style={{ color: "#B6FF00" }}>
                      {formatProgress(creatorProgress, challenge.goal_type)}
                    </span>
                    <span className="text-[#F5F5F5]/30 text-[9.5px] font-semibold">
                      de {formatProgress(target, challenge.goal_type)}
                    </span>
                    <span style={{ color: "#22D3EE" }}>
                      {formatProgress(challengedProgress, challenge.goal_type)}
                    </span>
                  </div>

                  {/* Duel bar: creator fills from left, challenged from right */}
                  <div className="relative h-4 overflow-hidden rounded-full bg-white/[0.06]">
                    {/* Creator — fills from left */}
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(creatorPct / 100) * 50}%`,
                        background: "#B6FF00",
                        boxShadow: "0 0 10px rgba(182,255,0,0.55)",
                      }}
                    />
                    {/* Challenged — fills from right */}
                    <div
                      className="absolute right-0 top-0 h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(challengedPct / 100) * 50}%`,
                        background: "#22D3EE",
                        boxShadow: "0 0 10px rgba(34,211,238,0.55)",
                      }}
                    />
                    {/* Center divider */}
                    <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-[#0A0A0A]" />
                  </div>

                  {/* Pct labels */}
                  <div className="flex justify-between text-[10px] font-semibold text-[#F5F5F5]/35">
                    <span style={{ color: "#B6FF00" + "AA" }}>{creatorPct}%</span>
                    <span style={{ color: "#22D3EE" + "AA" }}>{challengedPct}%</span>
                  </div>
                </div>
              )}

              {/* Pending state */}
              {challenge.status === "pending" && (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] py-3">
                  <div className="size-1.5 animate-pulse rounded-full bg-[#EAB308]" />
                  <span className="text-[12px] font-semibold text-[#F5F5F5]/40">
                    Aguardando resposta de {displayName(challenged)}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* ── Details ── */}
          <section className="rounded-2xl border border-white/[0.06] bg-[#111111]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

            <div className="divide-y divide-white/[0.04] px-5 py-1">
              {/* Goal */}
              <div className="flex items-center gap-3 py-3.5">
                <Zap
                  className="size-4 shrink-0"
                  style={{ color: goalCfg.color }}
                  strokeWidth={2}
                />
                <div>
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#F5F5F5]/28">
                    Modalidade
                  </p>
                  <p className="text-sm font-semibold text-[#F5F5F5]/80">
                    {goalCfg.label} — {target} {goalCfg.unit}
                  </p>
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-3 py-3.5">
                <CalendarDays
                  className="size-4 shrink-0 text-[#F5F5F5]/30"
                  strokeWidth={1.8}
                />
                <div>
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#F5F5F5]/28">
                    Período
                  </p>
                  <p className="text-sm font-semibold text-[#F5F5F5]/80">
                    {challenge.start_date
                      ? `${formatShortDate(challenge.start_date)} – ${formatShortDate(challenge.end_date!)}`
                      : `${challenge.duration_days} dias`}
                  </p>
                </div>
              </div>

              {/* Time remaining */}
              {isActive && days !== null && (
                <div className="flex items-center gap-3 py-3.5">
                  <Clock
                    className="size-4 shrink-0"
                    style={{ color: days <= 2 ? "#FB923C" : goalCfg.color }}
                    strokeWidth={1.8}
                  />
                  <div>
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#F5F5F5]/28">
                      Tempo restante
                    </p>
                    <p
                      className="text-sm font-bold"
                      style={{ color: days <= 2 ? "#FB923C" : goalCfg.color }}
                    >
                      {days === 0
                        ? "Encerra hoje"
                        : `${days} ${days === 1 ? "dia" : "dias"}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              {challenge.description && (
                <div className="py-3.5">
                  <p className="mb-1 text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#F5F5F5]/28">
                    Descrição
                  </p>
                  <p className="text-sm leading-relaxed text-[#F5F5F5]/55">
                    {challenge.description}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── Actions ── */}
          <ChallengeRespondButtons
            challengeId={challenge.id}
            isCreator={isCreator}
            isChallenged={isChallenged}
            status={challenge.status}
          />
        </div>
      </div>
    </AppShell>
  );
}
