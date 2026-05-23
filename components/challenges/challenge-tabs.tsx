"use client";

import type { ElementType } from "react";
import { useState } from "react";
import { CheckCircle2, Clock, History, Swords } from "lucide-react";

import { ChallengeCard } from "./challenge-card";
import type { ChallengeProfile, ChallengeRow } from "@/lib/challenge-progress";

interface ChallengeWithProfiles {
  challenge: ChallengeRow;
  creator: ChallengeProfile;
  challenged: ChallengeProfile;
}

interface ChallengeTabsProps {
  received: ChallengeWithProfiles[];
  sent: ChallengeWithProfiles[];
  active: ChallengeWithProfiles[];
  history: ChallengeWithProfiles[];
  currentUserId: string;
}

type Tab = "received" | "sent" | "active" | "history";

const TABS: {
  key: Tab;
  label: string;
  icon: ElementType;
  emptyMessage: string;
  emptyHint: string;
}[] = [
  {
    key: "received",
    label: "Recebidos",
    icon: Swords,
    emptyMessage: "Nenhum desafio recebido",
    emptyHint: "Quando alguém te desafiar, aparecerá aqui.",
  },
  {
    key: "sent",
    label: "Enviados",
    icon: Clock,
    emptyMessage: "Nenhum desafio enviado",
    emptyHint: "Toque em + para desafiar alguém.",
  },
  {
    key: "active",
    label: "Ativos",
    icon: CheckCircle2,
    emptyMessage: "Nenhum duelo ativo",
    emptyHint: "Aceite um desafio ou envie um novo.",
  },
  {
    key: "history",
    label: "Histórico",
    icon: History,
    emptyMessage: "Histórico vazio",
    emptyHint: "Seus duelos finalizados aparecem aqui.",
  },
];

export function ChallengeTabs({ received, sent, active, history, currentUserId }: ChallengeTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>(
    received.length > 0 ? "received" : active.length > 0 ? "active" : "received"
  );

  const counts: Record<Tab, number> = {
    received: received.length,
    sent: sent.length,
    active: active.length,
    history: history.length,
  };

  const data: Record<Tab, ChallengeWithProfiles[]> = {
    received,
    sent,
    active,
    history,
  };

  const current = data[activeTab];
  const tab = TABS.find((item) => item.key === activeTab)!;

  return (
    <div>
      <div className="mb-5 flex gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold transition-all duration-150"
              style={
                isActive
                  ? { background: "rgba(182,255,0,0.1)", color: "#B6FF00" }
                  : { color: "rgba(245,245,245,0.35)" }
              }
            >
              <Icon className="size-3.5" strokeWidth={isActive ? 2.2 : 1.8} />
              {label}
              {counts[key] > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[8px] font-black tabular-nums text-[#080808]"
                  style={{ background: isActive ? "#B6FF00" : "rgba(182,255,0,0.55)" }}
                >
                  {counts[key] > 9 ? "9+" : counts[key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {current.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="grid size-14 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
            <tab.icon className="size-6 text-[#F5F5F5]/20" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-[#F5F5F5]/55">{tab.emptyMessage}</p>
            <p className="mt-1 text-xs text-[#F5F5F5]/28">{tab.emptyHint}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {current.map(({ challenge, creator, challenged }) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              creator={creator}
              challenged={challenged}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
