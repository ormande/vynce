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

/** Agrega vendas por dia (últimos 7 dias), preenchendo dias sem venda com 0. */
function buildWeeklySalesSeries(
  sales: { soldAt: Date; total: unknown }[],
  weekStart: Date,
) {
  const byDay = new Map<string, number>();

  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    byDay.set(startOfDay(day).toISOString(), 0);
  }

  for (const sale of sales) {
    const key = startOfDay(sale.soldAt).toISOString();
    if (byDay.has(key)) {
      byDay.set(key, (byDay.get(key) ?? 0) + Number(sale.total));
    }
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }));
}

export async function getDashboardMetrics() {
  const now = new Date();
  const dayStart = rangeFromDays(1);
  const weekStart = rangeFromDays(7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekEnd = new Date();
  weekEnd.setHours(23, 59, 59, 999);

  const [todaySales, weekSales, monthSales, openReceivables, topCustomersRaw, weekSalesList] =
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
        where: { soldAt: { gte: monthStart } },
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
        where: { soldAt: { gte: weekStart, lte: weekEnd } },
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

  const salesSeries = buildWeeklySalesSeries(weekSalesList, weekStart);

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
  };
}

export async function getReportsOverview() {
  return getDashboardMetrics();
}
