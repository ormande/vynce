import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  getBrazilDayOfMonth,
  getBrazilMonthWindow,
  parseBrazilDateKey,
  toBrazilDateKey,
  type BrazilMonthWindow,
} from "@/lib/brazil-dates";

export type MonthlyChartPoint = {
  /** Dia do mês (1–31), usado como rótulo curto no eixo X. */
  label: string;
  /** Data civil em Brasília (`yyyy-MM-dd`), sem deslocamento de fuso na UI. */
  dateKey: string;
  total: number;
};

function emptyDailyTotals(daysInMonth: number): Map<number, number> {
  const map = new Map<number, number>();
  for (let day = 1; day <= daysInMonth; day += 1) {
    map.set(day, 0);
  }
  return map;
}

function bucketAmountsByBrazilDay(
  rows: { at: Date; amount: number }[],
  window: BrazilMonthWindow,
): Map<number, number> {
  const totals = emptyDailyTotals(window.daysInMonth);
  const prefix = `${window.monthKey}-`;

  for (const row of rows) {
    const key = toBrazilDateKey(row.at);
    if (!key.startsWith(prefix)) continue;
    const day = getBrazilDayOfMonth(row.at);
    totals.set(day, (totals.get(day) ?? 0) + row.amount);
  }

  return totals;
}

export function buildMonthlyChartSeries(
  rows: { at: Date; amount: number }[],
  window: BrazilMonthWindow = getBrazilMonthWindow(),
): MonthlyChartPoint[] {
  const totals = bucketAmountsByBrazilDay(rows, window);

  return Array.from({ length: window.daysInMonth }, (_, index) => {
    const day = index + 1;
    const dateKey = `${window.monthKey}-${String(day).padStart(2, "0")}`;
    return {
      label: String(day).padStart(2, "0"),
      dateKey,
      total: totals.get(day) ?? 0,
    };
  });
}

export function formatMonthlyChartDateLabel(dateKey: string): string {
  const { year, month, day } = parseBrazilDateKey(dateKey);
  return format(new Date(year, month - 1, day), "dd 'de' MMMM", { locale: ptBR });
}
