"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FeedCard } from "@/components/feed/FeedCard";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
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
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Map of event.id → flat index for initial events only — used for stagger delay
  const initialAnimDelay = useMemo(
    () => new Map(initialEvents.map((e, i) => [e.id, i])),
    [initialEvents]
  );

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    const oldest = events[events.length - 1];
    if (!oldest) return;

    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/feed?limit=15&before=${encodeURIComponent(oldest.created_at)}`,
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

  const groups = useMemo(() => groupEvents(events), [events]);

  return (
    <div className="space-y-5">
      {groups.map(({ group, events: groupEvents }) => (
        <section key={group}>
          <div className="mb-3 flex items-center gap-3 px-0.5">
            <span className="shrink-0 text-[11px] font-black uppercase tracking-[0.16em] text-[#F5F5F5]/42">
              {GROUP_LABELS[group]}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent" />
          </div>
          <div className="space-y-3">
            {groupEvents.map((event) => {
              const idx = initialAnimDelay.get(event.id);
              return (
                <div
                  key={event.id}
                  className={idx !== undefined ? "gp-card-enter" : undefined}
                  style={idx !== undefined ? { animationDelay: `${Math.min(idx, 6) * 55}ms` } : undefined}
                >
                  <FeedCard event={event} />
                </div>
              );
            })}
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
            className="flex items-center gap-2 rounded-full border border-[#B6FF00]/18 bg-[#B6FF00]/[0.05] px-5 py-2.5 text-[12px] font-semibold text-[#B6FF00]/55 transition-all duration-150 hover:border-[#B6FF00]/28 hover:bg-[#B6FF00]/[0.09] hover:text-[#B6FF00]/80 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
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
