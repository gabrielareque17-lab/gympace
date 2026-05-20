import { Dumbbell, Timer } from "lucide-react";

import { getLocalDateKey } from "@/lib/date-utils";

type Props = {
  runDays: string[];
  workoutDays: string[];
};

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];

function uniqueMonthDays(days: string[], monthPrefix: string) {
  return new Set(days.filter((day) => day.startsWith(monthPrefix)));
}

export function MonthlyActivityCalendar({ runDays, workoutDays }: Props) {
  const today = new Date(`${getLocalDateKey(new Date())}T12:00:00`);
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  const runSet = uniqueMonthDays(runDays, monthPrefix);
  const workoutSet = uniqueMonthDays(workoutDays, monthPrefix);
  const activeSet = new Set([...runSet, ...workoutSet]);

  const firstDay = new Date(year, month, 1, 12);
  const lastDay = new Date(year, month + 1, 0, 12);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));
  const end = new Date(lastDay);
  end.setDate(lastDay.getDate() + (6 - ((lastDay.getDay() + 6) % 7)));

  const cells: Date[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    cells.push(new Date(cursor));
  }

  const monthLabel = today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="p-4 sm:p-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold capitalize text-[#F5F5F5]/45">{monthLabel}</p>
          <p className="mt-0.5 text-xs text-[#F5F5F5]/28">
            {activeSet.size} {activeSet.size === 1 ? "dia ativo" : "dias ativos"} no mês
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#F5F5F5]/34">
          <span className="inline-flex items-center gap-1"><Timer className="size-3 text-[#B6FF00]" /> corrida</span>
          <span className="inline-flex items-center gap-1"><Dumbbell className="size-3 text-[#22D3EE]" /> treino</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((day, index) => (
          <div key={`${day}-${index}`} className="pb-1 text-center text-[10px] font-bold text-[#F5F5F5]/24">
            {day}
          </div>
        ))}

        {cells.map((date) => {
          const key = getLocalDateKey(date);
          const inMonth = date.getMonth() === month;
          const isFuture = date.getTime() > today.getTime();
          const hasRun = runSet.has(key);
          const hasWorkout = workoutSet.has(key);
          const isActive = hasRun || hasWorkout;

          return (
            <div
              key={key}
              className="relative aspect-square rounded-xl border p-1.5 transition-transform duration-100 hover:scale-[1.03]"
              style={{
                borderColor: isActive ? "rgba(182,255,0,0.22)" : "rgba(255,255,255,0.055)",
                background: !inMonth || isFuture
                  ? "rgba(255,255,255,0.018)"
                  : isActive
                  ? "rgba(182,255,0,0.075)"
                  : "rgba(255,255,255,0.03)",
              }}
            >
              <span className={inMonth && !isFuture ? "text-[11px] font-semibold text-[#F5F5F5]/68" : "text-[11px] text-[#F5F5F5]/16"}>
                {date.getDate()}
              </span>
              {isActive && (
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex gap-1">
                  {hasRun && <span className="h-1.5 flex-1 rounded-full bg-[#B6FF00] shadow-[0_0_8px_rgba(182,255,0,0.45)]" />}
                  {hasWorkout && <span className="h-1.5 flex-1 rounded-full bg-[#22D3EE] shadow-[0_0_8px_rgba(34,211,238,0.35)]" />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
