"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";

import type { GpsPoint } from "@/lib/geo";

type Props = {
  points: GpsPoint[];
  className?: string;
};

export function RouteMap({ points, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const polylineRef = useRef<Polyline | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);

  // Effect 1: initialise Leaflet map once
  useEffect(() => {
    if (!containerRef.current) return;

    let alive = true;

    async function init() {
      const L = (await import("leaflet")).default;

      if (!alive || !containerRef.current) return;

      // Inject Leaflet CSS exactly once
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      });

      // CartoDB DarkMatter — free, no API key, dark theme
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      mapRef.current = map;
      if (alive) setReady(true);
    }

    init().catch(console.error);

    return () => {
      alive = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        polylineRef.current = null;
        markersRef.current = [];
        setReady(false);
      }
    };
  }, []);

  // Effect 2: draw/update polyline when map is ready and points change
  useEffect(() => {
    if (!ready || !mapRef.current || points.length < 2) return;

    async function draw() {
      const L = (await import("leaflet")).default;
      const map = mapRef.current!;

      const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);

      if (polylineRef.current) {
        polylineRef.current.setLatLngs(latlngs);
      } else {
        polylineRef.current = L.polyline(latlngs, {
          color: "#B6FF00",
          weight: 5,
          opacity: 0.92,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
      }

      // Clear old markers then re-add start/end
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const dot = (color: string) =>
        L.divIcon({
          html: `<div style="width:11px;height:11px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.85);box-shadow:0 0 6px ${color}99;"></div>`,
          iconSize: [11, 11] as [number, number],
          className: "",
        });

      markersRef.current.push(
        L.marker([points[0].lat, points[0].lng], { icon: dot("#22D3EE") }).addTo(map),
        L.marker(
          [points[points.length - 1].lat, points[points.length - 1].lng],
          { icon: dot("#B6FF00") }
        ).addTo(map)
      );

      map.fitBounds(polylineRef.current!.getBounds(), { padding: [24, 24] });
    }

    draw().catch(console.error);
  }, [ready, points]);

  if (points.length < 2) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0D0D0D] ${className}`}
      >
        <p className="text-xs text-[#F5F5F5]/30">GPS não disponível</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`overflow-hidden rounded-2xl ${className}`} />
  );
}
