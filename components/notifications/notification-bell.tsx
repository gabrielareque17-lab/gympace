"use client";

import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationsPanel } from "./notifications-panel";

interface NotificationBellProps {
  /** "sidebar" renders the panel to the right of the 256px sidebar; "header" renders it below the mobile top bar */
  context?: "sidebar" | "header";
}

export function NotificationBell({ context = "header" }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Close when clicking outside bell and outside panel
  useEffect(() => {
    if (!isOpen) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (bellRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setIsOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setIsOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (!isOpen) return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Bell trigger */}
      <button
        ref={bellRef}
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Notificações"
        aria-expanded={isOpen}
        className={cn(
          "relative grid size-8 place-items-center rounded-xl transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B6FF00]/40",
          "active:scale-90",
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
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} notificações não lidas`}
            className="absolute right-0.5 top-0.5 flex min-w-[14px] items-center justify-center rounded-full px-[3px] text-[8px] font-bold leading-[14px] text-[#080808]"
            style={{ height: "14px", background: "#B6FF00", boxShadow: "0 0 8px rgba(182,255,0,0.65)" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Portal — breaks out of every ancestor stacking context */}
      {mounted && isOpen && createPortal(
        <>
          <style>{`
            @keyframes notifBackdropIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes notifSheetIn {
              from { transform: translateY(100%); opacity: 0.6; }
              to   { transform: translateY(0);    opacity: 1;   }
            }
            @keyframes notifDropIn {
              from { opacity: 0; transform: translateY(-10px) scale(0.95); }
              to   { opacity: 1; transform: translateY(0)     scale(1);    }
            }
            .notif-backdrop-anim { animation: notifBackdropIn 0.2s ease both; }
            .notif-panel-anim    { animation: notifSheetIn 0.32s cubic-bezier(0.16,1,0.3,1) both; }
            @media (min-width: 768px) {
              .notif-panel-anim  { animation: notifDropIn 0.22s cubic-bezier(0.16,1,0.3,1) both; }
            }
          `}</style>

          {/* Backdrop: heavy blur on mobile, subtle on desktop */}
          <div
            className="notif-backdrop-anim fixed inset-0 z-[9998] md:bg-black/25 md:backdrop-blur-[2px]"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
            onClick={() => setIsOpen(false)}
          />

          {/* Panel wrapper */}
          <div
            ref={panelRef}
            className={cn(
              "notif-panel-anim fixed z-[9999]",
              // Mobile: full-width bottom sheet
              "inset-x-0 bottom-0",
              // Desktop: dropdown near the bell
              context === "sidebar" && "md:inset-x-auto md:bottom-auto md:left-[268px] md:top-4 md:w-[390px]",
              context === "header"  && "md:inset-x-auto md:bottom-auto md:right-4   md:top-[62px] md:w-[390px]",
            )}
          >
            <NotificationsPanel
              notifications={notifications}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </>,
        document.body
      )}
    </>
  );
}
