import type { SupabaseClient } from "@supabase/supabase-js";

export type Season = {
  id: string;
  name: string;
  theme: string | null;
  description: string | null;
  color: string;
  xpMultiplier: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
};

type DbSeason = {
  id: string;
  name: string;
  theme: string | null;
  description: string | null;
  color: string | null;
  xp_multiplier: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean | null;
  created_at: string;
};

function mapSeason(s: DbSeason): Season {
  return {
    id: s.id,
    name: s.name,
    theme: s.theme,
    description: s.description,
    color: s.color ?? "#B6FF00",
    xpMultiplier: s.xp_multiplier ?? 1.0,
    startDate: s.start_date,
    endDate: s.end_date,
    isActive: s.is_active ?? false,
    createdAt: s.created_at,
  };
}

/** Returns the currently active season, or null. */
export async function getActiveSeason(supabase: SupabaseClient): Promise<Season | null> {
  const { data } = await supabase
    .from("seasons")
    .select("id, name, theme, description, color, xp_multiplier, start_date, end_date, is_active, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? mapSeason(data as DbSeason) : null;
}

/** Returns all seasons ordered newest first. */
export async function getAllSeasons(supabase: SupabaseClient): Promise<Season[]> {
  const { data } = await supabase
    .from("seasons")
    .select("id, name, theme, description, color, xp_multiplier, start_date, end_date, is_active, created_at")
    .order("created_at", { ascending: false });

  return ((data ?? []) as DbSeason[]).map(mapSeason);
}

/** Days remaining in the given season (0 if ended or not active). */
export function daysRemaining(season: Season): number {
  const end = new Date(season.endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / 86_400_000);
  return Math.max(0, diff);
}

/** Progress through the season as a 0–100 percentage. */
export function seasonProgress(season: Season): number {
  const start = new Date(season.startDate).getTime();
  const end = new Date(season.endDate).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}
