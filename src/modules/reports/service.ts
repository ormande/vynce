import {
  brazilEndOfDay,
  brazilStartOfDay,
  getBrazilMonthWindow,
  shiftBrazilDateKey,
  toBrazilDateKey,
} from "@/lib/brazil-dates";
import { db } from "@/lib/db";
import { buildMonthlyChartSeries } from "@/lib/monthly-series";

export async function getCompanyReports() {
  const monthWindow = getBrazilMonthWindow();
  const todayKey = toBrazilDateKey(new Date());
  const dayStart = brazilStartOfDay(todayKey);
  const weekStartKey = shiftBrazilDateKey(todayKey, -6);
  const weekStart = brazilStartOfDay(weekStartKey);
  const weekEnd = brazilEndOfDay(todayKey);

  const [todaySales, weekSales, monthSales, monthSalesList, monthPaymentsList] =
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
      db.sale.findMany({
        where: { soldAt: { gte: monthWindow.start, lte: monthWindow.end } },
        select: { soldAt: true, total: true },
        orderBy: { soldAt: "asc" },
      }),
      db.payment.findMany({
        where: { receivedAt: { gte: monthWindow.start, lte: monthWindow.end } },
        select: { receivedAt: true, amount: true },
        orderBy: { receivedAt: "asc" },
      }),
    ]);

  const monthLabel = new Date(monthWindow.year, monthWindow.month - 1, 1).toLocaleDateString(
    "pt-BR",
    { month: "long", year: "numeric" },
  );

  const salesRows = monthSalesList.map((sale) => ({
    at: sale.soldAt,
    amount: Number(sale.total),
  }));

  const cashFlowRows = monthPaymentsList.map((payment) => ({
    at: payment.receivedAt,
    amount: Number(payment.amount),
  }));

  return {
    summary: {
      today: Number(todaySales._sum.total ?? 0),
      week: Number(weekSales._sum.total ?? 0),
      month: Number(monthSales._sum.total ?? 0),
    },
    monthLabel,
    monthlySeries: buildMonthlyChartSeries(salesRows, monthWindow),
    cashFlowSeries: buildMonthlyChartSeries(cashFlowRows, monthWindow),
  };
}

export type SellerPerformanceRow = {
  id: string;
  name: string;
  branchName: string;
  status: string;
  salesCount: number;
  revenue: number;
  premiumTotal: number;
  discountTotal: number;
};

export async function getSellerPerformanceReport(): Promise<SellerPerformanceRow[]> {
  const monthWindow = getBrazilMonthWindow();

  const [sellers, paymentPremiumsByUser] = await Promise.all([
    db.user.findMany({
      where: { role: { slug: { in: ["seller", "owner"] } } },
      include: {
        role: { select: { slug: true } },
        userBranches: {
          include: { branch: true },
          take: 1,
        },
        sales: {
          where: { soldAt: { gte: monthWindow.start, lte: monthWindow.end } },
          include: {
            items: {
              include: {
                product: { select: { minPrice: true } },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.payment.groupBy({
      by: ["createdById"],
      where: {
        createdById: { not: null },
        receivedAt: { gte: monthWindow.start, lte: monthWindow.end },
        premiumAmount: { gt: 0 },
      },
      _sum: { premiumAmount: true },
    }),
  ]);

  const paymentPremiumMap = new Map(
    paymentPremiumsByUser
      .filter((row) => row.createdById)
      .map((row) => [row.createdById!, Number(row._sum.premiumAmount ?? 0)]),
  );

  return sellers.map((seller) => {
    let salesCount = 0;
    let revenue = 0;
    let premiumTotal = 0;
    let discountTotal = 0;

    for (const sale of seller.sales) {
      salesCount += 1;
      revenue += Number(sale.total);
      discountTotal += Number(sale.discount);

      for (const item of sale.items) {
        const unitPrice = Number(item.unitPrice);
        const floorPrice = Number(item.product.minPrice);
        if (unitPrice > floorPrice) {
          premiumTotal += (unitPrice - floorPrice) * item.quantity;
        }
      }
    }

    premiumTotal += paymentPremiumMap.get(seller.id) ?? 0;

    const displayName = seller.name?.trim() || seller.email || "Sem nome";

    const isOwner = seller.role?.slug === "owner";

    return {
      id: seller.id,
      name: displayName,
      branchName:
        seller.userBranches[0]?.branch.name ?? (isOwner ? "Administrador" : "Sem unidade"),
      status: seller.status,
      salesCount,
      revenue,
      premiumTotal,
      discountTotal,
    };
  });
}
