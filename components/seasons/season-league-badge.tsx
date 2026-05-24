import { Medal } from "lucide-react";

import { getSeasonLeague } from "@/lib/season-league";

type SeasonLeagueBadgeProps = {
  points: number | null | undefined;
  seasonName?: string | null;
  compact?: boolean;
  showLabel?: boolean;
};

export function SeasonLeagueBadge({
  points,
  seasonName,
  compact = false,
  showLabel = true,
}: SeasonLeagueBadgeProps) {
  const league = getSeasonLeague(points);
  const label = seasonName ? `${seasonName} — ${league.label}` : league.label;

  return (
    <span
      className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
      style={{
        borderColor: `${league.color}38`,
        background: `${league.color}14`,
        color: league.color,
      }}
      title={label}
      aria-label={label}
    >
      <span
        className="grid size-4 place-items-center rounded-full"
        style={{ background: `${league.color}20` }}
      >
        <Medal className="size-3" strokeWidth={2.2} />
      </span>
      {showLabel && <span>{compact ? league.label : label}</span>}
    </span>
  );
}
