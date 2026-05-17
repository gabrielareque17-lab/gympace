import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Dumbbell,
  Flame,
  Medal,
  Route,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AppShell } from "@/components/ui/layout/app-shell";
import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { JoinButton } from "@/components/competitions/join-button";
import { InviteButton } from "@/components/competitions/invite-button";
import { InviteBanner } from "@/components/competitions/invite-banner";
import { ProgressUpdater } from "@/components/competitions/progress-updater";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getAvatarById } from "@/lib/avatar-registry";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };
type CompType = "corrida" | "academia" | "streak" | "hibrido";

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<CompType, { label: string; icon: LucideIcon; color: string; unit: string }> = {
  corrida:  { label: "Corrida",   icon: Route,    color: "#B6FF00", unit: "km" },
  academia: { label: "Academia",  icon: Dumbbell, color: "#60A5FA", unit: "sessões" },
  streak:   { label: "Sequência", icon: Flame,    color: "#FB923C", unit: "dias" },
  hibrido:  { label: "Híbrido",   icon: Zap,      color: "#A78BFA", unit: "pts" },
};

const RANK_MEDALS = {
  1: { color: "#EAB308", glow: "rgba(234,179,8,0.35)", label: "Ouro" },
  2: { color: "#A1A1AA", glow: "rgba(161,161,170,0.25)", label: "Prata" },
  3: { color: "#CD7F32", glow: "rgba(205,127,50,0.25)", label: "Bronze" },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatus(start: string, end: string): "active" | "upcoming" | "ended" {
  const now = new Date();
  if (now < new Date(start)) return "upcoming";
  if (now > new Date(end)) return "ended";
  return "active";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysLeft(end: string) {
  return Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CompetitionDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: competition } = await supabase
    .from("competitions")
    .select("id, title, description, type, target_value, start_date, end_date, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!competition) notFound();

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // Pending invite for the current user in this competition
  const { data: myInvite } = currentUser
    ? await supabase
        .from("competition_invites")
        .select("id, invited_by")
        .eq("competition_id", id)
        .eq("invited_user_id", currentUser.id)
        .eq("status", "pending")
        .maybeSingle()
    : { data: null };

  const { data: inviterProfile } = myInvite
    ? await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("user_id", myInvite.invited_by)
        .maybeSingle()
    : { data: null };

  const { data: rawParticipants } = await supabase
    .from("competition_participants")
    .select("user_id, progress, joined_at")
    .eq("competition_id", id)
    .order("progress", { ascending: false });

  const participants = rawParticipants ?? [];
  const userIds = participants.map(p => p.user_id);

  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_id, avatar_type")
        .in("user_id", userIds)
    : { data: [] };

  type LeaderboardEntry = {
    user_id: string;
    progress: number;
    joined_at: string;
    username: string | null;
    display_name: string | null;
    avatar_id: string | null;
    avatar_type: string | null;
  };

  const leaderboard: LeaderboardEntry[] = participants.map(p => {
    const prof = profiles?.find(pr => pr.user_id === p.user_id);
    return {
      user_id: p.user_id,
      progress: Number(p.progress ?? 0),
      joined_at: p.joined_at,
      username: prof?.username ?? null,
      display_name: prof?.display_name ?? null,
      avatar_id: prof?.avatar_id ?? null,
      avatar_type: prof?.avatar_type ?? null,
    };
  });

  // Auto-compute corrida progress from runs within competition window
  if (competition.type === "corrida" && userIds.length > 0) {
    const { data: runs } = await supabase
      .from("runs")
      .select("user_id, distance")
      .in("user_id", userIds)
      .gte("created_at", competition.start_date)
      .lte("created_at", competition.end_date);

    if (runs && runs.length > 0) {
      const runsByUser: Record<string, number> = {};
      for (const r of runs) {
        runsByUser[r.user_id] = (runsByUser[r.user_id] ?? 0) + Number(r.distance ?? 0);
      }
      for (const entry of leaderboard) {
        entry.progress = Math.round((runsByUser[entry.user_id] ?? 0) * 10) / 10;
      }
      leaderboard.sort((a, b) => b.progress - a.progress);
    }
  }

  const cfg = TYPE_CONFIG[competition.type as CompType] ?? TYPE_CONFIG.corrida;
  const TypeIcon = cfg.icon;
  const status = getStatus(competition.start_date, competition.end_date);
  const ended = status === "ended";
  const isJoined = currentUser ? participants.some(p => p.user_id === currentUser.id) : false;
  const myEntry = leaderboard.find(e => e.user_id === currentUser?.id);
  const myRank = myEntry ? leaderboard.indexOf(myEntry) + 1 : null;
  const days = ended ? null : daysLeft(competition.end_date);
  const target = Number(competition.target_value);
  const isCorrida = competition.type === "corrida";

  const podium = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

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

        <div className="max-w-3xl space-y-4">
          {/* ── Invite banner ── */}
          {myInvite && !isJoined && (
            <InviteBanner
              inviteId={myInvite.id}
              competitionId={competition.id}
              inviterUsername={inviterProfile?.username ?? null}
              inviterDisplayName={inviterProfile?.display_name ?? null}
              competitionColor={cfg.color}
            />
          )}

          {/* ── Hero ── */}
          <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
            <div
              className="pointer-events-none absolute -left-8 -top-8 size-56 rounded-full blur-[80px]"
              style={{ background: cfg.color + "14" }}
            />

            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className="mt-0.5 grid size-12 shrink-0 place-items-center rounded-2xl"
                    style={{ background: cfg.color + "18", color: cfg.color, boxShadow: `0 0 20px ${cfg.color}20` }}
                  >
                    <TypeIcon className="size-6" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-display text-2xl font-bold tracking-tight">
                        {competition.title}
                      </h1>
                      <span
                        className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                        style={{ borderColor: cfg.color + "40", color: cfg.color, background: cfg.color + "0F" }}
                      >
                        {cfg.label}
                      </span>
                      {status === "active" && (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-400">
                          Ativa
                        </span>
                      )}
                      {status === "upcoming" && (
                        <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-400">
                          Em breve
                        </span>
                      )}
                      {ended && (
                        <span className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#F5F5F5]/30">
                          Encerrada
                        </span>
                      )}
                    </div>
                    {competition.description && (
                      <p className="mt-2 text-sm leading-relaxed text-[#F5F5F5]/45">
                        {competition.description}
                      </p>
                    )}
                  </div>
                </div>

                {currentUser && (
                  <div className="flex shrink-0 items-center gap-2">
                    {isJoined && !ended && (
                      <InviteButton competitionId={competition.id} />
                    )}
                    <JoinButton
                      competitionId={competition.id}
                      initialIsJoined={isJoined}
                      disabled={ended}
                    />
                  </div>
                )}
              </div>

              {/* Meta grid */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetaTile label="Início" value={fmtDate(competition.start_date)} />
                <MetaTile label="Término" value={fmtDate(competition.end_date)} />
                <MetaTile label="Meta" value={`${target} ${cfg.unit}`} accent={cfg.color} />
                <MetaTile
                  label={ended ? "Participantes" : days !== null && days >= 0 ? "Prazo" : "Participantes"}
                  value={
                    ended
                      ? `${participants.length}`
                      : days !== null && days >= 0
                      ? days === 0 ? "Hoje" : `${days} ${days === 1 ? "dia" : "dias"}`
                      : `${participants.length}`
                  }
                  accent={days !== null && days <= 3 && !ended ? "#FB923C" : undefined}
                />
              </div>

              {/* Own progress (if joined) */}
              {isJoined && myEntry !== undefined && (
                <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="mb-2.5 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#F5F5F5]/40">
                      Seu progresso
                    </p>
                    <div className="flex items-center gap-2">
                      {myRank !== null && (
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                          style={{
                            background: (RANK_MEDALS[myRank as keyof typeof RANK_MEDALS]?.color ?? cfg.color) + "18",
                            color: RANK_MEDALS[myRank as keyof typeof RANK_MEDALS]?.color ?? cfg.color,
                          }}
                        >
                          {myRank}º lugar
                        </span>
                      )}
                      <span className="font-display text-xl font-bold tabular-nums" style={{ color: cfg.color }}>
                        {myEntry.progress}
                      </span>
                      <span className="text-xs font-semibold text-[#F5F5F5]/40">{cfg.unit}</span>
                    </div>
                  </div>
                  <div className="h-[6px] overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: target > 0 ? `${Math.min((myEntry.progress / target) * 100, 100)}%` : "0%",
                        background: cfg.color,
                        boxShadow: `0 0 10px ${cfg.color}55`,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[10px] text-[#F5F5F5]/25">
                      {target > 0
                        ? `${Math.max(target - myEntry.progress, 0)} ${cfg.unit} para a meta`
                        : "Progresso em andamento"}
                    </p>
                    {target > 0 && (
                      <p className="text-[10px] font-bold tabular-nums" style={{ color: cfg.color + "AA" }}>
                        {Math.min(Math.round((myEntry.progress / target) * 100), 100)}%
                      </p>
                    )}
                  </div>

                  {!isCorrida && !ended && (
                    <ProgressUpdater
                      competitionId={competition.id}
                      currentProgress={myEntry.progress}
                      unit={cfg.unit}
                      color={cfg.color}
                    />
                  )}
                  {isCorrida && (
                    <p className="mt-2.5 text-[10px] text-[#F5F5F5]/22">
                      Progresso calculado automaticamente das suas corridas registradas neste período.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── Leaderboard ── */}
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="relative border-b border-white/[0.05] px-5 py-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
                    Ranking
                  </p>
                  <h2 className="font-display text-base font-semibold">Classificação</h2>
                </div>
                <span className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-xs font-semibold text-[#F5F5F5]/45">
                  <Users className="size-3" strokeWidth={2} />
                  {participants.length}
                </span>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                <div className="grid size-12 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                  <Trophy className="size-6 text-[#F5F5F5]/18" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#F5F5F5]/35">Nenhum participante ainda</p>
                  <p className="mt-1 text-xs text-[#F5F5F5]/20">
                    Seja o primeiro a entrar nesta competição.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {/* Podium — top 3 */}
                {podium.length > 0 && (
                  <div className={rest.length > 0 ? "border-b border-white/[0.04]" : ""}>
                    {podium.map((entry, idx) => {
                      const rank = idx + 1;
                      const medal = RANK_MEDALS[rank as keyof typeof RANK_MEDALS]!;
                      const avatarDef = entry.avatar_id ? getAvatarById(entry.avatar_id) : undefined;
                      const accentColor = avatarDef?.accentColor ?? "#B6FF00";
                      const displayName = entry.display_name || entry.username || "Atleta";
                      const initials = displayName[0]?.toUpperCase() ?? "?";
                      const progressPct = target > 0 ? Math.min((entry.progress / target) * 100, 100) : 0;
                      const isMe = entry.user_id === currentUser?.id;

                      return (
                        <div
                          key={entry.user_id}
                          className="flex items-center gap-4 px-5 py-4 transition-colors"
                          style={{
                            borderLeft: `3px solid ${medal.color}45`,
                            background: isMe
                              ? cfg.color + "07"
                              : rank === 1
                              ? medal.color + "05"
                              : undefined,
                          }}
                        >
                          {/* Rank icon */}
                          <div
                            className="inline-grid size-8 shrink-0 place-items-center rounded-full"
                            style={{
                              background: medal.color + "1A",
                              boxShadow: `0 0 12px ${medal.glow}`,
                            }}
                          >
                            {rank === 1 ? (
                              <Crown className="size-4" strokeWidth={2} style={{ color: medal.color }} />
                            ) : (
                              <Medal className="size-4" strokeWidth={2} style={{ color: medal.color }} />
                            )}
                          </div>

                          {/* Avatar */}
                          <AvatarDisplay avatarId={entry.avatar_id} initials={initials} size="sm" />

                          {/* Name + progress bar */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className="truncate text-sm font-semibold"
                                style={{ color: isMe ? cfg.color : "rgba(245,245,245,0.88)" }}
                              >
                                {displayName}
                              </span>
                              <span
                                className="shrink-0 rounded px-1 py-px text-[9px] font-bold uppercase tracking-[0.1em]"
                                style={{ background: medal.color + "1A", color: medal.color }}
                              >
                                {medal.label}
                              </span>
                              {isMe && (
                                <span
                                  className="shrink-0 rounded px-1 py-px text-[9px] font-bold uppercase tracking-[0.1em]"
                                  style={{ background: cfg.color + "18", color: cfg.color }}
                                >
                                  Você
                                </span>
                              )}
                            </div>
                            {entry.username && (
                              <p className="text-[10px] text-[#F5F5F5]/28">@{entry.username}</p>
                            )}
                            <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${progressPct}%`,
                                  background: isMe ? cfg.color : accentColor,
                                  opacity: isMe ? 1 : 0.7,
                                  boxShadow: rank === 1 ? `0 0 5px ${accentColor}55` : undefined,
                                }}
                              />
                            </div>
                          </div>

                          {/* Progress value */}
                          <div className="shrink-0 text-right">
                            <span
                              className="font-display text-lg font-bold tabular-nums"
                              style={{ color: medal.color }}
                            >
                              {entry.progress}
                            </span>
                            <span className="ml-1 text-[10px] text-[#F5F5F5]/28">{cfg.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Remaining participants */}
                {rest.length > 0 && (
                  <div className="divide-y divide-white/[0.04]">
                    {rest.map((entry, idx) => {
                      const rank = idx + 4;
                      const avatarDef = entry.avatar_id ? getAvatarById(entry.avatar_id) : undefined;
                      const accentColor = avatarDef?.accentColor ?? "#B6FF00";
                      const displayName = entry.display_name || entry.username || "Atleta";
                      const initials = displayName[0]?.toUpperCase() ?? "?";
                      const progressPct = target > 0 ? Math.min((entry.progress / target) * 100, 100) : 0;
                      const isMe = entry.user_id === currentUser?.id;

                      return (
                        <div
                          key={entry.user_id}
                          className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                          style={isMe ? { background: cfg.color + "06" } : undefined}
                        >
                          {/* Rank number */}
                          <div className="w-8 shrink-0 text-center">
                            <span className="font-display text-sm font-bold tabular-nums text-[#F5F5F5]/28">
                              {rank}
                            </span>
                          </div>

                          {/* Avatar */}
                          <AvatarDisplay avatarId={entry.avatar_id} initials={initials} size="sm" />

                          {/* Name + progress bar */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-medium text-[#F5F5F5]/68">
                                {displayName}
                              </span>
                              {isMe && (
                                <span
                                  className="shrink-0 rounded px-1 py-px text-[9px] font-bold uppercase tracking-[0.1em]"
                                  style={{ background: cfg.color + "18", color: cfg.color }}
                                >
                                  Você
                                </span>
                              )}
                            </div>
                            {entry.username && (
                              <p className="text-[10px] text-[#F5F5F5]/24">@{entry.username}</p>
                            )}
                            <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${progressPct}%`,
                                  background: accentColor,
                                  opacity: isMe ? 0.9 : 0.38,
                                }}
                              />
                            </div>
                          </div>

                          {/* Progress value */}
                          <div className="shrink-0 text-right">
                            <span
                              className="font-display text-base font-bold tabular-nums"
                              style={{ color: isMe ? cfg.color : "rgba(245,245,245,0.45)" }}
                            >
                              {entry.progress}
                            </span>
                            <span className="ml-1 text-[10px] text-[#F5F5F5]/22">{cfg.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetaTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#F5F5F5]/30">{label}</p>
      <p
        className="truncate text-sm font-bold"
        style={{ color: accent ?? "rgba(245,245,245,0.80)" }}
      >
        {value}
      </p>
    </div>
  );
}
