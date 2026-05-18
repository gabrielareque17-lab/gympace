/**
 * All date display in GymPace uses America/Manaus (UTC-4) so that server-side
 * rendering (Vercel, UTC) and client browsers produce identical output.
 * The database always stores UTC — only the display layer converts here.
 */

export const APP_TZ = "America/Manaus";

/** Returns "YYYY-MM-DD" for a Date in the app timezone. */
function localDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year:  "numeric",
    month: "2-digit",
    day:   "2-digit",
  }).format(date);
}

function parts(dateStr: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: APP_TZ, ...opts })
    .formatToParts(new Date(dateStr));
}

function get(ps: Intl.DateTimeFormatPart[], type: string) {
  return ps.find((p) => p.type === type)?.value ?? "";
}

// ─── Public formatters ────────────────────────────────────────────────────────

/** "17 maio 2026 • 21:40" */
export function formatDateTime(dateStr: string): string {
  const ps = parts(dateStr, {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  return `${get(ps, "day")} ${get(ps, "month")} ${get(ps, "year")} • ${get(ps, "hour")}:${get(ps, "minute")}`;
}

/** "17 mai." */
export function formatShortDate(dateStr: string): string {
  const ps = parts(dateStr, { day: "numeric", month: "short" });
  return `${get(ps, "day")} ${get(ps, "month")}`;
}

/** "17 de maio de 2026" */
export function formatLongDate(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TZ,
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(dateStr));
}

/** "Hoje" | "Ontem" | "17 mai." */
export function formatDateLabel(dateStr: string): string {
  if (!dateStr) return "--";
  const todayKey = localDateKey(new Date());
  const dateKey  = localDateKey(new Date(dateStr));

  // Parse as local calendar dates so we compare by day, not by ms
  const [ty, tm, td] = todayKey.split("-").map(Number);
  const [dy, dm, dd] = dateKey.split("-").map(Number);
  const diffDays = Math.round(
    (Date.UTC(ty, tm - 1, td) - Date.UTC(dy, dm - 1, dd)) / 86_400_000,
  );

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return formatShortDate(dateStr);
}

/**
 * Relative time for notification badges: "agora" | "5m" | "2h" | "3d" | "17 mai."
 * Falls back to formatShortDate after 7 days.
 */
export function formatRelativeTime(dateStr: string): string {
  const diffMs   = Date.now() - new Date(dateStr).getTime();
  const diffMin  = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay  = Math.floor(diffHour / 24);

  if (diffMin  < 1)  return "agora";
  if (diffMin  < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay  < 7)  return `${diffDay}d`;
  return formatShortDate(dateStr);
}

/**
 * Verbose relative time for the feed: "agora" | "há 5 min" | "há 2h" | "ontem" | "há 3 dias" | "há 1 sem"
 */
export function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1)   return "agora";
  if (m < 60)  return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `há ${h}h`;
  if (h < 48)  return "ontem";
  const d = Math.floor(h / 24);
  if (d < 7)   return `há ${d} dias`;
  return `há ${Math.floor(d / 7)} sem`;
}

// ─── Feed date grouping ───────────────────────────────────────────────────────

export type DateGroup = "hoje" | "ontem" | "semana" | "anterior";

export function getDateGroup(dateStr: string): DateGroup {
  const todayKey = localDateKey(new Date());
  const dateKey  = localDateKey(new Date(dateStr));

  const [ty, tm, td] = todayKey.split("-").map(Number);
  const [dy, dm, dd] = dateKey.split("-").map(Number);
  const diffDays = Math.round(
    (Date.UTC(ty, tm - 1, td) - Date.UTC(dy, dm - 1, dd)) / 86_400_000,
  );

  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "ontem";
  if (diffDays <= 7)  return "semana";
  return "anterior";
}
