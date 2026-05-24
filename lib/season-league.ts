export type SeasonLeagueKey = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export type SeasonLeague = {
  key: SeasonLeagueKey;
  label: string;
  color: string;
  minPoints: number;
};

export const SEASON_LEAGUES: readonly SeasonLeague[] = [
  { key: "bronze", label: "Bronze", color: "#CD7F32", minPoints: 0 },
  { key: "silver", label: "Prata", color: "#A1A1AA", minPoints: 250 },
  { key: "gold", label: "Ouro", color: "#EAB308", minPoints: 750 },
  { key: "platinum", label: "Platina", color: "#67E8F9", minPoints: 1500 },
  { key: "diamond", label: "Diamante", color: "#A78BFA", minPoints: 3000 },
] as const;

export function getSeasonLeague(points: number | null | undefined): SeasonLeague {
  const safePoints = Math.max(0, Number(points ?? 0));
  return [...SEASON_LEAGUES].reverse().find((league) => safePoints >= league.minPoints) ?? SEASON_LEAGUES[0];
}

