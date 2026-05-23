"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, Dumbbell, Loader2, Route, Timer, Trophy, X, Zap } from "lucide-react";

import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import {
  daysLeft,
  GOAL_CONFIG,
  STATUS_CONFIG,
  type ChallengeProfile,
  type ChallengeRow,
} from "@/lib/challenge-progress";

const GOAL_ICONS = {
  runs_count: Timer,
  distance_km: Route,
  gym_sessions: Dumbbell,
  total_workouts: Zap,
};

interface ChallengeCardProps {
  challenge: ChallengeRow;
  creator: ChallengeProfile;
  challenged: ChallengeProfile;
  currentUserId: string;
}

function initials(profile: ChallengeProfile): string {
  const name = profile.display_name || profile.username || "?";
  return name[0].toUpperCase();
}

function displayName(profile: ChallengeProfile): string {
  return profile.display_name || profile.username || "Atleta";
}

export function ChallengeCard({ challenge: c, creator, challenged, currentUserId }: ChallengeCardProps) {
  const router = useRouter();
  const [isCanceling, setIsCanceling] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goalCfg = GOAL_CONFIG[c.goal_type];
  const statusCfg = STATUS_CONFIG[c.status];
  const Icon = GOAL_ICONS[c.goal_type];

  const isMine = c.creator_id === currentUserId;
  const me = isMine ? creator : challenged;
  const opponent = isMine ? challenged : creator;

  const days = c.end_date ? daysLeft(c.end_date) : null;
  const isActive = c.status === "active";
  const isFinished = c.status === "finished";
  const isPending = c.status === "pending";
  const canCancelSentInvite = isMine && isPending;

  async function cancelChallenge() {
    setIsCanceling(true);
    setError(null);

    try {
      const response = await fetch(`/api/challenges/${c.id}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Não foi possível cancelar o desafio.");
        return;
      }

      setIsHidden(true);
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setIsCanceling(false);
    }
  }

  if (isHidden) return null;

  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] transition-all duration-200 hover:border-white/[0.13]"
      style={isActive ? { boxShadow: `0 0 28px ${goalCfg.color}0A` } : undefined}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />

      {isActive && (
        <div
          className="pointer-events-none absolute -left-8 -top-8 size-40 rounded-full blur-[70px]"
          style={{ background: goalCfg.color + "0D" }}
        />
      )}

      <Link href={`/desafios/${c.id}`} className="relative block p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <AvatarDisplay avatarId={me.avatar_id} initials={initials(me)} size="sm" />
            <span className="max-w-[72px] truncate text-[10px] font-semibold text-[#F5F5F5]/60">
              {displayName(me)}
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center gap-0.5">
            <div
              className="rounded-lg px-2 py-0.5 text-[11px] font-black tracking-wider text-[#F5F5F5]/60"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              VS
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <AvatarDisplay avatarId={opponent.avatar_id} initials={initials(opponent)} size="sm" />
            <span className="max-w-[72px] truncate text-[10px] font-semibold text-[#F5F5F5]/60">
              {displayName(opponent)}
            </span>
          </div>

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
              <Trophy className="size-3.5" style={{ color: goalCfg.color }} strokeWidth={2} />
            )}
          </div>
        </div>

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[#F5F5F5]/85">{c.title}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Icon className="size-3 shrink-0" style={{ color: goalCfg.color }} strokeWidth={2} />
              <span className="text-[11px] font-medium" style={{ color: goalCfg.color + "BB" }}>
                {c.target_value} {goalCfg.unit} · {c.duration_days}d
              </span>
            </div>
          </div>
        </div>

        {isPending && c.challenged_id === currentUserId && (
          <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-[#B6FF00]/[0.07] px-2.5 py-1.5">
            <div className="size-1.5 animate-pulse rounded-full bg-[#B6FF00]" />
            <span className="text-[11px] font-semibold text-[#B6FF00]/80">Aguardando sua resposta</span>
          </div>
        )}
      </Link>

      {canCancelSentInvite && (
        <div className="relative border-t border-white/[0.05] px-4 pb-4 pt-3">
          <button
            type="button"
            onClick={cancelChallenge}
            disabled={isCanceling}
            className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-red-500/15 bg-red-500/[0.05] px-3 text-xs font-semibold text-red-300/75 transition-all hover:border-red-500/25 hover:bg-red-500/[0.08] disabled:pointer-events-none disabled:opacity-60"
          >
            {isCanceling ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
            Cancelar desafio
          </button>
          {error && (
            <p className="mt-3 rounded-lg border border-red-500/15 bg-red-500/[0.06] px-3 py-2 text-xs text-red-300/80">
              {error}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
