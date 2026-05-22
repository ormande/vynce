import { db } from "@/lib/db";

function getMonthRange(reference = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end, daysInMonth: end.getDate() };
}

export async function getCompanyReports() {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);

  const { start: monthStart, end: monthEnd, daysInMonth } = getMonthRange(now);

  const [todaySales, weekSales, monthSales, monthSalesList] = await Promise.all([
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
      where: { soldAt: { gte: monthStart, lte: monthEnd } },
    }),
    db.sale.findMany({
      where: { soldAt: { gte: monthStart, lte: monthEnd } },
      select: { soldAt: true, total: true },
      orderBy: { soldAt: "asc" },
    }),
  ]);

  const dailyTotals = new Map<number, number>();
  for (let day = 1; day <= daysInMonth; day += 1) {
    dailyTotals.set(day, 0);
  }

  for (const sale of monthSalesList) {
    const day = sale.soldAt.getDate();
    dailyTotals.set(day, (dailyTotals.get(day) ?? 0) + Number(sale.total));
  }

  const monthLabel = monthStart.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return {
    summary: {
      today: Number(todaySales._sum.total ?? 0),
      week: Number(weekSales._sum.total ?? 0),
      month: Number(monthSales._sum.total ?? 0),
    },
    monthLabel,
    monthlySeries: Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = new Date(now.getFullYear(), now.getMonth(), day);
      return {
        date: date.toISOString(),
        label: String(day).padStart(2, "0"),
        total: dailyTotals.get(day) ?? 0,
      };
    }),
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
  const { start: monthStart, end: monthEnd } = getMonthRange();

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
          where: { soldAt: { gte: monthStart, lte: monthEnd } },
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
        receivedAt: { gte: monthStart, lte: monthEnd },
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
