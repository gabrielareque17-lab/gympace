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
  // Increments on each "like" to remount Heart and retrigger the pop animation
  const [heartKey, setHeartKey] = useState(0);
  const [showFloat, setShowFloat] = useState(false);

  function handleToggle() {
    const nextReacted = !reacted;
    setReacted(nextReacted);
    setCount((c) => c + (nextReacted ? 1 : -1));

    if (nextReacted) {
      setHeartKey((k) => k + 1);
      setShowFloat(true);
      window.setTimeout(() => setShowFloat(false), 620);
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/feed/${feedEventId}/react`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) {
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
      className="mobile-tap relative inline-flex min-h-7 items-center gap-1 rounded-full border px-2 text-[11px] font-semibold transition-all duration-200 active:scale-95 disabled:opacity-70"
      style={
        reacted
          ? { background: "rgba(239,68,68,0.10)", borderColor: "rgba(239,68,68,0.22)", color: "#EF4444" }
          : { background: "rgba(255,255,255,0.035)", borderColor: "rgba(255,255,255,0.07)", color: "rgba(245,245,245,0.48)" }
      }
    >
      {showFloat && (
        <span
          className="gp-float-up pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#EF4444]"
          aria-hidden="true"
        >
          +1
        </span>
      )}
      <Heart
        key={heartKey}
        className={`size-3.5${reacted && heartKey > 0 ? " gp-heart-pop" : ""}`}
        strokeWidth={reacted ? 0 : 1.5}
        style={reacted ? { fill: "#EF4444" } : undefined}
      />
      {count > 0 && (
        <span className="font-semibold tabular-nums">{count}</span>
      )}
    </button>
  );
}
