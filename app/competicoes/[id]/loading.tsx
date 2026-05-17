import { AppShell } from "@/components/ui/layout/app-shell";

function Sk({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

export default function CompetitionDetailLoading() {
  return (
    <AppShell>
      <div className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        {/* Back link skeleton */}
        <Sk className="mb-6 h-4 w-24" />

        <div className="max-w-3xl space-y-4">
          {/* Hero skeleton */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <Sk className="mt-0.5 size-12 shrink-0 rounded-2xl" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sk className="h-7 w-48" />
                    <Sk className="h-5 w-16 rounded-full" />
                  </div>
                  <Sk className="h-4 w-72" />
                  <Sk className="h-4 w-56" />
                </div>
              </div>
              <Sk className="h-9 w-28 rounded-xl" />
            </div>

            {/* Meta grid skeleton */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                  <Sk className="mb-2 h-2.5 w-12" />
                  <Sk className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard skeleton */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
            <div className="border-b border-white/[0.05] px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Sk className="h-2.5 w-16" />
                  <Sk className="h-5 w-28" />
                </div>
                <Sk className="h-6 w-12 rounded-full" />
              </div>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Sk className="size-7 rounded-full" />
                  <Sk className="size-8 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Sk className="h-4 w-32" />
                    <Sk className="h-[3px] w-full rounded-full" />
                  </div>
                  <Sk className="h-6 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
