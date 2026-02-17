import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Cell } from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Droplets } from "lucide-react";
import type { HydrationEntry } from "@/hooks/useHydration";

interface WeeklyHydrationChartProps {
  entries: HydrationEntry[];
  goalMl: number;
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
      };
    });
  }, [entries, goalMl]);

  const maxMl = Math.max(goalMl, ...data.map((d) => d.ml)) * 1.15;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Droplets className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-foreground">Hidratação semanal</h3>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            hide
            domain={[0, maxMl]}
          />
          <ReferenceLine
            y={goalMl}
            stroke="hsl(var(--primary))"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: `Meta ${goalMl >= 1000 ? `${(goalMl / 1000).toFixed(1)}L` : `${goalMl}ml`}`,
              position: "right",
              fontSize: 9,
              fill: "hsl(var(--primary))",
            }}
          />
          <Bar dataKey="ml" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.reached ? "hsl(142, 76%, 36%)" : "hsl(217, 91%, 60%)"}
                opacity={entry.ml === 0 ? 0.15 : 0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
