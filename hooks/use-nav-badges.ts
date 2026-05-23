"use client";

import { useCallback, useEffect, useState } from "react";

export type NavBadges = {
  feed: number;
  challenges: number;
  trophies: number;
  competitions: number;
  updates: number;
};

const EMPTY: NavBadges = { feed: 0, challenges: 0, trophies: 0, competitions: 0, updates: 0 };

export function useNavBadges() {
  const [badges, setBadges] = useState<NavBadges>(EMPTY);

  const fetchBadges = useCallback(async () => {
    try {
      const res = await fetch("/api/feed/unread", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setBadges({
          feed: data.feed ?? 0,
          challenges: data.challenges ?? 0,
          trophies: data.trophies ?? 0,
          competitions: data.competitions ?? 0,
          updates: data.updates ?? 0,
        });
      }
    } catch {
      // ignore network errors
    }
  }, []);

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 60_000);
    return () => clearInterval(interval);
  }, [fetchBadges]);

  const markFeedSeen = useCallback(async () => {
    setBadges((prev) => ({ ...prev, feed: 0 }));
    try {
      await fetch("/api/feed/seen", { method: "PATCH", credentials: "include" });
    } catch {
      // ignore
    }
  }, []);

  return { badges, markFeedSeen, refetch: fetchBadges };
}
