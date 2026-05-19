const ONESIGNAL_API = 'https://onesignal.com/api/v1/notifications'

export interface PushPayload {
  playerIds: string[]
  title: string
  message: string
  data?: Record<string, unknown>
}

export interface PushSegmentPayload {
  segment?: string
  title: string
  message: string
  data?: Record<string, unknown>
}

function buildHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Basic ${apiKey}`,
  }
}

/**
 * Send push to specific player IDs (individual users).
 * Silently no-ops if env vars are missing or playerIds is empty.
 */
export async function sendPushNotification({
  playerIds,
  title,
  message,
  data,
}: PushPayload): Promise<void> {
  const appId = process.env.ONESIGNAL_APP_ID
  const apiKey = process.env.ONESIGNAL_API_KEY
  if (!appId || !apiKey || playerIds.length === 0) return

  const body = {
    app_id: appId,
    include_player_ids: playerIds,
    headings: { en: title, pt: title },
    contents: { en: message, pt: message },
    data: data ?? {},
    chrome_web_icon: '/icon-192x192.png',
    chrome_web_badge: '/icon-192x192.png',
  }

  const res = await fetch(ONESIGNAL_API, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    console.error('[sendPush] OneSignal error:', await res.text())
  }
}

/**
 * Send push to all subscribers via a OneSignal segment.
 * Defaults to the built-in "All" segment.
 */
export async function sendPushToSegment({
  segment = 'All',
  title,
  message,
  data,
}: PushSegmentPayload): Promise<void> {
  const appId = process.env.ONESIGNAL_APP_ID
  const apiKey = process.env.ONESIGNAL_API_KEY
  if (!appId || !apiKey) return

  const body = {
    app_id: appId,
    included_segments: [segment],
    headings: { en: title, pt: title },
    contents: { en: message, pt: message },
    data: data ?? {},
    chrome_web_icon: '/icon-192x192.png',
    chrome_web_badge: '/icon-192x192.png',
  }

  const res = await fetch(ONESIGNAL_API, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    console.error('[sendPushSegment] OneSignal error:', await res.text())
  }
}
