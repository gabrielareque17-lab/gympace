"use client";

import { createContext, useContext } from "react";

import { useNavBadges, type NavBadges } from "@/hooks/use-nav-badges";

type NavBadgeContextValue = {
  badges: NavBadges;
  markFeedSeen: () => Promise<void>;
  refetch: () => Promise<void>;
};

const NavBadgeContext = createContext<NavBadgeContextValue>({
  badges: { feed: 0, challenges: 0, trophies: 0, competitions: 0, updates: 0 },
  markFeedSeen: async () => {},
  refetch: async () => {},
});

export function NavBadgeProvider({ children }: { children: React.ReactNode }) {
  const { badges, markFeedSeen, refetch } = useNavBadges();
  return (
    <NavBadgeContext.Provider value={{ badges, markFeedSeen, refetch }}>
      {children}
    </NavBadgeContext.Provider>
  );
}

export function useNavBadgeContext() {
  return useContext(NavBadgeContext);
}
