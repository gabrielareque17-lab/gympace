"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { GpsPoint } from "@/lib/geo";
import { haversineKm, totalDistanceKm } from "@/lib/geo";

export type TrackerState = "idle" | "running" | "paused" | "finished";
export type GpsStatus = "waiting" | "active" | "denied" | "unavailable";

export type RunSummary = {
  elapsedSeconds: number;
  distanceKm: number;
  points: GpsPoint[];
};

// Max realistic running speed in km/h — filters GPS jumps
const MAX_SPEED_KMH = 50;
// Max GPS accuracy in metres — skip noisier fixes
const MAX_ACCURACY_M = 50;
// Minimum distance between consecutive points to filter micro-jitter
const MIN_POINT_DISTANCE_KM = 0.003;

export function useRunTracker() {
  const [state, setState] = useState<TrackerState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("waiting");
  const [accuracy, setAccuracy] = useState<number | null>(null);

  // Timestamp-based timer refs — survive tab switches and screen-off
  const startedAtMsRef = useRef<number | null>(null);
  const totalPausedMsRef = useRef<number>(0);
  const pauseStartMsRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // GPS refs
  const watchIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<GpsPoint | null>(null);
  // Mirror of points state for synchronous reads in callbacks
  const pointsRef = useRef<GpsPoint[]>([]);

  const getElapsed = useCallback((): number => {
    if (!startedAtMsRef.current) return 0;
    const now = Date.now();
    const pausedMs =
      totalPausedMsRef.current +
      (pauseStartMsRef.current ? now - pauseStartMsRef.current : 0);
    return Math.max(0, Math.floor((now - startedAtMsRef.current - pausedMs) / 1000));
  }, []);

  const stopGps = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startGps = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsStatus("unavailable");
      return;
    }
    // Clear any orphaned watcher before starting a new one
    stopGps();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords;

        setGpsStatus("active");
        setAccuracy(acc);

        if (acc > MAX_ACCURACY_M) return;

        const timestamp = Date.now();
        const last = lastPointRef.current;

        if (last) {
          const dist = haversineKm(last.lat, last.lng, lat, lng);
          // Filter micro-jitter
          if (dist < MIN_POINT_DISTANCE_KM) return;
          // Filter GPS jumps (speed too high for a runner)
          const timeDiffH = (timestamp - last.timestamp) / 3_600_000;
          if (timeDiffH > 0 && dist / timeDiffH > MAX_SPEED_KMH) return;
        }

        const newPoint: GpsPoint = { lat, lng, timestamp, accuracy: acc };
        lastPointRef.current = newPoint;
        pointsRef.current = [...pointsRef.current, newPoint];
        setPoints(pointsRef.current);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus("denied");
          stopGps();
        } else {
          setGpsStatus("unavailable");
        }
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
    );
  }, [stopGps]);

  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds(getElapsed());
    }, 500);
  }, [getElapsed]);

  const start = useCallback(() => {
    startedAtMsRef.current = Date.now();
    totalPausedMsRef.current = 0;
    pauseStartMsRef.current = null;
    pointsRef.current = [];
    lastPointRef.current = null;
    setPoints([]);
    setElapsedSeconds(0);
    setGpsStatus("waiting");
    setAccuracy(null);
    setState("running");
    startTimer();
    startGps();
  }, [startTimer, startGps]);

  const pause = useCallback(() => {
    pauseStartMsRef.current = Date.now();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    stopGps();
    setState("paused");
  }, [stopGps]);

  const resume = useCallback(() => {
    if (pauseStartMsRef.current) {
      totalPausedMsRef.current += Date.now() - pauseStartMsRef.current;
      pauseStartMsRef.current = null;
    }
    setState("running");
    startTimer();
    startGps();
  }, [startTimer, startGps]);

  // Returns final data synchronously via refs so callers get it immediately
  const finish = useCallback((): RunSummary => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    stopGps();
    const finalElapsed = getElapsed();
    const finalPoints = [...pointsRef.current];
    const finalDistance = totalDistanceKm(finalPoints);
    setElapsedSeconds(finalElapsed);
    setState("finished");
    return { elapsedSeconds: finalElapsed, points: finalPoints, distanceKm: finalDistance };
  }, [stopGps, getElapsed]);

  const reset = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    stopGps();
    startedAtMsRef.current = null;
    totalPausedMsRef.current = 0;
    pauseStartMsRef.current = null;
    pointsRef.current = [];
    lastPointRef.current = null;
    setPoints([]);
    setElapsedSeconds(0);
    setGpsStatus("waiting");
    setAccuracy(null);
    setState("idle");
  }, [stopGps]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      stopGps();
    };
  }, [stopGps]);

  return {
    state,
    elapsedSeconds,
    distanceKm: totalDistanceKm(points),
    points,
    gpsStatus,
    accuracy,
    start,
    pause,
    resume,
    finish,
    reset,
  };
}
