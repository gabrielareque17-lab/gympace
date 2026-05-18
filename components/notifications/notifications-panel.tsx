"use client";

import {
  Bell,
  BellOff,
  CheckCheck,
  Swords,
  Trophy,
  UserPlus,
  Zap,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/hooks/use-notifications";
import { formatRelativeTime } from "@/lib/date-utils";

interface TypeConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
}

const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
  new_follower: {
    icon: UserPlus,
    color: "#B6FF00",
    bg: "rgba(182,255,0,0.08)",
  },
  challenge_invite: {
    icon: Swords,
    color: "#22D3EE",
    bg: "rgba(34,211,238,0.08)",
  },
  gympace_update: {
    icon: Zap,
    color: "#B6FF00",
    bg: "rgba(182,255,0,0.08)",
  },
  general: {
    icon: Bell,
    color: "#94A3B8",
    bg: "rgba(148,163,184,0.08)",
  },
  achievement: {
    icon: Trophy,
    color: "#EAB308",
    bg: "rgba(234,179,8,0.08)",
  },
};


interface NotificationsPanelProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export function NotificationsPanel({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClose,
}: NotificationsPanelProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-t-3xl border-t border-x border-white/[0.09] bg-[#0D0D0D] md:rounded-2xl md:border"
      style={{ boxShadow: "0 -8px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)" }}
    >
      {/* Mobile drag handle */}
      <div className="flex justify-center pb-1 pt-3 md:hidden">
        <div className="h-[5px] w-10 rounded-full bg-white/[0.14]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#F5F5F5]/90">Notificações</span>
          {unreadCount > 0 && (
            <span
              className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-[#080808]"
              style={{
                background: "#B6FF00",
                boxShadow: "0 0 8px rgba(182,255,0,0.5)",
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-[#F5F5F5]/38 transition-all duration-150 hover:bg-white/[0.04] hover:text-[#F5F5F5]/65"
          >
            <CheckCheck className="size-3.5" strokeWidth={2} />
            Marcar tudo como lido
          </button>
        )}
      </div>

      {/* List — constrained height on both mobile and desktop */}
      <div className="max-h-[60vh] overflow-y-auto overscroll-contain md:max-h-[420px]">
        {notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={onMarkRead}
                onClose={onClose}
              />
            ))}
          </ul>
        )}
      </div>

      {/* iPhone home-indicator safe area */}
      <div className="h-safe-bottom md:hidden" style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
  onClose,
}: {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}) {
  const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.general;
  const Icon = config.icon;

  function handleClick() {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    onClose();
  }

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors duration-150",
          notification.read
            ? "hover:bg-white/[0.02]"
            : "bg-white/[0.025] hover:bg-white/[0.04]"
        )}
      >
        {/* Icon with unread dot */}
        <div className="relative mt-0.5 shrink-0">
          <div
            className="grid size-8 place-items-center rounded-xl"
            style={{ background: config.bg }}
          >
            <Icon
              className="size-4"
              strokeWidth={1.8}
              style={{ color: config.color }}
            />
          </div>
          {!notification.read && (
            <span
              className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[#B6FF00]"
              style={{ boxShadow: "0 0 6px rgba(182,255,0,0.7)" }}
            />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-[13px] font-semibold leading-snug",
              notification.read ? "text-[#F5F5F5]/55" : "text-[#F5F5F5]/90"
            )}
          >
            {notification.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-[#F5F5F5]/38">
            {notification.message}
          </p>
        </div>

        {/* Time */}
        <span className="mt-0.5 shrink-0 text-[11px] tabular-nums text-[#F5F5F5]/25">
          {formatRelativeTime(notification.created_at)}
        </span>
      </button>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-10">
      <div
        className="grid size-12 place-items-center rounded-2xl border border-white/[0.06]"
        style={{ background: "rgba(182,255,0,0.04)" }}
      >
        <BellOff className="size-5 text-[#F5F5F5]/20" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-[#F5F5F5]/45">Tudo em dia</p>
        <p className="mt-0.5 text-[12px] text-[#F5F5F5]/25">
          Novas notificações aparecem aqui
        </p>
      </div>
    </div>
  );
}
