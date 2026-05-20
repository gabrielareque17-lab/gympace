import { Award, Medal, Sparkles } from "lucide-react";

import type { AchievementCardData } from "@/components/profile/achievement-grid";
import { RARITY_CONFIG } from "@/lib/achievements";

export type TrophyGrant = {
  id: string;
  awarded_at: string;
  note: string | null;
  exclusive_trophies:
    | {
        name: string;
        description: string | null;
        rarity: string;
        visual: string | null;
      }
    | {
        name: string;
        description: string | null;
        rarity: string;
        visual: string | null;
      }[]
    | null;
};

const EXCLUSIVE_RARITY: Record<string, { label: string; color: string }> = {
  common: { label: "Comum", color: "#94A3B8" },
  rare: { label: "Raro", color: "#60A5FA" },
  epic: { label: "Epico", color: "#A78BFA" },
  legendary: { label: "Lendario", color: "#EAB308" },
  mythic: { label: "Mitico", color: "#F472B6" },
};

function getGrantTrophy(grant: TrophyGrant) {
  return Array.isArray(grant.exclusive_trophies)
    ? grant.exclusive_trophies[0]
    : grant.exclusive_trophies;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function LatestTrophiesSection({
  achievements,
  exclusiveTrophies,
}: {
  achievements: AchievementCardData[];
  exclusiveTrophies: TrophyGrant[];
}) {
  const latestAchievements = achievements
    .filter((achievement) => achievement.unlocked)
    .sort((a, b) => {
      if (!a.unlockedAt && !b.unlockedAt) return 0;
      if (!a.unlockedAt) return 1;
      if (!b.unlockedAt) return -1;
      return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
    })
    .slice(0, 4);
  const latestExclusiveTrophies = exclusiveTrophies.slice(0, 4);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
      <div className="relative border-b border-white/[0.05] px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
              Perfil
            </p>
            <h2 className="flex items-center gap-2 font-display text-base font-semibold">
              <Medal className="size-4 text-[#EAB308]" strokeWidth={2} />
              Ultimos trofeus recebidos
            </h2>
          </div>
          <div className="grid size-8 place-items-center rounded-xl border border-[#EAB308]/20 bg-[#EAB308]/[0.06] text-[#EAB308] shadow-[0_0_18px_rgba(234,179,8,0.08)] sm:size-9">
            <Sparkles className="size-4" strokeWidth={2} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5 sm:p-4">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B6FF00]/55">
                Trofeus
              </p>
              <h3 className="text-sm font-semibold text-[#F5F5F5]/85">Conquistas recentes</h3>
            </div>
            <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-xs font-semibold tabular-nums text-[#F5F5F5]/45">
              {latestAchievements.length}
            </span>
          </div>

          {latestAchievements.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/[0.08] px-4 py-6 text-sm text-[#F5F5F5]/30">
              Nenhuma conquista desbloqueada ainda.
            </p>
          ) : (
            <div className="grid gap-1.5">
              {latestAchievements.map((achievement) => {
                const rarity = RARITY_CONFIG[achievement.rarity];
                return (
                  <article
                    key={achievement.id}
                    className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/[0.05] bg-[#0B0B0B] p-2.5 sm:gap-3 sm:p-3"
                  >
                    <div
                      className="grid size-9 shrink-0 place-items-center rounded-xl sm:size-10"
                      style={{
                        background: achievement.accentHex + "18",
                        color: achievement.accentHex,
                      }}
                    >
                      <Award className="size-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#F5F5F5]/88">{achievement.name}</p>
                      <p className="line-clamp-1 text-xs text-[#F5F5F5]/35">
                        {achievement.unlockedAt
                          ? `Recebido em ${formatDate(achievement.unlockedAt)}`
                          : achievement.description}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        background: rarity.color + "16",
                        color: rarity.color,
                      }}
                    >
                      {rarity.label}
                    </span>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[#EAB308]/[0.12] bg-[#EAB308]/[0.035] p-3.5 sm:p-4">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#EAB308]/65">
                Exclusivos
              </p>
              <h3 className="text-sm font-semibold text-[#F5F5F5]/85">
                Ultimos trofeus exclusivos
              </h3>
            </div>
            <span className="rounded-full border border-[#EAB308]/20 bg-[#EAB308]/[0.07] px-2.5 py-1 text-xs font-semibold tabular-nums text-[#EAB308]/80">
              {latestExclusiveTrophies.length}
            </span>
          </div>

          {latestExclusiveTrophies.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#EAB308]/15 px-4 py-6 text-sm text-[#F5F5F5]/30">
              Nenhum trofeu exclusivo recebido ainda.
            </p>
          ) : (
            <div className="grid gap-1.5">
              {latestExclusiveTrophies.map((grant) => {
                const trophy = getGrantTrophy(grant);
                if (!trophy) return null;
                const rarity = EXCLUSIVE_RARITY[trophy.rarity] ?? EXCLUSIVE_RARITY.rare;
                return (
                  <article
                    key={grant.id}
                    className="flex min-w-0 items-center gap-2.5 rounded-xl border border-[#EAB308]/15 bg-[#0B0B0B] p-2.5 sm:gap-3 sm:p-3"
                  >
                    <div
                      className="grid size-9 shrink-0 place-items-center rounded-xl sm:size-10"
                      style={{
                        background: rarity.color + "18",
                        color: rarity.color,
                      }}
                    >
                      <Medal className="size-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#F5F5F5]/88">{trophy.name}</p>
                      <p className="line-clamp-1 text-xs text-[#F5F5F5]/35">
                        {trophy.description || `Recebido em ${formatDate(grant.awarded_at)}`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className="text-[9px] font-bold uppercase tracking-[0.12em]"
                        style={{ color: rarity.color }}
                      >
                        {rarity.label}
                      </p>
                      <p className="mt-0.5 text-[9px] text-[#F5F5F5]/25">
                        {formatDate(grant.awarded_at)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
