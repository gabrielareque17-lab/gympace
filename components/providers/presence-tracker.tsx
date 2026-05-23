"use client";

import { useEffect } from "react";

const INTERVAL_MS = 60_000;

export function PresenceTracker() {
  useEffect(() => {
    function ping() {
      if (document.visibilityState === "hidden") return;
      fetch("/api/presence", { method: "POST" }).catch(() => {});
    }

    ping();
    const id = setInterval(ping, INTERVAL_MS);
    document.addEventListener("visibilitychange", ping);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", ping);
    };
  }, []);

  return null;
}
