import Link from "next/link";
import { Timer, Dumbbell, Zap, Route, Clock, Trophy } from "lucide-react";

import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import {
  GOAL_CONFIG,
  STATUS_CONFIG,
  daysLeft,
  type ChallengeRow,
  type ChallengeProfile,
} from "@/lib/challenge-progress";

const GOAL_ICONS = {
  runs_count:     Timer,
  distance_km:    Route,
  gym_sessions:   Dumbbell,
  total_workouts: Zap,
};

interface ChallengeCardProps {
  challenge: ChallengeRow;
  creator: ChallengeProfile;
  challenged: ChallengeProfile;
  currentUserId: string;
}

function initials(p: ChallengeProfile): string {
  const name = p.display_name || p.username || "?";
  return name[0].toUpperCase();
}

function displayName(p: ChallengeProfile): string {
  return p.display_name || p.username || "Atleta";
}

export function ChallengeCard({
  challenge: c,
  creator,
  challenged,
  currentUserId,
}: ChallengeCardProps) {
  const goalCfg  = GOAL_CONFIG[c.goal_type];
  const statusCfg = STATUS_CONFIG[c.status];
  const Icon = GOAL_ICONS[c.goal_type];

  const isMine = c.creator_id === currentUserId;
  const me = isMine ? creator : challenged;
  const opponent = isMine ? challenged : creator;

  const days = c.end_date ? daysLeft(c.end_date) : null;
  const isActive = c.status === "active";
  const isFinished = c.status === "finished";
  const isPending = c.status === "pending";

  return (
    <Link
      href={`/desafios/${c.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] transition-all duration-200 hover:border-white/[0.13]"
      style={
        isActive
          ? { boxShadow: `0 0 28px ${goalCfg.color}0A` }
          : undefined
      }
    >
      {/* Top shimmer line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />

      {/* Active glow */}
      {isActive && (
        <div
          className="pointer-events-none absolute -left-8 -top-8 size-40 rounded-full blur-[70px]"
          style={{ background: goalCfg.color + "0D" }}
        />
      )}

      <div className="relative p-4">
        {/* ── Header: avatars + VS ── */}
        <div className="mb-3 flex items-center gap-3">
          {/* Me */}
          <div className="flex flex-col items-center gap-1">
            <AvatarDisplay avatarId={me.avatar_id} initials={initials(me)} size="sm" />
            <span className="max-w-[72px] truncate text-[10px] font-semibold text-[#F5F5F5]/60">
              {displayName(me)}
            </span>
          </div>

          {/* VS */}
          <div className="flex flex-1 flex-col items-center gap-0.5">
            <div
              className="rounded-lg px-2 py-0.5 text-[11px] font-black tracking-wider text-[#F5F5F5]/60"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              VS
            </div>
          </div>

          {/* Opponent */}
          <div className="flex flex-col items-center gap-1">
            <AvatarDisplay
              avatarId={opponent.avatar_id}
              initials={initials(opponent)}
              size="sm"
            />
            <span className="max-w-[72px] truncate text-[10px] font-semibold text-[#F5F5F5]/60">
              {displayName(opponent)}
            </span>
          </div>

          {/* Spacer + status + time */}
          <div className="ml-auto flex flex-col items-end gap-1.5">
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
              style={{ color: statusCfg.color, background: statusCfg.bg }}
            >
              {statusCfg.label}
            </span>
            {days !== null && isActive && (
              <span className="flex items-center gap-1 text-[9px] text-[#F5F5F5]/35">
                <Clock className="size-2.5" strokeWidth={1.8} />
                {days === 0 ? "Encerra hoje" : `${days}d`}
              </span>
            )}
            {isFinished && c.winner_id && (
              <Trophy
                className="size-3.5"
                style={{ color: goalCfg.color }}
                strokeWidth={2}
              />
            )}
          </div>
        </div>

        {/* ── Title + goal ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[#F5F5F5]/85">
              {c.title}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Icon
                className="size-3 shrink-0"
                style={{ color: goalCfg.color }}
                strokeWidth={2}
              />
              <span
                className="text-[11px] font-medium"
                style={{ color: goalCfg.color + "BB" }}
              >
                {c.target_value} {goalCfg.unit} · {c.duration_days}d
              </span>
            </div>
          </div>
        </div>

        {/* ── Pending action hint ── */}
        {isPending && c.challenged_id === currentUserId && (
          <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-[#B6FF00]/[0.07] px-2.5 py-1.5">
            <div className="size-1.5 animate-pulse rounded-full bg-[#B6FF00]" />
            <span className="text-[11px] font-semibold text-[#B6FF00]/80">
              Aguardando sua resposta
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
