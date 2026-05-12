import { Prisma, ProductStatus } from "@prisma/client";

import { db } from "@/lib/db";

export async function listProducts(params?: {
  search?: string;
  status?: ProductStatus | "ALL";
}) {
  const where: Prisma.ProductWhereInput = {
    ...(params?.status && params.status !== "ALL"
      ? { status: params.status }
      : {}),
    ...(params?.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { code: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return db.product.findMany({
    where,
    include: {
      category: true,
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}

export async function listCategories() {
  return db.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createProduct(data: {
  name: string;
  categoryId: string;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: ProductStatus;
  code?: string;
  description?: string;
}) {
  return db.product.create({
    data: {
      ...data,
      costPrice: new Prisma.Decimal(data.costPrice),
      salePrice: new Prisma.Decimal(data.salePrice),
    },
  });
}
