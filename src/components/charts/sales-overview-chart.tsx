"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMonthlyChartDateLabel, type MonthlyChartPoint } from "@/lib/monthly-series";
import { formatCurrency } from "@/lib/utils";

export function SalesOverviewChart({ data }: { data: MonthlyChartPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height={288} minWidth={0}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#315b4d" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#315b4d" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#d8dfdb" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#607168", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value) => `R$ ${value}`}
            tick={{ fill: "#607168", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value ?? 0))}
            labelFormatter={(_, payload) => {
              const point = payload?.[0]?.payload as MonthlyChartPoint | undefined;
              if (!point?.dateKey) return "";
              return formatMonthlyChartDateLabel(point.dateKey);
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#315b4d"
            fill="url(#sales-fill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
