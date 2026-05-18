"use client";

import { TrendingUp } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type WeeklyDataPoint = {
  week: string;
  km: number;
  pace: number | null;
};

function formatPace(value: number) {
  const minutes = Math.floor(value);
  const seconds = Math.round((value - minutes) * 100);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function WeeklyEvolutionChart({ data }: { data: WeeklyDataPoint[] }) {
  if (data.length === 0) {
    return (
      <section className="mt-3 sm:mt-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
        <div className="border-b border-white/[0.05] px-5 py-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
            Evolução semanal
          </p>
          <h2 className="text-base font-semibold text-[#F5F5F5]">Volume e pace</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mx-auto mb-3 grid size-10 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-[#F5F5F5]/22">
            <TrendingUp className="size-5" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-[#F5F5F5]/35">
            Nenhuma corrida registrada ainda
          </p>
          <p className="mt-1 text-xs text-[#F5F5F5]/20">
            Registre corridas para ver sua evolução semanal aqui
          </p>
        </div>
      </section>
    );
  }

  const paceValues = data
    .map((d) => d.pace)
    .filter((p): p is number => p !== null);
  const paceMin =
    paceValues.length > 0
      ? Math.max(4.0, Math.min(...paceValues) - 0.1)
      : 4.0;
  const paceMax =
    paceValues.length > 0
      ? Math.min(9.0, Math.max(...paceValues) + 0.2)
      : 7.0;

  return (
    <section className="mt-3 sm:mt-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
      <div className="flex flex-col gap-4 border-b border-white/[0.05] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
            Evolução semanal
          </p>
          <h2 className="text-base font-semibold text-[#F5F5F5]">
            Volume e pace
          </h2>
        </div>

        <div className="flex flex-wrap gap-4 text-xs font-medium text-[#F5F5F5]/45">
          <span className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#B6FF00] shadow-[0_0_8px_rgba(182,255,0,0.6)]" />
            KM semanal
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#F5F5F5]/50" />
            Pace médio
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="h-[270px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 8, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="kmGlow" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#B6FF00" stopOpacity={0.18} />
                  <stop offset="80%" stopColor="#B6FF00" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="rgba(245,245,245,0.05)"
                strokeDasharray="4 12"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(245,245,245,0.35)", fontSize: 11 }}
                dy={10}
              />
              <YAxis
                yAxisId="km"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(245,245,245,0.32)", fontSize: 11 }}
                domain={[0, "auto"]}
                tickFormatter={(value) => `${value}k`}
              />
              <YAxis
                yAxisId="pace"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(245,245,245,0.32)", fontSize: 11 }}
                domain={[paceMin, paceMax]}
                tickFormatter={(value) => formatPace(Number(value))}
              />
              <Tooltip
                cursor={{
                  stroke: "rgba(182,255,0,0.2)",
                  strokeDasharray: "4 8",
                  strokeWidth: 1,
                }}
                contentStyle={{
                  background: "#141414",
                  border: "1px solid rgba(245,245,245,0.08)",
                  borderRadius: "12px",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                  color: "#F5F5F5",
                  fontSize: "12px",
                }}
                labelStyle={{
                  color: "rgba(245,245,245,0.5)",
                  marginBottom: "4px",
                }}
                formatter={(value, name) => {
                  if (name === "km") {
                    return [`${value} km`, "KM semanal"];
                  }
                  return [formatPace(Number(value)), "Pace médio"];
                }}
              />
              <Area
                yAxisId="km"
                type="monotone"
                dataKey="km"
                fill="url(#kmGlow)"
                stroke="transparent"
              />
              <Line
                yAxisId="km"
                type="monotone"
                dataKey="km"
                stroke="#B6FF00"
                strokeWidth={2.5}
                dot={{
                  r: 3.5,
                  fill: "#B6FF00",
                  stroke: "#111111",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                  fill: "#B6FF00",
                  stroke: "#F5F5F5",
                  strokeWidth: 1.5,
                }}
              />
              <Line
                yAxisId="pace"
                type="monotone"
                dataKey="pace"
                stroke="rgba(245,245,245,0.55)"
                strokeWidth={1.5}
                strokeDasharray="5 7"
                dot={{
                  r: 3,
                  fill: "#111111",
                  stroke: "rgba(245,245,245,0.55)",
                  strokeWidth: 1.5,
                }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
