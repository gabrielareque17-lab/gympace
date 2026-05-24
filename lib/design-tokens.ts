/**
 * GymPace Design Tokens — JS side
 *
 * These mirror the CSS custom properties in globals.css.
 * Use them for inline `style` props where Tailwind / CSS classes can't reach
 * (e.g. dynamic colors, canvas, charting libraries, box-shadow strings).
 *
 * CSS variables are the source of truth; keep these in sync.
 */

// ── Backgrounds ──────────────────────────────────────────────
export const GP_BG = {
  base:     "#080808",
  overlay:  "#090909",
  deep:     "#0B0B0B",
  sheet:    "#0D0D0D",
  surface:  "#111111",
  surface2: "#141414",
} as const

// ── Accent — neon green ──────────────────────────────────────
export const GP_ACCENT = "#B6FF00"

export const GP_ACCENT_ALPHA = {
  "04": "rgba(182,255,0,0.04)",
  "06": "rgba(182,255,0,0.06)",
  "10": "rgba(182,255,0,0.10)",
  "15": "rgba(182,255,0,0.15)",
  "20": "rgba(182,255,0,0.20)",
  "30": "rgba(182,255,0,0.30)",
  "55": "rgba(182,255,0,0.55)",
  "60": "rgba(182,255,0,0.60)",
} as const

// ── Secondary — workout blue ─────────────────────────────────
export const GP_BLUE = "#60A5FA"

export const GP_BLUE_ALPHA = {
  "10": "rgba(96,165,250,0.10)",
  "15": "rgba(96,165,250,0.15)",
  "20": "rgba(96,165,250,0.20)",
} as const

// ── Danger ───────────────────────────────────────────────────
export const GP_RED = "#EF4444"

export const GP_RED_ALPHA = {
  "10": "rgba(239,68,68,0.10)",
  "20": "rgba(239,68,68,0.20)",
} as const

// ── Text opacity stops — #F5F5F5 at each level ───────────────
export const GP_TEXT = {
  90: "rgba(245,245,245,0.90)",
  60: "rgba(245,245,245,0.60)",
  42: "rgba(245,245,245,0.42)",
  38: "rgba(245,245,245,0.38)",
  32: "rgba(245,245,245,0.32)",
  28: "rgba(245,245,245,0.28)",
  22: "rgba(245,245,245,0.22)",
  18: "rgba(245,245,245,0.18)",
  12: "rgba(245,245,245,0.12)",
} as const

// ── Border opacity stops ─────────────────────────────────────
export const GP_BORDER = {
  9:  "rgba(255,255,255,0.09)",
  7:  "rgba(255,255,255,0.07)",
  6:  "rgba(255,255,255,0.06)",
  5:  "rgba(255,255,255,0.05)",
  4:  "rgba(255,255,255,0.04)",
} as const

// ── Shadows ──────────────────────────────────────────────────
export const GP_SHADOW = {
  card:   "0 8px 32px rgba(0,0,0,0.40)",
  deep:   "0 32px 80px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.025)",
  sheet:  "0 -8px 48px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.04)",
  glow:   "0 0 28px rgba(182,255,0,0.55), 0 4px 16px rgba(0,0,0,0.55)",
  glowSm: "0 0 16px rgba(182,255,0,0.35)",
  glowXs: "0 0 8px  rgba(182,255,0,0.25)",
} as const

// ── Rank colors ──────────────────────────────────────────────
export const GP_RANK_COLORS: Record<string, string> = {
  rookie:   "#94A3B8",
  bronze:   "#60A5FA",
  silver:   "#22C55E",
  gold:     "#FB923C",
  platinum: "#A78BFA",
  elite:    "#B6FF00",
}

export const GP_RANK_LABELS: Record<string, string> = {
  rookie:   "Iniciante",
  bronze:   "Amador",
  silver:   "Intermediario",
  gold:     "Avancado",
  platinum: "Pro",
  elite:    "Elite",
}

/** Returns the hex color for a rank, falling back to rookie. */
export function rankColor(rank: string | null | undefined): string {
  return GP_RANK_COLORS[rank ?? "rookie"] ?? GP_RANK_COLORS.rookie
}

// ── Border radii (px) ────────────────────────────────────────
export const GP_RADIUS = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  "2xl": 24,
  "3xl": 28,
} as const

// ── Easing strings ───────────────────────────────────────────
export const GP_EASE = {
  default: "cubic-bezier(0.22, 1, 0.36, 1)",
  spring:  "cubic-bezier(0.34, 1.56, 0.64, 1)",
  in:      "cubic-bezier(0.4,  0,    1,    1)",
  out:     "cubic-bezier(0,    0,    0.2,  1)",
} as const

// ── Duration (ms) ────────────────────────────────────────────
export const GP_DURATION = {
  fast:   100,
  normal: 200,
  slow:   300,
  motion: 450,
} as const

// ── Z-index layers ───────────────────────────────────────────
export const GP_Z = {
  nav:     50,
  overlay: 9997,
  sheet:   9998,
  modal:   9999,
} as const
