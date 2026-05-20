import type { SupabaseClient } from "@supabase/supabase-js";

export type PersonalRecordType =
  | "best_5k_pace"
  | "best_10k_pace"
  | "best_half_pace"
  | "longest_run"
  | "best_pace";

export const PR_LABELS: Record<PersonalRecordType, string> = {
  best_pace:      "Melhor Pace",
  best_5k_pace:   "Melhor 5K",
  best_10k_pace:  "Melhor 10K",
  best_half_pace: "Melhor Meia Maratona",
  longest_run:    "Maior Distância",
};

export type PersonalRecord = {
  recordType: PersonalRecordType;
  valueSeconds: number | null;
  valueKm: number | null;
  achievedAt: string;
};

type DbRow = {
  record_type: string;
  value_seconds: number | null;
  value_km: number | null;
  achieved_at: string;
};

function paceToSeconds(pace: string | null): number | null {
  if (!pace) return null;
  const [min, sec] = pace.split(":").map(Number);
  if (!Number.isFinite(min) || !Number.isFinite(sec)) return null;
  return min * 60 + sec;
}

export function formatPaceSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Checks whether the given run breaks any personal records.
 * Upserts new records to the DB and returns the list of broken record types.
 */
export async function checkAndUpdatePersonalRecords(
  supabase: SupabaseClient,
  userId: string,
  run: { id: string; distance: number; pace: string | null }
): Promise<PersonalRecordType[]> {
  const { data: existing } = await supabase
    .from("personal_records")
    .select("record_type, value_seconds, value_km")
    .eq("user_id", userId);

  const map = Object.fromEntries(
    ((existing ?? []) as DbRow[]).map((r) => [r.record_type, r])
  );

  const paceSeconds = paceToSeconds(run.pace);
  const now = new Date().toISOString();
  const newRecords: PersonalRecordType[] = [];

  type UpsertRow = {
    user_id: string;
    record_type: PersonalRecordType;
    value_seconds?: number;
    value_km?: number;
    achieved_at: string;
    run_id: string;
  };
  const upsertRows: UpsertRow[] = [];

  function check(
    type: PersonalRecordType,
    isBetter: boolean,
    row: Partial<UpsertRow>
  ) {
    if (isBetter) {
      newRecords.push(type);
      upsertRows.push({ user_id: userId, record_type: type, achieved_at: now, run_id: run.id, ...row });
    }
  }

  // Best overall pace
  if (paceSeconds !== null) {
    const ex = map["best_pace"];
    check("best_pace", !ex || paceSeconds < (ex.value_seconds ?? Infinity), { value_seconds: paceSeconds });
  }

  // Longest run
  if (run.distance > 0) {
    const ex = map["longest_run"];
    check("longest_run", !ex || run.distance > (ex.value_km ?? 0), { value_km: run.distance });
  }

  // Best 5K pace (runs ≥ 5 km)
  if (run.distance >= 5 && paceSeconds !== null) {
    const ex = map["best_5k_pace"];
    check("best_5k_pace", !ex || paceSeconds < (ex.value_seconds ?? Infinity), { value_seconds: paceSeconds });
  }

  // Best 10K pace (runs ≥ 10 km)
  if (run.distance >= 10 && paceSeconds !== null) {
    const ex = map["best_10k_pace"];
    check("best_10k_pace", !ex || paceSeconds < (ex.value_seconds ?? Infinity), { value_seconds: paceSeconds });
  }

  // Best half marathon pace (runs ≥ 21.1 km)
  if (run.distance >= 21.1 && paceSeconds !== null) {
    const ex = map["best_half_pace"];
    check("best_half_pace", !ex || paceSeconds < (ex.value_seconds ?? Infinity), { value_seconds: paceSeconds });
  }

  if (upsertRows.length > 0) {
    const { error } = await supabase
      .from("personal_records")
      .upsert(upsertRows, { onConflict: "user_id,record_type" });
    if (error) console.error("[personal-records] upsert error:", error.code, error.message);
  }

  return newRecords;
}

/** Fetch all personal records for a user. */
export async function getUserPersonalRecords(
  supabase: SupabaseClient,
  userId: string
): Promise<PersonalRecord[]> {
  const { data } = await supabase
    .from("personal_records")
    .select("record_type, value_seconds, value_km, achieved_at")
    .eq("user_id", userId);

  return ((data ?? []) as DbRow[]).map((r) => ({
    recordType: r.record_type as PersonalRecordType,
    valueSeconds: r.value_seconds,
    valueKm: r.value_km,
    achievedAt: r.achieved_at,
  }));
}
