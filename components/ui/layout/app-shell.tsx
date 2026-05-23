"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, Zap } from "lucide-react";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { NavBadgeProvider } from "@/components/providers/nav-badge-provider";
import { PresenceTracker } from "@/components/providers/presence-tracker";
import { ProfileProvider } from "@/components/providers/profile-provider";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { SeasonStartOverlay } from "@/components/seasons/season-start-overlay";
import { cn } from "@/lib/utils";
import { BottomNav } from "./bottom-nav";
import { PageTransition } from "./page-transition";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [bottomNavHidden, setBottomNavHidden] = useState(false);
  const playerIdSynced = useRef(false);

  // Sync OneSignal player ID once per session for the authenticated user.
  // Runs here (not in root layout) so the user is guaranteed to be logged in,
  // catching existing subscribers who never trigger the "change" event.
  useEffect(() => {
    if (playerIdSynced.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sync = (OneSignal: any) => {
      const sub = OneSignal?.User?.PushSubscription;
      if (!sub?.id || !sub?.optedIn) return;
      playerIdSynced.current = true;
      fetch("/api/user/player-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: sub.id }),
      }).catch(() => {});
    };

    // OneSignalDeferred executes callbacks immediately if SDK is already ready,
    // or queues them for when it initialises.
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      w.OneSignalDeferred = w.OneSignalDeferred ?? [];
      w.OneSignalDeferred.push(sync);
    }
  }, []);

  useEffect(() => {
    function onBottomNavVisibility(event: Event) {
      const customEvent = event as CustomEvent<{ hidden?: boolean }>;
      setBottomNavHidden(Boolean(customEvent.detail?.hidden));
    }

    window.addEventListener("gympace:bottom-nav-visibility", onBottomNavVisibility);
    return () => {
      window.removeEventListener("gympace:bottom-nav-visibility", onBottomNavVisibility);
    };
  }, []);

  return (
    <ProfileProvider>
    <NavBadgeProvider>
      <div className="flex min-h-dvh bg-[#0D0D0D] text-[#F5F5F5]">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Mobile backdrop */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/65 backdrop-blur-md transition-opacity duration-300 md:hidden",
            open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={() => setOpen(false)}
        />

        {/* Mobile drawer — iOS spring curve */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 md:hidden",
            open ? "translate-x-0" : "-translate-x-full"
          )}
          style={{ transition: "transform 360ms cubic-bezier(0.32, 0.72, 0, 1)" }}
        >
          <Sidebar onClose={() => setOpen(false)} />
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header
            className="sticky top-0 z-30 flex shrink-0 items-center border-b border-white/[0.06] bg-[#090909]/95 px-4 backdrop-blur-xl md:hidden"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              minHeight: "calc(3.5rem + env(safe-area-inset-top, 0px))",
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
              className="grid size-9 place-items-center rounded-xl text-[#F5F5F5]/45 transition-all duration-150 active:scale-90 active:bg-white/[0.06] hover:text-[#F5F5F5]/75"
            >
              <Menu className="size-5" strokeWidth={1.8} />
            </button>

            <div className="flex flex-1 items-center justify-center gap-2">
              <div
                className="grid size-7 place-items-center rounded-xl bg-[#B6FF00]"
                style={{ boxShadow: "0 0 14px rgba(182,255,0,0.30)" }}
              >
                <Zap className="size-3.5 text-[#080808]" strokeWidth={2.8} />
              </div>
              <span className="font-display text-[15px] font-bold tracking-tight">GymPace</span>
            </div>

            {/* Notification bell */}
            <NotificationBell context="header" />
          </header>

          {/* Main content — extra bottom padding reserves space for the fixed bottom nav */}
          <PageTransition
            className={cn(
              "md:pb-0",
              bottomNavHidden ? "pb-0" : "pb-[calc(env(safe-area-inset-bottom,0px)+84px)]"
            )}
          >
            {children}
          </PageTransition>
        </div>

        {/* Mobile bottom navigation */}
        <BottomNav hidden={bottomNavHidden} />
      </div>

      {/* PWA install prompt — shows only when not installed */}
      <InstallPrompt />
      <SeasonStartOverlay />
      <PresenceTracker />
    </NavBadgeProvider>
    </ProfileProvider>
  );
}
