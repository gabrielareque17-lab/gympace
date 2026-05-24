export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      <style>{`
        @keyframes feedShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .feed-shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: feedShimmer 1.8s ease-in-out infinite;
        }
      `}</style>
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111111] p-4"
            style={{
              boxShadow: "0 2px 18px rgba(0,0,0,0.22)",
              animationDelay: `${i * 120}ms`,
            }}
          >
            {/* Top accent shimmer */}
            <div className="absolute inset-x-0 top-0 h-px bg-white/[0.04]" />

            <div className="flex gap-3">
              {/* Avatar skeleton */}
              <div className="mt-0.5 shrink-0">
                <div className="feed-shimmer size-8 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
              </div>

              {/* Content skeleton */}
              <div className="flex-1 space-y-2.5 pt-0.5">
                {/* Name + time row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="feed-shimmer h-3 w-28 rounded-lg" style={{ animationDelay: `${i * 80 + 40}ms` }} />
                  <div className="feed-shimmer h-2.5 w-10 rounded-md" style={{ animationDelay: `${i * 80 + 60}ms` }} />
                </div>

                {/* Type badge */}
                <div className="feed-shimmer h-4 w-16 rounded-full" style={{ animationDelay: `${i * 80 + 80}ms` }} />

                {/* Action text */}
                <div className="feed-shimmer h-3 w-52 rounded-lg" style={{ animationDelay: `${i * 80 + 100}ms` }} />

                {/* Stats row */}
                {i % 2 === 0 && (
                  <div
                    className="feed-shimmer h-9 w-full rounded-xl"
                    style={{ animationDelay: `${i * 80 + 120}ms` }}
                  />
                )}

                {/* Tags */}
                <div className="flex gap-1.5">
                  <div className="feed-shimmer h-4 w-14 rounded-full" style={{ animationDelay: `${i * 80 + 140}ms` }} />
                  <div className="feed-shimmer h-4 w-10 rounded-full" style={{ animationDelay: `${i * 80 + 160}ms` }} />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="feed-shimmer h-2.5 w-24 rounded-md" />
                  <div className="flex gap-1.5">
                    <div className="feed-shimmer h-6 w-12 rounded-full" />
                    <div className="feed-shimmer h-6 w-12 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
