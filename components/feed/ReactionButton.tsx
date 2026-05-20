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
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition-all duration-200 active:scale-95"
      style={
        reacted
          ? { background: "rgba(239,68,68,0.08)", color: "#EF4444" }
          : { background: "transparent", color: "rgba(245,245,245,0.28)" }
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
