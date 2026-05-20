export type GpsPoint = {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy: number;
};

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function totalDistanceKm(points: GpsPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng
    );
  }
  return Math.round(total * 100) / 100;
}

export function estimateCalories(distanceKm: number): number {
  return Math.round(distanceKm * 70);
}

export function avgSpeedKmh(distanceKm: number, totalSeconds: number): number {
  if (totalSeconds <= 0 || distanceKm <= 0) return 0;
  return Math.round((distanceKm / (totalSeconds / 3600)) * 10) / 10;
}

export function secondsToPaceString(
  totalSeconds: number,
  distanceKm: number
): string {
  if (distanceKm <= 0 || totalSeconds <= 0) return "--:--";
  const paceSec = totalSeconds / distanceKm;
  const m = Math.floor(paceSec / 60);
  const s = Math.round(paceSec % 60);
  return s === 60
    ? `${m + 1}:00`
    : `${m}:${String(s).padStart(2, "0")}`;
}

export function secondsToDurationString(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export type GpsSignalQuality = "none" | "poor" | "ok" | "good" | "excellent";

export function gpsSignalQuality(accuracy: number | null): GpsSignalQuality {
  if (accuracy === null) return "none";
  if (accuracy > 50) return "poor";
  if (accuracy > 20) return "ok";
  if (accuracy > 8) return "good";
  return "excellent";
}
