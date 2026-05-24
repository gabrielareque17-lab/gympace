"use client";

import { useCallback, useEffect, useState } from "react";

export type NotificationType =
  | "new_follower"
  | "challenge_invite"
  | "gympace_update"
  | "general"
  | "achievement";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data: Record<string, unknown> | null;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.notifications ?? []);
      }
    } catch {
      // ignore network errors silently
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const firstFetch = setTimeout(fetchNotifications, 0);
    const interval = setInterval(fetchNotifications, 60_000);
    return () => {
      clearTimeout(firstFetch);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    } catch {
      // ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
    } catch {
      // ignore
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    refetch: fetchNotifications,
  };
}
