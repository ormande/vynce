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

import { formatCurrency } from "@/lib/utils";

type SalesPoint = {
  date: string;
  total: number;
};

export function SalesOverviewChart({ data }: { data: SalesPoint[] }) {
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
            dataKey="date"
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString("pt-BR", {
                day: "2-digit",
              })
            }
            tick={{ fill: "#607168", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value) => `R$ ${value}`}
            tick={{ fill: "#607168", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value ?? 0))}
            labelFormatter={(label) =>
              new Date(label).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
              })
            }
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
