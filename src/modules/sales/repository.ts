import { type Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

function buildSalesWhere(search?: string, branchIds?: string[]): Prisma.SaleWhereInput {
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
  return where;
}

const saleInclude = {
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
} as const;

export async function listSales(search?: string, branchIds?: string[]) {
  const where = buildSalesWhere(search, branchIds);
  return db.sale.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: saleInclude,
    orderBy: { soldAt: "desc" },
  });
}

export async function listSalesPaginated(params: {
  search?: string;
  branchIds?: string[];
  page?: number;
  pageSize?: number;
}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;
  const where = buildSalesWhere(params.search, params.branchIds);
  const hasWhere = Object.keys(where).length > 0;

  const [items, total] = await Promise.all([
    db.sale.findMany({
      where: hasWhere ? where : undefined,
      include: saleInclude,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
    db.sale.count({ where: hasWhere ? where : undefined }),
  ]);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function findSaleById(id: string) {
  return db.sale.findUnique({
    where: { id },
    include: saleInclude,
  });
}
