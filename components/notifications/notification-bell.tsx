"use client";

import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationsPanel } from "./notifications-panel";

interface NotificationBellProps {
  /** "sidebar" renders the panel to the right of the 256px sidebar; "header" renders it below the mobile top bar */
  context?: "sidebar" | "header";
}

export function NotificationBell({ context = "header" }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Notificações"
        aria-expanded={isOpen}
        className={cn(
          "relative grid size-8 place-items-center rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B6FF00]/40",
          isOpen
            ? "bg-[#B6FF00]/10 text-[#B6FF00]"
            : "text-[#F5F5F5]/45 hover:bg-white/[0.05] hover:text-[#F5F5F5]/75"
        )}
      >
        <Bell
          className="size-[18px]"
          strokeWidth={isOpen ? 2.2 : 1.8}
          style={isOpen ? { filter: "drop-shadow(0 0 5px rgba(182,255,0,0.5))" } : undefined}
        />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} notificações não lidas`}
            className="absolute right-0.5 top-0.5 flex min-w-[14px] items-center justify-center rounded-full px-[3px] text-[8px] font-bold leading-[14px] text-[#080808]"
            style={{
              height: "14px",
              background: "#B6FF00",
              boxShadow: "0 0 8px rgba(182,255,0,0.65)",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-[98] bg-black/40 backdrop-blur-[2px] md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification panel — fixed position adapts to context */}
          <div
            className={cn(
              "fixed z-[99]",
              // Mobile: full width strip below top bar (notif-panel-top = safe-area-aware)
              "inset-x-3 notif-panel-top",
              // Desktop sidebar context: appears to the right of the 256px sidebar
              context === "sidebar" && "md:inset-x-auto md:left-[268px] md:w-[380px] md:top-4",
              // Desktop header context: appears to the right of the bell
              context === "header" && "md:inset-x-auto md:right-4 md:left-auto md:w-[380px] md:top-[62px]"
            )}
            style={{
              animation: "notifSlideIn 0.18s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <NotificationsPanel
              notifications={notifications}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </>
      )}

      <style>{`
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}
