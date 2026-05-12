import { type Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export async function listSales(search?: string, branchIds?: string[]) {
  const where: Prisma.SaleWhereInput = {};
  if (search) {
    where.customer = {
      name: {
        contains: search,
        mode: "insensitive",
      },
    };
  }
  if (branchIds && branchIds.length > 0) {
    where.branchId = { in: branchIds };
  }

  return db.sale.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: {
      customer: true,
      seller: true,
      branch: true,
      items: {
        include: {
          product: true,
        },
      },
      receivable: true,
      payments: true,
    },
    orderBy: { soldAt: "desc" },
  });
}
