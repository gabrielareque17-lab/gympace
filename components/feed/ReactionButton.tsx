"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";

type Props = {
  feedEventId: string;
  initialCount: number;
  initialReacted: boolean;
};

export function ReactionButton({ feedEventId, initialCount, initialReacted }: Props) {
  const [reacted, setReacted] = useState(initialReacted);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    // Optimistic update
    const nextReacted = !reacted;
    setReacted(nextReacted);
    setCount((c) => c + (nextReacted ? 1 : -1));

    startTransition(async () => {
      try {
        const res = await fetch(`/api/feed/${feedEventId}/react`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) {
          // Revert on error
          setReacted(reacted);
          setCount(count);
        }
      } catch {
        setReacted(reacted);
        setCount(count);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={reacted ? "Remover curtida" : "Curtir"}
      className="mobile-tap flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all duration-200 active:scale-95 disabled:opacity-70"
      style={
        reacted
          ? { background: "rgba(239,68,68,0.10)", borderColor: "rgba(239,68,68,0.22)", color: "#EF4444" }
          : { background: "rgba(255,255,255,0.035)", borderColor: "rgba(255,255,255,0.07)", color: "rgba(245,245,245,0.48)" }
      }
    >
      <Heart
        className="size-3.5"
        strokeWidth={reacted ? 0 : 1.5}
        style={reacted ? { fill: "#EF4444" } : undefined}
      />
      {count > 0 && (
        <span className="font-semibold tabular-nums">{count}</span>
      )}
    </button>
  );
}
