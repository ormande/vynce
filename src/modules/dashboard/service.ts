import { ReceivableStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { WALK_IN_SALE_CUSTOMER_PHONE } from "@/modules/customers/repository";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function rangeFromDays(days: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);
  return start;
}

function getMonthRange(reference = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end, daysInMonth: end.getDate() };
}

/** Agrega vendas por dia do mês corrente, preenchendo dias sem venda com 0. */
function buildMonthlySalesSeries(
  sales: { soldAt: Date; total: unknown }[],
  monthStart: Date,
  daysInMonth: number,
  reference: Date,
) {
  const byDay = new Map<number, number>();
  for (let day = 1; day <= daysInMonth; day++) {
    byDay.set(day, 0);
  }

  for (const sale of sales) {
    const day = sale.soldAt.getDate();
    if (sale.soldAt >= monthStart) {
      byDay.set(day, (byDay.get(day) ?? 0) + Number(sale.total));
    }
  }

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = new Date(reference.getFullYear(), reference.getMonth(), day);
    return {
      date: date.toISOString(),
      total: byDay.get(day) ?? 0,
    };
  });
}

export async function getDashboardMetrics() {
  const now = new Date();
  const dayStart = rangeFromDays(1);
  const weekStart = rangeFromDays(7);
  const weekEnd = new Date();
  weekEnd.setHours(23, 59, 59, 999);
  const { start: monthStart, end: monthEnd, daysInMonth } = getMonthRange(now);

  const [todaySales, weekSales, monthSales, openReceivables, topCustomersRaw, monthSalesList] =
    await Promise.all([
      db.sale.aggregate({
        _sum: { total: true },
        where: { soldAt: { gte: dayStart } },
      }),
      db.sale.aggregate({
        _sum: { total: true },
        where: { soldAt: { gte: weekStart, lte: weekEnd } },
      }),
      db.sale.aggregate({
        _sum: { total: true },
        where: { soldAt: { gte: monthStart, lte: monthEnd } },
      }),
      db.receivable.findMany({
        include: { customer: true },
        where: {
          status: {
            in: [ReceivableStatus.OPEN, ReceivableStatus.PARTIAL, ReceivableStatus.OVERDUE],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      db.customer.findMany({
        where: {
          isActive: true,
          OR: [{ phone: null }, { phone: { not: WALK_IN_SALE_CUSTOMER_PHONE } }],
        },
        include: {
          sales: {
            select: { total: true },
          },
        },
      }),
      db.sale.findMany({
        where: { soldAt: { gte: monthStart, lte: monthEnd } },
        select: { soldAt: true, total: true },
      }),
    ]);

  const [pendingAgg, openCount] = await Promise.all([
    db.receivable.aggregate({
      _sum: { balanceDue: true },
      where: {
        status: {
          in: [ReceivableStatus.OPEN, ReceivableStatus.PARTIAL, ReceivableStatus.OVERDUE],
        },
      },
    }),
    db.receivable.count({
      where: {
        status: {
          in: [ReceivableStatus.OPEN, ReceivableStatus.PARTIAL, ReceivableStatus.OVERDUE],
        },
      },
    }),
  ]);

  const topCustomers = topCustomersRaw
    .map((customer) => ({
      id: customer.id,
      name: customer.name,
      totalSpent: customer.sales.reduce((sum, sale) => sum + Number(sale.total), 0),
      purchaseCount: customer.sales.length,
    }))
    .filter((c) => c.purchaseCount > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 3);

  const salesSeries = buildMonthlySalesSeries(
    monthSalesList,
    monthStart,
    daysInMonth,
    now,
  );

  const monthLabel = monthStart.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return {
    summary: {
      today: Number(todaySales._sum.total ?? 0),
      week: Number(weekSales._sum.total ?? 0),
      month: Number(monthSales._sum.total ?? 0),
      pendingAmount: Number(pendingAgg._sum.balanceDue ?? 0),
      receivablesCount: openCount,
    },
    receivables: openReceivables,
    topCustomers,
    salesSeries,
    monthLabel,
  };
}

export async function getReportsOverview() {
  return getDashboardMetrics();
}
