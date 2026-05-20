"use client";

import { useState } from "react";
import Link from "next/link";

import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import type { LeaderboardEntry } from "@/lib/leaderboard";

const RANK_COLORS: Record<string, string> = {
  rookie: "#94A3B8",
  bronze: "#CD7F32",
  silver: "#A1A1AA",
  gold: "#EAB308",
  platinum: "#22D3EE",
  elite: "#B6FF00",
};

const SCOPE_TABS = [
  { key: "global", label: "Global" },
  { key: "friends", label: "Amigos" },
] as const;

type Props = {
  globalEntries: LeaderboardEntry[];
  friendsEntries: LeaderboardEntry[];
  currentUserId: string;
};

function Medal({ pos }: { pos: number }) {
  if (pos < 3) {
    return (
      <span className="w-6 text-center text-sm font-black tabular-nums text-[#B6FF00]">
        #{pos + 1}
      </span>
    );
  }
  return (
    <span className="w-6 text-center text-[11px] font-bold tabular-nums text-[#F5F5F5]/30">
      {pos + 1}
    </span>
  );
}

export function WeeklyLeaderboard({ globalEntries, friendsEntries, currentUserId }: Props) {
  const [scope, setScope] = useState<"global" | "friends">("global");
  const entries = scope === "global" ? globalEntries : friendsEntries;
  const myPos = entries.findIndex((entry) => entry.userId === currentUserId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {SCOPE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setScope(tab.key)}
            className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all duration-200"
            style={
              scope === tab.key
                ? { background: "rgba(182,255,0,0.1)", color: "#B6FF00", borderBottom: "1px solid rgba(182,255,0,0.3)" }
                : { color: "rgba(245,245,245,0.35)" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#F5F5F5]/30">
          {scope === "friends" ? "Siga atletas para ver o ranking de amigos." : "Nenhum atleta no ranking ainda."}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-white/[0.04]">
          {entries.slice(0, 20).map((entry, index) => {
            const isMe = entry.userId === currentUserId;
            const rankColor = RANK_COLORS[entry.rank ?? "rookie"] ?? "#94A3B8";
            const name = entry.displayName ?? entry.username ?? "Atleta";

            return (
              <div
                key={entry.userId}
                className="flex items-center gap-3 py-3 transition-all duration-200"
                style={isMe ? { background: "rgba(182,255,0,0.04)", borderRadius: "12px", padding: "12px" } : undefined}
              >
                <div className="flex w-7 shrink-0 items-center justify-center">
                  <Medal pos={index} />
                </div>

                <AvatarDisplay avatarId={entry.avatarId} initials={name[0]?.toUpperCase() ?? "A"} size="sm" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-[#F5F5F5]/90">{name}</p>
                    {isMe && (
                      <span className="shrink-0 rounded-full bg-[#B6FF00]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#B6FF00]">
                        Você
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {entry.username && <span className="truncate text-[10px] text-[#F5F5F5]/28">@{entry.username}</span>}
                    <span className="text-[9px] text-[#F5F5F5]/15">·</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: rankColor }}>
                      Nv {entry.currentLevel} · {entry.rank ?? "rookie"}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm font-bold tabular-nums text-[#F5F5F5]">
                    {entry.totalXp.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-[9px] text-[#F5F5F5]/25">XP</p>
                </div>

                {entry.username && (
                  <Link
                    href={`/perfil/${entry.username}`}
                    className="ml-1 shrink-0 rounded-lg px-2 py-1 text-[10px] text-[#F5F5F5]/20 transition-colors hover:bg-white/[0.05] hover:text-[#F5F5F5]/50"
                  >
                    →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {myPos > 19 && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#B6FF00]/15 bg-[#B6FF00]/[0.05] px-4 py-3">
          <span className="text-xs text-[#F5F5F5]/40">Sua posição:</span>
          <span className="font-bold text-[#B6FF00]">#{myPos + 1}</span>
        </div>
      )}
    </div>
  );
}
