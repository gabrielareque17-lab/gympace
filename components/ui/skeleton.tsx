import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("gp-shimmer rounded-xl", className)} />;
}

/** Skeleton card that mimics a feed/notification card */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-3.5 rounded-2xl border border-white/[0.06] bg-[#111111] p-4",
        className
      )}
    >
      {/* Avatar */}
      <Skeleton className="size-9 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        {/* Name row */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-2.5 w-10" />
        </div>
        {/* Content line 1 */}
        <Skeleton className="h-3 w-4/5" />
        {/* Tag row */}
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Stack of N skeleton cards */
export function SkeletonFeed({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Skeleton for a profile header */
export function SkeletonProfile() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="size-20 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
    </div>
  );
}
