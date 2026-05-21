"use client";

import { useEffect, useRef, useState } from "react";

type GpsPoint = { lat: number; lng: number };
type SvgPt = { x: number; y: number };

const W = 300;
const H = 148;
const PAD = 16;

function projectPoints(pts: GpsPoint[]): SvgPt[] {
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;
  const cosLat = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
  const adjLng = lngRange * cosLat;

  const drawW = W - PAD * 2;
  const drawH = H - PAD * 2;
  const scale = Math.min(drawW / adjLng, drawH / latRange);
  const ox = PAD + (drawW - adjLng * scale) / 2;
  const oy = PAD + (drawH - latRange * scale) / 2;

  return pts.map((p) => ({
    x: ox + (p.lng - minLng) * cosLat * scale,
    y: oy + (maxLat - p.lat) * scale,
  }));
}

type Props = { runId: string };
type State = "idle" | "loading" | "done" | "empty";

export function FeedRoutePreview({ runId }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>("idle");
  const [projected, setProjected] = useState<SvgPt[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        setState("loading");
        fetch(`/api/runs/${runId}/route`)
          .then((r) => r.json())
          .then((d: { route_points?: GpsPoint[] }) => {
            const pts = d.route_points ?? [];
            if (pts.length < 2) return setState("empty");
            setProjected(projectPoints(pts));
            setState("done");
          })
          .catch(() => setState("empty"));
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [runId]);

  if (state === "empty") return null;

  const polyline = projected.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const start = projected[0];
  const end = projected[projected.length - 1];

  return (
    <div
      ref={ref}
      className="mt-2.5 overflow-hidden rounded-xl border border-white/[0.06] bg-[#080808]"
      style={{ height: state === "loading" ? 40 : H }}
    >
      {state === "loading" && (
        <div className="flex h-full items-center justify-center">
          <span className="h-px w-10 animate-pulse rounded-full bg-white/[0.12]" />
        </div>
      )}

      {state === "done" && (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block" }}
        >
          {/* Glow behind route */}
          <polyline
            points={polyline}
            fill="none"
            stroke="#B6FF00"
            strokeWidth="8"
            strokeOpacity="0.07"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Route line */}
          <polyline
            points={polyline}
            fill="none"
            stroke="#B6FF00"
            strokeWidth="2.5"
            strokeOpacity="0.88"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Start dot — cyan */}
          <circle cx={start.x} cy={start.y} r="4.5" fill="#22D3EE" opacity="0.95" />
          <circle cx={start.x} cy={start.y} r="8.5" fill="none" stroke="#22D3EE" strokeWidth="1.2" opacity="0.22" />
          {/* End dot — lime */}
          <circle cx={end.x} cy={end.y} r="4.5" fill="#B6FF00" opacity="0.95" />
          <circle cx={end.x} cy={end.y} r="8.5" fill="none" stroke="#B6FF00" strokeWidth="1.2" opacity="0.22" />
        </svg>
      )}
    </div>
  );
}
