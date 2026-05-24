"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";

import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { SeasonLeagueBadge } from "@/components/seasons/season-league-badge";
import type { LeaderboardEntry } from "@/lib/leaderboard";
import { getAthleteTitle } from "@/lib/athlete-title";

const SCOPE_TABS = [
  { key: "global", label: "Global" },
  { key: "friends", label: "Amigos" },
] as const;

type Props = {
  globalEntries: LeaderboardEntry[];
  friendsEntries: LeaderboardEntry[];
  currentUserId: string;
  mode?: "xp";
  hasSeason?: boolean;
};

const TROPHY_COLORS = ["#EAB308", "#A1A1AA", "#CD7F32"] as const;

function PositionBadge({ pos }: { pos: number }) {
  if (pos < 3) {
    return (
      <Trophy
        className="size-4 shrink-0"
        strokeWidth={2}
        style={{ color: TROPHY_COLORS[pos], fill: `${TROPHY_COLORS[pos]}33` }}
      />
    );
  }
  return (
    <span className="w-5 text-center text-xs font-bold tabular-nums text-[#F5F5F5]/25">
      {pos + 1}
    </span>
  );
}

export function WeeklyLeaderboard({ globalEntries, friendsEntries, currentUserId, mode = "xp", hasSeason = false }: Props) {
  const [scope, setScope] = useState<"global" | "friends">("global");
  const entries = scope === "global" ? globalEntries : friendsEntries;
  const myPos = entries.findIndex((entry) => entry.userId === currentUserId);
  void mode;
  const isSeason = false;

  return (
    <div className="flex flex-col gap-3">
      <style>{`
        @keyframes gpMeGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(182,255,0,0); border-color: rgba(182,255,0,0.10); }
          50% { box-shadow: 0 0 18px rgba(182,255,0,0.18), inset 0 0 10px rgba(182,255,0,0.04); border-color: rgba(182,255,0,0.30); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .gp-me-card { animation: gpMeGlow 2.6s ease-in-out infinite; }
        }
      `}</style>

      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.025] p-1">
        {SCOPE_TABS.map((tab) => {
          const active = scope === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setScope(tab.key)}
              className="mobile-tap flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-150 active:scale-[0.97] active:opacity-80"
              style={
                active
                  ? { background: "rgba(182,255,0,0.09)", color: "#B6FF00", boxShadow: "0 0 10px rgba(182,255,0,0.12)", borderBottom: "1px solid rgba(182,255,0,0.25)" }
                  : { color: "rgba(245,245,245,0.32)" }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#F5F5F5]/30">
          {scope === "friends"
            ? "Siga atletas para ver o ranking de amigos."
            : "Nenhum atleta no ranking ainda."}
        </div>
      ) : (
        <div key={scope} className="flex flex-col gap-0.5">
          {entries.slice(0, 20).map((entry, index) => {
            const isMe = entry.userId === currentUserId;
            const athleteTitle = getAthleteTitle(entry.rank);
            const name = entry.displayName ?? entry.username ?? "Atleta";
            const score = entry.totalXp.toLocaleString("pt-BR");

            const inner = (
              <>
                <div className="flex w-6 shrink-0 items-center justify-center">
                  <PositionBadge pos={index} />
                </div>

                <AvatarDisplay
                  avatarId={entry.avatarId}
                  definition={entry.avatarDefinition}
                  initials={name[0]?.toUpperCase() ?? "A"}
                  size="sm"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold leading-tight text-[#F5F5F5]/90">
                      {name}
                    </p>
                    {isMe && (
                      <span className="shrink-0 rounded-full bg-[#B6FF00]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#B6FF00]">
                        Você
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1">
                    <span
                      className="text-[10px] font-semibold whitespace-nowrap"
                      style={{ color: athleteTitle.color }}
                    >
                      Nv {entry.currentLevel}
                    </span>
                    <span className="text-[9px] text-[#F5F5F5]/15">·</span>
                    <span className="text-[10px] font-semibold" style={{ color: athleteTitle.color }}>
                      {athleteTitle.label}
                    </span>
                    {hasSeason && (
                      <SeasonLeagueBadge points={entry.totalXp} compact showLabel={false} />
                    )}
                    {entry.username && (
                      <>
                        <span className="text-[9px] text-[#F5F5F5]/10">·</span>
                        <span className="truncate text-[10px] text-[#F5F5F5]/22">
                          @{entry.username}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p
                    className="font-mono text-base font-bold tabular-nums"
                    style={{ color: isMe ? "#B6FF00" : "rgba(245,245,245,0.90)" }}
                  >
                    {score}
                  </p>
                  <p className="text-[9px] text-[#F5F5F5]/25">
                    XP
                  </p>
                  {isSeason && (
                    <p className="mt-0.5 text-[9px] text-[#F5F5F5]/22">
                      {entry.seasonBreakdown.runs}C · {entry.seasonBreakdown.workouts}T
                    </p>
                  )}
                </div>
              </>
            );

            const cls = `gp-row-in flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-150${isMe ? " gp-me-card" : " hover:bg-white/[0.03] active:opacity-75"}`;
            const sty = {
              ...(isMe ? { background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.10)" } : {}),
              animationDelay: `${Math.min(index, 14) * 32}ms`,
            };

            return entry.username ? (
              <Link
                key={entry.userId}
                href={`/perfil/${entry.username}`}
                prefetch
                className={cls}
                style={sty}
              >
                {inner}
              </Link>
            ) : (
              <div key={entry.userId} className={cls} style={sty}>
                {inner}
              </div>
            );
          })}
        </div>
      )}

      {myPos > 19 && (
        <div className="mt-1 flex items-center justify-between gap-2 rounded-xl border border-[#B6FF00]/15 bg-[#B6FF00]/[0.05] px-4 py-3">
          <span className="text-xs text-[#F5F5F5]/40">Sua posição no ranking</span>
          <span className="font-mono text-sm font-bold text-[#B6FF00]">#{myPos + 1}</span>
        </div>
      )}
    </div>
  );
}
