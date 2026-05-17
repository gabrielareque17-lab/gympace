import { AppShell } from "@/components/ui/layout/app-shell";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

export default function AthleteProfileLoading() {
  return (
    <AppShell>
      <div className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        {/* Header skeleton */}
        <header className="mb-6 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-3 w-32" />
        </header>

        <div className="max-w-3xl space-y-4">
          {/* Hero card skeleton */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
              {/* Avatar */}
              <Skeleton className="size-20 shrink-0 rounded-2xl sm:size-24" />

              {/* Info */}
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-7 w-40" />
                  <Skeleton className="h-3 w-24" />
                  <div className="flex gap-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="mt-3 h-4 w-full max-w-xs" />
                  <Skeleton className="h-4 w-3/4 max-w-xs" />
                </div>

                <div className="flex gap-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-9 w-24 rounded-xl" />
                </div>

                {/* Level bar */}
                <div className="max-w-xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-[5px] w-full rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats grid skeleton */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="border-b border-white/[0.05] px-5 py-4 space-y-2">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-5 w-36" />
            </div>
            <div className="grid grid-cols-2 gap-px bg-white/[0.04] sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3 bg-[#111111] p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-7 rounded-lg" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </div>

          {/* Personal bests skeleton */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="border-b border-white/[0.05] px-5 py-4 space-y-2">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="grid px-5 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-4">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <Skeleton className="h-7 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap skeleton */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="border-b border-white/[0.05] px-5 py-4 space-y-2">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="p-5">
              <div className="flex gap-1.5">
                <div className="flex flex-col gap-1 pt-5">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="size-[14px] rounded-[3px]" />
                  ))}
                </div>
                <div className="flex gap-1 overflow-hidden">
                  {Array.from({ length: 16 }).map((_, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                      <Skeleton className="mb-1 h-4 w-[14px] rounded-sm" />
                      {Array.from({ length: 7 }).map((_, di) => (
                        <Skeleton key={di} className="size-[14px] rounded-[3px]" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Achievements skeleton */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="border-b border-white/[0.05] px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-2.5 w-24" />
                  <Skeleton className="h-5 w-28" />
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>

            {["Corrida", "Academia"].map((cat) => (
              <div key={cat} className="px-5 py-5">
                <div className="mb-4 flex items-center gap-2.5">
                  <Skeleton className="size-1.5 rounded-full" />
                  <Skeleton className="h-2.5 w-20" />
                  <div className="h-px flex-1 bg-white/[0.05]" />
                  <Skeleton className="h-2.5 w-8" />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3.5"
                    >
                      <Skeleton className="size-10 rounded-xl" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-2.5 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
