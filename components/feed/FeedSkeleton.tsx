export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3.5 rounded-2xl border border-white/[0.06] bg-[#111111] p-4"
        >
          {/* Avatar skeleton */}
          <div className="relative mt-0.5 shrink-0">
            <div className="size-8 animate-pulse rounded-xl bg-white/[0.07]" />
            <div className="absolute -bottom-1 -right-1 size-[18px] animate-pulse rounded-full bg-white/[0.05]" />
          </div>

          {/* Content skeleton */}
          <div className="flex-1 space-y-2 pt-0.5">
            {/* Name + time row */}
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 animate-pulse rounded bg-white/[0.07]" />
              <div className="h-2.5 w-10 animate-pulse rounded bg-white/[0.04]" />
            </div>

            {/* Action text */}
            <div className="h-3 w-48 animate-pulse rounded bg-white/[0.05]" style={{ animationDelay: `${i * 80}ms` }} />

            {/* Stats row */}
            {i % 2 === 0 && (
              <div className="h-10 w-full animate-pulse rounded-xl bg-white/[0.03]" style={{ animationDelay: `${i * 100}ms` }} />
            )}

            {/* Tags */}
            <div className="flex gap-1.5">
              <div className="h-5 w-14 animate-pulse rounded-full bg-white/[0.04]" />
              <div className="h-5 w-10 animate-pulse rounded-full bg-white/[0.04]" />
            </div>

            {/* Footer */}
            <div className="flex justify-between pt-1">
              <div className="h-2.5 w-20 animate-pulse rounded bg-white/[0.03]" />
              <div className="h-6 w-12 animate-pulse rounded-full bg-white/[0.03]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
