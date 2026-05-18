"use client";

import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronDown,
  Swords,
  Trophy,
  UserPlus,
  Zap,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/hooks/use-notifications";
import { formatRelativeTime } from "@/lib/date-utils";

interface TypeConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
  getHref?: (data: Record<string, unknown> | null) => string | null;
}

const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
  new_follower: {
    icon: UserPlus,
    color: "#B6FF00",
    bg: "rgba(182,255,0,0.08)",
    getHref: (data) => {
      const username = data?.follower_username as string | undefined;
      return username ? `/perfil/${username}` : null;
    },
  },
  challenge_invite: {
    icon: Swords,
    color: "#22D3EE",
    bg: "rgba(34,211,238,0.08)",
    getHref: () => "/convites",
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
    getHref: () => "/perfil",
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div
      className="flex flex-col overflow-hidden rounded-t-3xl border-t border-x border-white/[0.09] bg-[#0D0D0D] md:rounded-2xl md:border"
      style={{ boxShadow: "0 -12px 60px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.05)" }}
    >
      {/* Mobile drag handle */}
      <div className="flex justify-center pb-2 pt-3.5 md:hidden">
        <div className="h-[5px] w-12 rounded-full bg-white/[0.16]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="text-[14px] font-bold tracking-tight text-[#F5F5F5]">
            Notificações
          </span>
          {unreadCount > 0 && (
            <span
              className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-[#080808]"
              style={{ background: "#B6FF00", boxShadow: "0 0 8px rgba(182,255,0,0.5)" }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[#F5F5F5]/40 transition-all duration-150 hover:bg-white/[0.05] hover:text-[#F5F5F5]/70 active:scale-[0.96]"
          >
            <CheckCheck className="size-3.5" strokeWidth={2} />
            Marcar tudo como lido
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-[65vh] overflow-y-auto overscroll-contain md:max-h-[460px]"
        style={{ scrollbarWidth: "none" }}
      >
        {notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <ul>
            {notifications.map((notification, i) => (
              <li
                key={notification.id}
                className={cn(i > 0 && "border-t border-white/[0.04]")}
              >
                <NotificationItem
                  notification={notification}
                  isExpanded={expandedId === notification.id}
                  onToggle={toggleExpanded}
                  onMarkRead={onMarkRead}
                  onClose={onClose}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* iPhone home-indicator safe area */}
      <div className="md:hidden" style={{ height: "env(safe-area-inset-bottom, 0px)", minHeight: "4px" }} />
    </div>
  );
}

function NotificationItem({
  notification,
  isExpanded,
  onToggle,
  onMarkRead,
  onClose,
}: {
  notification: AppNotification;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.general;
  const Icon = config.icon;
  const href = config.getHref?.(notification.data) ?? null;
  // Only show expand affordance for long messages without a navigation target
  const isExpandable = !href && notification.message.length > 40;

  function handleClick() {
    if (!notification.read) onMarkRead(notification.id);
    if (href) {
      onClose();
      router.push(href);
    } else if (isExpandable) {
      onToggle(notification.id);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group flex w-full items-start gap-4 px-5 py-4 text-left transition-colors duration-150",
        "active:scale-[0.99] active:bg-white/[0.04]",
        notification.read
          ? "hover:bg-white/[0.025]"
          : "bg-white/[0.03] hover:bg-white/[0.045]"
      )}
    >
      {/* Icon bubble with unread dot */}
      <div className="relative mt-0.5 shrink-0">
        <div
          className="grid size-9 place-items-center rounded-xl"
          style={{ background: config.bg }}
        >
          <Icon
            className="size-[18px]"
            strokeWidth={1.8}
            style={{ color: config.color }}
          />
        </div>
        {!notification.read && (
          <span
            className="absolute -right-0.5 -top-0.5 size-[9px] rounded-full bg-[#B6FF00]"
            style={{ boxShadow: "0 0 6px rgba(182,255,0,0.75)" }}
          />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Title + timestamp row */}
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              "text-[13px] font-semibold leading-snug",
              notification.read ? "text-[#F5F5F5]/50" : "text-[#F5F5F5]/92"
            )}
          >
            {notification.title}
          </p>
          <span className="mt-px shrink-0 text-[11px] tabular-nums text-[#F5F5F5]/25">
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>

        {/* Message — expands smoothly via max-height transition */}
        <div
          style={{
            maxHeight: isExpanded ? "300px" : "50px",
            overflow: "hidden",
            transition: "max-height 0.32s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <p
            className={cn(
              "mt-1 text-[12px] leading-relaxed",
              notification.read ? "text-[#F5F5F5]/32" : "text-[#F5F5F5]/48"
            )}
          >
            {notification.message}
          </p>
        </div>

        {/* Expand / collapse indicator */}
        {isExpandable && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#F5F5F5]/28">
            <ChevronDown
              className="size-3 transition-transform duration-300"
              style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
              strokeWidth={2.5}
            />
            <span>{isExpanded ? "Recolher" : "Ver mais"}</span>
          </div>
        )}

        {/* Subtle nav cue for tappable notifications */}
        {href && (
          <p className="mt-1.5 text-[10px]" style={{ color: config.color + "60" }}>
            {notification.type === "new_follower" && "Ver perfil →"}
            {notification.type === "challenge_invite" && "Ver convite →"}
            {notification.type === "achievement" && "Ver conquistas →"}
          </p>
        )}
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-14">
      <div
        className="grid size-14 place-items-center rounded-2xl border border-white/[0.06]"
        style={{ background: "rgba(182,255,0,0.04)" }}
      >
        <BellOff className="size-6 text-[#F5F5F5]/20" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-[#F5F5F5]/45">Tudo em dia</p>
        <p className="mt-1 text-[12px] text-[#F5F5F5]/25">
          Novas notificações aparecem aqui
        </p>
      </div>
    </div>
  );
}
