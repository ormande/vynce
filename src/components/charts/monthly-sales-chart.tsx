"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMonthlyChartDateLabel, type MonthlyChartPoint } from "@/lib/monthly-series";
import { formatCurrency } from "@/lib/utils";

export function MonthlySalesChart({
  data,
  monthLabel,
  barColor = "#315b4d",
}: {
  data: MonthlyChartPoint[];
  monthLabel: string;
  barColor?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--muted-foreground)] capitalize">{monthLabel}</p>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height={320} minWidth={0}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d8dfdb" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#607168", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(value) =>
                Number(value) >= 1000
                  ? `R$ ${(Number(value) / 1000).toFixed(0)}k`
                  : `R$ ${value}`
              }
              tick={{ fill: "#607168", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              cursor={{ fill: "rgba(49, 91, 77, 0.08)" }}
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              labelFormatter={(_, payload) => {
                const point = payload?.[0]?.payload as MonthlyChartPoint | undefined;
                if (!point?.dateKey) return "";
                return formatMonthlyChartDateLabel(point.dateKey);
              }}
            />
            <Bar dataKey="total" fill={barColor} radius={[8, 8, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
