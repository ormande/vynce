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

import { formatCurrency } from "@/lib/utils";

type MonthlySalesPoint = {
  label: string;
  date: string;
  total: number;
};

export function MonthlySalesChart({
  data,
  monthLabel,
}: {
  data: MonthlySalesPoint[];
  monthLabel: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--muted-foreground)] capitalize">{monthLabel}</p>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
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
                const point = payload?.[0]?.payload as MonthlySalesPoint | undefined;
                if (!point?.date) return "";
                return new Date(point.date).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                });
              }}
            />
            <Bar dataKey="total" fill="#315b4d" radius={[8, 8, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
