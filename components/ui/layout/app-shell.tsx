"use client";

import { useEffect, useState } from "react";
import { Menu, Zap } from "lucide-react";

import { ProfileProvider } from "@/components/providers/profile-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    createSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  return (
    <ProfileProvider>
      <div className="flex min-h-screen bg-[#0D0D0D] text-[#F5F5F5]">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <Sidebar email={email} />
        </div>

        {/* Mobile backdrop */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden",
            open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={() => setOpen(false)}
        />

        {/* Mobile drawer */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:hidden",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar email={email} onClose={() => setOpen(false)} />
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header
            className="flex shrink-0 items-center border-b border-white/[0.06] bg-[#090909]/95 px-4 backdrop-blur-xl md:hidden"
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

            {/* Spacer to balance the menu button */}
            <div className="size-9" aria-hidden="true" />
          </header>

          {/* Main content — extra bottom padding reserves space for the fixed bottom nav */}
          <div className="flex min-w-0 flex-1 flex-col pb-[calc(env(safe-area-inset-bottom,0px)+68px)] md:pb-0">
            {children}
          </div>
        </div>

        {/* Mobile bottom navigation */}
        <BottomNav />
      </div>
    </ProfileProvider>
  );
}
