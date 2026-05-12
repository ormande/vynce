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
  minPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: ProductStatus;
  code?: string;
  description?: string;
}) {
  return db.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        costPrice: new Prisma.Decimal(data.costPrice),
        salePrice: new Prisma.Decimal(data.salePrice),
        minPrice: new Prisma.Decimal(data.minPrice),
        stockQuantity: data.stockQuantity,
        lowStockThreshold: data.lowStockThreshold,
        status: data.status,
        code: data.code,
        description: data.description,
      },
    });

    const branches = await tx.branch.findMany({
      where: { isActive: true },
      select: { id: true, isWarehouse: true },
    });

    if (branches.length > 0) {
      const warehouse = branches.find((b) => b.isWarehouse) ?? branches[0];
      await tx.branchStock.createMany({
        data: branches.map((branch) => ({
          branchId: branch.id,
          productId: product.id,
          quantity: branch.id === warehouse.id ? data.stockQuantity : 0,
          lowStockThreshold: data.lowStockThreshold,
        })),
        skipDuplicates: true,
      });
    }

    return product;
  });
}
