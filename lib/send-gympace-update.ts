import { createSupabaseAdminClient } from "./supabase-admin";
import { sendPushToSegment } from "./send-push";

const BATCH_SIZE = 500;

export interface GymPaceUpdatePayload {
  title: string;
  message: string;
}

export interface SendResult {
  sent: number;
  error?: string;
}

/**
 * Sends a gympace_update notification to every user in the platform.
 * Uses the service-role client to bypass RLS and read all profiles.
 * Inserts in batches of 500 to stay within Supabase limits.
 */
export async function sendGymPaceUpdate({
  title,
  message,
}: GymPaceUpdatePayload): Promise<SendResult> {
  const supabase = createSupabaseAdminClient();

  const { data: profiles, error: fetchError } = await supabase
    .from("profiles")
    .select("user_id");

  if (fetchError) {
    return { sent: 0, error: fetchError.message };
  }

  if (!profiles || profiles.length === 0) {
    return { sent: 0 };
  }

  const rows = profiles.map((p: { user_id: string }) => ({
    user_id: p.user_id,
    type: "gympace_update",
    title,
    message,
  }));

  let sent = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await supabase
      .from("notifications")
      .insert(batch);

    if (insertError) {
      return { sent, error: insertError.message };
    }

    sent += batch.length;
  }

  // Push to all OneSignal subscribers
  await sendPushToSegment({ title, message, data: { type: 'gympace_update' } });

  return { sent };
}
