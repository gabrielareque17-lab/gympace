"use client";

import dynamic from "next/dynamic";

import type { AnalyticsData } from "@/lib/analytics";

const AnalyticsDashboard = dynamic(
  () =>
    import("@/components/analytics/analytics-dashboard").then(
      (m) => m.AnalyticsDashboard
    ),
  {
    ssr: false,
    loading: () => <AnalyticsSkeleton />,
  }
);

export function AnalyticsShell({ data }: { data: AnalyticsData }) {
  return <AnalyticsDashboard data={data} />;
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-[132px] animate-pulse rounded-2xl border border-white/[0.07] bg-[#111111]"
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_272px]">
        <div className="h-[300px] animate-pulse rounded-2xl border border-white/[0.07] bg-[#111111]" />
        <div className="h-[300px] animate-pulse rounded-2xl border border-white/[0.07] bg-[#111111]" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-[260px] animate-pulse rounded-2xl border border-white/[0.07] bg-[#111111]" />
        <div className="h-[260px] animate-pulse rounded-2xl border border-white/[0.07] bg-[#111111]" />
      </div>

      <div className="h-[220px] animate-pulse rounded-2xl border border-white/[0.07] bg-[#111111]" />
    </div>
  );
}
