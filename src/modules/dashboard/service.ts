import { ReceivableStatus } from "@prisma/client";

import {
  brazilEndOfDay,
  brazilStartOfDay,
  getBrazilMonthWindow,
  shiftBrazilDateKey,
  toBrazilDateKey,
} from "@/lib/brazil-dates";
import { db } from "@/lib/db";
import { buildMonthlyChartSeries } from "@/lib/monthly-series";
import { WALK_IN_SALE_CUSTOMER_PHONE } from "@/modules/customers/repository";

function rangeFromDays(days: number) {
  const todayKey = toBrazilDateKey(new Date());
  const startKey = shiftBrazilDateKey(todayKey, -(days - 1));
  return {
    start: brazilStartOfDay(startKey),
    end: brazilEndOfDay(todayKey),
  };
}

export async function getDashboardMetrics() {
  const monthWindow = getBrazilMonthWindow();
  const { start: dayStart } = rangeFromDays(1);
  const { start: weekStart, end: weekEnd } = rangeFromDays(7);

  const [todaySales, weekSales, monthSales, openReceivables, topCustomersRaw, monthSalesList, monthPaymentsList] =
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
        where: { soldAt: { gte: monthWindow.start, lte: monthWindow.end } },
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
        where: { soldAt: { gte: monthWindow.start, lte: monthWindow.end } },
        select: { soldAt: true, total: true },
      }),
      db.payment.findMany({
        where: { receivedAt: { gte: monthWindow.start, lte: monthWindow.end } },
        select: { receivedAt: true, amount: true },
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

  const salesSeries = buildMonthlyChartSeries(
    monthSalesList.map((sale) => ({
      at: sale.soldAt,
      amount: Number(sale.total),
    })),
    monthWindow,
  );

  const cashFlowSeries = buildMonthlyChartSeries(
    monthPaymentsList.map((payment) => ({
      at: payment.receivedAt,
      amount: Number(payment.amount),
    })),
    monthWindow,
  );

  const monthLabel = new Date(monthWindow.year, monthWindow.month - 1, 1).toLocaleDateString(
    "pt-BR",
    { month: "long", year: "numeric" },
  );

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
    cashFlowSeries,
    monthLabel,
  };
}

export async function getReportsOverview() {
  return getDashboardMetrics();
}
