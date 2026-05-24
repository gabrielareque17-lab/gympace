export type AthleteTitleKey = "rookie" | "bronze" | "silver" | "gold" | "platinum" | "elite";

export type AthleteTitle = {
  key: AthleteTitleKey;
  label: string;
  color: string;
};

export const ATHLETE_TITLES: Record<AthleteTitleKey, AthleteTitle> = {
  rookie: { key: "rookie", label: "Iniciante", color: "#94A3B8" },
  bronze: { key: "bronze", label: "Amador", color: "#60A5FA" },
  silver: { key: "silver", label: "Intermediario", color: "#22C55E" },
  gold: { key: "gold", label: "Avancado", color: "#FB923C" },
  platinum: { key: "platinum", label: "Pro", color: "#A78BFA" },
  elite: { key: "elite", label: "Elite", color: "#B6FF00" },
};

export function getAthleteTitle(rank: string | null | undefined): AthleteTitle {
  return ATHLETE_TITLES[(rank ?? "rookie") as AthleteTitleKey] ?? ATHLETE_TITLES.rookie;
}

