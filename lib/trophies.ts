import type { SupabaseClient } from "@supabase/supabase-js";

import { createFeedEvent } from "@/lib/feed";
import { sendPushNotification } from "@/lib/send-push";

export type AwardTrophyInput = {
  userId: string;
  trophyId: string;
  awardedBy?: string | null;
  note?: string | null;
  feed?: boolean;
  push?: boolean;
};

export type AwardTrophyResult =
  | { ok: true; grant: Record<string, unknown>; alreadyHad: false }
  | { ok: true; grant: Record<string, unknown> | null; alreadyHad: true }
  | { ok: false; error: string; status: number };

type TrophyRow = {
  id: string;
  name: string;
  rarity: string | null;
  visual?: string | null;
};

type ProfileRow = {
  user_id: string;
  username: string | null;
  onesignal_player_id: string | null;
};

/**
 * Central trophy engine for exclusive/admin trophy grants.
 * It handles validation, anti-duplication, notifications, optional push and
 * optional feed publication. Automatic achievement trophies remain derived
 * from activity stats, but should call this when they become persisted grants.
 */
export async function awardTrophy(
  supabase: SupabaseClient,
  input: AwardTrophyInput
): Promise<AwardTrophyResult> {
  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("user_id, username, onesignal_player_id")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (targetError) return { ok: false, error: targetError.message, status: 500 };
  if (!target) return { ok: false, error: "Usuario nao encontrado", status: 404 };

  const { data: trophy, error: trophyError } = await supabase
    .from("exclusive_trophies")
    .select("id, name, rarity, visual")
    .eq("id", input.trophyId)
    .maybeSingle();

  if (trophyError) return { ok: false, error: trophyError.message, status: 500 };
  if (!trophy) return { ok: false, error: "Trofeu nao encontrado", status: 404 };

  const { data: existing, error: existingError } = await supabase
    .from("user_trophies")
    .select("id, user_id, trophy_id, awarded_at, awarded_by, note")
    .eq("user_id", input.userId)
    .eq("trophy_id", input.trophyId)
    .maybeSingle();

  if (existingError) return { ok: false, error: existingError.message, status: 500 };
  if (existing) return { ok: true, grant: existing as Record<string, unknown>, alreadyHad: true };

  const { data: grant, error: grantError } = await supabase
    .from("user_trophies")
    .insert({
      user_id: input.userId,
      trophy_id: input.trophyId,
      awarded_by: input.awardedBy ?? null,
      note: input.note?.trim() || null,
    })
    .select("id, user_id, trophy_id, awarded_at, awarded_by, note")
    .single();

  if (grantError) {
    if (grantError.code === "23505") return { ok: true, grant: null, alreadyHad: true };
    return { ok: false, error: grantError.message, status: 500 };
  }

  await notifyTrophyAwarded(supabase, target as ProfileRow, trophy as TrophyRow, input);

  if (input.feed) {
    await createFeedEvent(supabase, {
      userId: input.userId,
      eventType: "exclusive_trophy",
      dedupeKey: `exclusive_trophy:${input.trophyId}`,
      payload: {
        trophy_id: input.trophyId,
        trophy_name: (trophy as TrophyRow).name,
        rarity: (trophy as TrophyRow).rarity ?? "rare",
        visual: (trophy as TrophyRow).visual ?? "trophy",
      },
    });
  }

  return { ok: true, grant: grant as Record<string, unknown>, alreadyHad: false };
}

async function notifyTrophyAwarded(
  supabase: SupabaseClient,
  target: ProfileRow,
  trophy: TrophyRow,
  input: AwardTrophyInput
) {
  await supabase.from("notifications").insert({
    user_id: input.userId,
    type: "exclusive_trophy",
    title: "Trofeu exclusivo recebido",
    message: `Voce recebeu: ${trophy.name}`,
    data: { trophy_id: input.trophyId },
  });

  if (input.push === false || !target.onesignal_player_id) return;

  await sendPushNotification({
    playerIds: [target.onesignal_player_id],
    title: "Trofeu exclusivo recebido",
    message: `Voce recebeu: ${trophy.name}`,
    data: { type: "exclusive_trophy", trophy_id: input.trophyId },
  });
}
