"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const { markFeedSeen } = useNavBadgeContext();
  const seenRef = useRef(false);

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

  const groups = groupEvents(events);

  return (
    <div className="space-y-5">
      {groups.map(({ group, events: groupEvents }) => (
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

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pb-2 pt-1">
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

      {isLoadingMore && <FeedSkeleton count={3} />}
    </div>
  );
}
