import type { SupabaseClient } from "@supabase/supabase-js";

export type RateLimitInput = {
  table: string;
  userColumn: string;
  userId: string;
  max: number;
  windowSeconds: number;
  extra?: Record<string, string | number | boolean>;
};

export async function isRateLimited(
  supabase: SupabaseClient,
  input: RateLimitInput
) {
  const since = new Date(Date.now() - input.windowSeconds * 1000).toISOString();
  let query = supabase
    .from(input.table)
    .select("id", { count: "exact", head: true })
    .eq(input.userColumn, input.userId)
    .gte("created_at", since);

  for (const [key, value] of Object.entries(input.extra ?? {})) {
    query = query.eq(key, value);
  }

  const { count, error } = await query;
  if (error) {
    console.warn("[security] rate-limit check failed", {
      table: input.table,
      code: error.code,
      message: error.message,
    });
    return false;
  }

  return (count ?? 0) >= input.max;
}
