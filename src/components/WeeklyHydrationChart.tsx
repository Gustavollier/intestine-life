import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList,
  ReferenceLine,
} from "recharts";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Droplets, Target } from "lucide-react";
import type { HydrationEntry } from "@/hooks/useHydration";

interface WeeklyHydrationChartProps {
  entries: HydrationEntry[];
  goalMl: number;
}

function formatMl(ml: number) {
  if (ml === 0) return "";
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)}L`;
  return `${ml}ml`;
}

export function WeeklyHydrationChart({ entries, goalMl }: WeeklyHydrationChartProps) {
  const data = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      const dateStr = format(date, "yyyy-MM-dd");
      const totalMl = entries
        .filter((e) => e.day === dateStr)
        .reduce((sum, e) => sum + e.ml, 0);
      return {
        day: format(date, "EEE", { locale: ptBR }),
        date: dateStr,
        ml: totalMl,
        reached: totalMl >= goalMl,
        label: formatMl(totalMl),
      };
    });
  }, [entries, goalMl]);

  const maxMl = Math.max(goalMl * 1.3, ...data.map((d) => d.ml)) * 1.15;
  const minGoalMl = 2000; // Reference line at 2L minimum

  const daysReached = data.filter((d) => d.reached).length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-foreground">Hidratação semanal</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {daysReached}/7 dias na meta
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 22, right: 5, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis hide domain={[0, maxMl]} />

          {/* Reference line at 2L minimum */}
          <ReferenceLine
            y={minGoalMl}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
            label={{
              value: "2L mín.",
              position: "right",
              style: { fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 500 },
            }}
          />

          <Bar dataKey="ml" radius={[6, 6, 0, 0]} maxBarSize={32}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.ml === 0
                    ? "hsl(var(--muted))"
                    : entry.reached
                    ? "hsl(142, 76%, 36%)"
                    : "hsl(217, 91%, 60%)"
                }
                opacity={entry.ml === 0 ? 0.3 : 0.9}
              />
            ))}
            <LabelList
              dataKey="label"
              position="top"
              style={{ fontSize: 10, fill: "hsl(var(--foreground))", fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
          <span className="text-[10px] text-muted-foreground">Meta atingida</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "hsl(217, 91%, 60%)" }} />
          <span className="text-[10px] text-muted-foreground">Abaixo da meta</span>
        </div>
      </div>
    </div>
  );
}
