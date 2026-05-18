"use client";

import dynamic from "next/dynamic";

import type { WeeklyDataPoint } from "./weekly-evolution-chart";

const WeeklyEvolutionChart = dynamic(
  () =>
    import("@/components/ui/charts/weekly-evolution-chart").then(
      (module) => module.WeeklyEvolutionChart
    ),
  {
    ssr: false,
    loading: () => (
      <section className="mt-3 sm:mt-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
        <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
          <div className="space-y-2">
            <div className="h-2 w-24 animate-pulse rounded-full bg-white/[0.06]" />
            <div className="h-4 w-36 animate-pulse rounded-full bg-white/[0.06]" />
          </div>
          <div className="flex gap-3">
            <div className="h-3 w-18 animate-pulse rounded-full bg-white/[0.06]" />
            <div className="h-3 w-16 animate-pulse rounded-full bg-white/[0.06]" />
          </div>
        </div>
        <div className="p-5">
          <div className="h-[270px] animate-pulse rounded-xl bg-white/[0.02]" />
        </div>
      </section>
    ),
  }
);

export function WeeklyEvolutionChartShell({ data }: { data: WeeklyDataPoint[] }) {
  return <WeeklyEvolutionChart data={data} />;
}
