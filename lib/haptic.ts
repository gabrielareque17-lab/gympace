type HapticStyle = "light" | "medium" | "heavy";

const PATTERNS: Record<HapticStyle, number[]> = {
  light:  [10],
  medium: [20],
  heavy:  [40],
};

/**
 * Triggers a short vibration when supported (Android Chrome).
 * Silently no-ops on iOS (Safari blocks navigator.vibrate in PWA context).
 */
export function haptic(style: HapticStyle = "light") {
  try {
    navigator.vibrate?.(PATTERNS[style]);
  } catch {
    // vibration API not available
  }
}
