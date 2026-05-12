import { ReceivableStatus } from "@prisma/client";

import { db } from "@/lib/db";

function rangeFromDays(days: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);
  return start;
}

export async function getDashboardMetrics() {
  const now = new Date();
  const dayStart = rangeFromDays(1);
  const weekStart = rangeFromDays(7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todaySales, weekSales, monthSales, receivables, customers, products, series] =
    await Promise.all([
      db.sale.aggregate({
        _sum: { total: true },
        where: { soldAt: { gte: dayStart } },
      }),
      db.sale.aggregate({
        _sum: { total: true },
        where: { soldAt: { gte: weekStart } },
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
        orderBy: { dueDate: "asc" },
        take: 6,
      }),
      db.customer.findMany({
        include: {
          sales: {
            select: {
              total: true,
            },
          },
        },
      }),
      db.product.findMany({
        where: { status: "ACTIVE" },
        include: { category: true },
        orderBy: { stockQuantity: "asc" },
        take: 12,
      }),
      db.sale.findMany({
        where: { soldAt: { gte: weekStart } },
        orderBy: { soldAt: "asc" },
        select: { soldAt: true, total: true },
      }),
    ]);

  const topCustomers = customers
    .map((customer) => ({
      id: customer.id,
      name: customer.name,
      totalSpent: customer.sales.reduce((sum, sale) => sum + Number(sale.total), 0),
      purchaseCount: customer.sales.length,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  const lowStock = products.filter(
    (product) => product.stockQuantity <= product.lowStockThreshold,
  );

  return {
    summary: {
      today: Number(todaySales._sum.total ?? 0),
      week: Number(weekSales._sum.total ?? 0),
      month: Number(monthSales._sum.total ?? 0),
      pendingAmount: receivables.reduce(
        (sum, receivable) => sum + Number(receivable.balanceDue),
        0,
      ),
      receivablesCount: receivables.length,
      lowStockCount: lowStock.length,
    },
    receivables,
    topCustomers,
    lowStock,
    salesSeries: series.map((sale) => ({
      date: sale.soldAt.toISOString(),
      total: Number(sale.total),
    })),
  };
}

export async function getReportsOverview() {
  return getDashboardMetrics();
}
