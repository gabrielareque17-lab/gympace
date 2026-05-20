"use client";

import { useState } from "react";
import Link from "next/link";

import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import type { LeaderboardEntry, LeaderboardCategory } from "@/lib/leaderboard";

const RANK_COLORS: Record<string, string> = {
  rookie: "#94A3B8",
  bronze: "#CD7F32",
  silver: "#A1A1AA",
  gold: "#EAB308",
  platinum: "#22D3EE",
  elite: "#B6FF00",
};

const CATEGORY_TABS: { key: LeaderboardCategory; label: string; metric: (e: LeaderboardEntry) => string; unit: string }[] = [
  { key: "xp",       label: "XP Total",    metric: (e) => e.totalXp.toLocaleString("pt-BR"),             unit: "XP"      },
  { key: "km",       label: "Km Semana",   metric: (e) => e.weeklyKm.toFixed(1),                          unit: "km"      },
  { key: "workouts", label: "Treinos",     metric: (e) => String(e.weeklyWorkouts),                       unit: "treinos" },
  { key: "streak",   label: "Sequência",   metric: (e) => String(e.currentStreak),                        unit: "dias"    },
];

const SCOPE_TABS = [
  { key: "global",  label: "Global"  },
  { key: "friends", label: "Amigos"  },
] as const;

type Props = {
  globalEntries: Record<LeaderboardCategory, LeaderboardEntry[]>;
  friendsEntries: Record<LeaderboardCategory, LeaderboardEntry[]>;
  currentUserId: string;
};

function Medal({ pos }: { pos: number }) {
  if (pos === 0) return <span className="text-base leading-none">🥇</span>;
  if (pos === 1) return <span className="text-base leading-none">🥈</span>;
  if (pos === 2) return <span className="text-base leading-none">🥉</span>;
  return (
    <span className="w-5 text-center text-[11px] font-bold tabular-nums text-[#F5F5F5]/30">
      {pos + 1}
    </span>
  );
}

export function WeeklyLeaderboard({ globalEntries, friendsEntries, currentUserId }: Props) {
  const [category, setCategory] = useState<LeaderboardCategory>("xp");
  const [scope, setScope] = useState<"global" | "friends">("global");

  const tab = CATEGORY_TABS.find((t) => t.key === category)!;
  const entries = (scope === "global" ? globalEntries : friendsEntries)[category] ?? [];

  const myPos = entries.findIndex((e) => e.userId === currentUserId);

  return (
    <div className="flex flex-col gap-3">
      {/* Scope tabs */}
      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {SCOPE_TABS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setScope(s.key)}
            className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all duration-200"
            style={
              scope === s.key
                ? { background: "rgba(182,255,0,0.1)", color: "#B6FF00", borderBottom: "1px solid rgba(182,255,0,0.3)" }
                : { color: "rgba(245,245,245,0.35)" }
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {CATEGORY_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setCategory(t.key)}
            className="flex-shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold transition-all duration-200"
            style={
              category === t.key
                ? { borderColor: "rgba(182,255,0,0.35)", background: "rgba(182,255,0,0.08)", color: "#B6FF00" }
                : { borderColor: "rgba(245,245,245,0.08)", background: "transparent", color: "rgba(245,245,245,0.38)" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {entries.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#F5F5F5]/30">
          {scope === "friends" ? "Siga atletas para ver o ranking de amigos." : "Nenhuma atividade esta semana."}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-white/[0.04]">
          {entries.slice(0, 20).map((entry, i) => {
            const isMe = entry.userId === currentUserId;
            const rankColor = RANK_COLORS[entry.rank ?? "rookie"] ?? "#94A3B8";
            const metricValue = tab.metric(entry);
            const isEmpty = metricValue === "0" || metricValue === "0.0";

            return (
              <div
                key={entry.userId}
                className="flex items-center gap-3 py-3 transition-all duration-200"
                style={isMe ? { background: "rgba(182,255,0,0.04)", borderRadius: "12px", padding: "12px" } : undefined}
              >
                {/* Position */}
                <div className="flex w-6 shrink-0 items-center justify-center">
                  <Medal pos={i} />
                </div>

                {/* Avatar */}
                <div className="shrink-0">
                  <AvatarDisplay avatarId={entry.avatarId} initials={(entry.displayName ?? entry.username ?? "?")[0].toUpperCase()} size="sm" />
                </div>

                {/* Name + rank */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-[#F5F5F5]/90">
                      {entry.displayName ?? entry.username ?? "Atleta"}
                    </p>
                    {isMe && (
                      <span className="shrink-0 rounded-full bg-[#B6FF00]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#B6FF00]">
                        Você
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: rankColor }}
                    >
                      Nv {entry.currentLevel}
                    </span>
                    {entry.currentStreak > 0 && (
                      <>
                        <span className="text-[9px] text-[#F5F5F5]/15">·</span>
                        <span className="text-[9px] text-[#FB923C]/70">🔥 {entry.currentStreak}d</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Metric */}
                <div className="shrink-0 text-right">
                  <p
                    className="font-mono text-sm font-bold tabular-nums"
                    style={{ color: isEmpty ? "rgba(245,245,245,0.2)" : "#F5F5F5" }}
                  >
                    {metricValue}
                  </p>
                  <p className="text-[9px] text-[#F5F5F5]/25">{tab.unit}</p>
                </div>

                {/* Profile link */}
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

      {/* My position if not in top 20 */}
      {myPos > 19 && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#B6FF00]/15 bg-[#B6FF00]/[0.05] px-4 py-3">
          <span className="text-xs text-[#F5F5F5]/40">Sua posição:</span>
          <span className="font-bold text-[#B6FF00]">#{myPos + 1}</span>
        </div>
      )}
    </div>
  );
}
