"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FeedCard } from "@/components/feed/FeedCard";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { useNavBadgeContext } from "@/components/providers/nav-badge-provider";
import type { FeedEvent } from "@/lib/feed";
import {
  getDateGroup,
  type DateGroup,
} from "@/lib/date-utils";

const GROUP_LABELS: Record<DateGroup, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  semana: "Esta semana",
  anterior: "Anteriores",
};

const GROUP_ORDER: DateGroup[] = ["hoje", "ontem", "semana", "anterior"];
const FILTERS = [
  { key: "all", label: "Tudo" },
  { key: "run", label: "Corrida" },
  { key: "workout", label: "Academia" },
  { key: "achievement", label: "Conquistas" },
  { key: "competition", label: "Competições" },
] as const;

function groupEvents(events: FeedEvent[]): Array<{ group: DateGroup; events: FeedEvent[] }> {
  const map = new Map<DateGroup, FeedEvent[]>();
  for (const event of events) {
    const g = getDateGroup(event.created_at);
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(event);
  }
  return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
    group: g,
    events: map.get(g)!,
  }));
}

type Props = {
  initialEvents: FeedEvent[];
  initialHasMore: boolean;
};

export function FeedList({ initialEvents, initialHasMore }: Props) {
  const [events, setEvents] = useState<FeedEvent[]>(initialEvents);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { markFeedSeen } = useNavBadgeContext();
  const seenRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Mark feed as seen when component mounts
  useEffect(() => {
    if (seenRef.current) return;
    seenRef.current = true;
    markFeedSeen();
  }, [markFeedSeen]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    const oldest = events[events.length - 1];
    if (!oldest) return;

    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/feed?limit=15&before=${encodeURIComponent(oldest.created_at)}&before_id=${encodeURIComponent(oldest.id)}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        const newEvents: FeedEvent[] = data.events ?? [];
        setEvents((prev) => [...prev, ...newEvents]);
        setHasMore(newEvents.length >= 15);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingMore(false);
    }
  }, [events, hasMore, isLoadingMore]);

  // IntersectionObserver — auto-load when sentinel scrolls into view
  const loadMoreRef = useRef(loadMore);
  useEffect(() => { loadMoreRef.current = loadMore; });

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMoreRef.current(); },
      { rootMargin: "300px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore]);

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    if (filter === "run" || filter === "workout") return events.filter((e) => e.event_type === filter);
    if (filter === "achievement") {
      return events.filter((e) => ["level_up", "exclusive_trophy", "rank_reached", "streak_milestone", "personal_record"].includes(e.event_type));
    }
    if (filter === "competition") return events.filter((e) => ["competition_joined", "challenge_accepted", "challenge_won"].includes(e.event_type));
    return events;
  }, [events, filter]);
  const groupsFiltered = useMemo(() => groupEvents(filteredEvents), [filteredEvents]);

  const refreshTop = useCallback(async () => {
    const newest = events[0];
    if (!newest) return;
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/feed?limit=20", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const latest: FeedEvent[] = data.events ?? [];
      const merged = [...latest, ...events];
      const dedup = Array.from(new Map(merged.map((e) => [e.id, e])).values())
        .sort((a, b) => (a.created_at > b.created_at ? -1 : 1));
      setEvents(dedup);
      setNewCount(0);
    } finally {
      setIsRefreshing(false);
    }
  }, [events]);

  useEffect(() => {
    const t = setInterval(async () => {
      const newest = events[0];
      if (!newest) return;
      const res = await fetch("/api/feed?limit=5", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const latest: FeedEvent[] = data.events ?? [];
      const incoming = latest.filter((e) => e.created_at > newest.created_at).length;
      if (incoming > 0) setNewCount(incoming);
    }, 30000);
    return () => clearInterval(t);
  }, [events]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${filter===f.key ? "bg-[#B6FF00]/14 text-[#B6FF00]" : "bg-white/[0.04] text-[#F5F5F5]/45"}`}>
            {f.label}
          </button>
        ))}
        {newCount > 0 && (
          <button onClick={refreshTop} disabled={isRefreshing} className="ml-auto rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-3 py-1 text-[11px] font-semibold text-[#22D3EE]">
            {isRefreshing ? "Atualizando..." : `${newCount} novas publicações`}
          </button>
        )}
      </div>
      {groupsFiltered.map(({ group, events: groupEvents }) => (
        <section key={group}>
          <div className="mb-2 flex items-center gap-3 px-0.5 pb-0.5">
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/30">
              {GROUP_LABELS[group]}
            </span>
            <div className="h-px flex-1 bg-white/[0.05]" />
          </div>
          <div className="space-y-2">
            {groupEvents.map((event) => (
              <FeedCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ))}

      {/* Load more sentinel + button */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center pb-2 pt-1">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.04] px-5 py-2.5 text-[12px] font-semibold text-[#F5F5F5]/45 transition-all duration-150 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-[#F5F5F5]/70 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border border-[#F5F5F5]/20 border-t-[#B6FF00]/70" />
                Carregando...
              </>
            ) : (
              "Carregar mais"
            )}
          </button>
        </div>
      )}

      {isLoadingMore && <FeedSkeleton count={2} />}
    </div>
  );
}
