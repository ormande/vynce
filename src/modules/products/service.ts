import { ProductStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  createProduct,
  listCategories,
  listProducts,
} from "@/modules/products/repository";
import { productSchema } from "@/modules/products/schemas";

export async function getProducts(params?: {
  search?: string;
  status?: ProductStatus | "ALL";
  page?: number;
  pageSize?: number;
}) {
  return listProducts(params);
}

export async function getActiveCategories() {
  return listCategories();
}

export async function updateProduct(id: string, input: unknown) {
  const data = productSchema.parse(input);
  return db.product.update({
    where: { id },
    data: {
      name: data.name,
      categoryId: data.categoryId,
      costPrice: new Prisma.Decimal(data.costPrice),
      salePrice: new Prisma.Decimal(data.salePrice),
      minPrice: new Prisma.Decimal(data.minPrice),
      stockQuantity: data.stockQuantity,
      lowStockThreshold: data.lowStockThreshold,
      status: data.status,
      code: data.code || null,
      description: data.description || null,
    },
  });
}

export async function registerProduct(input: unknown) {
  const data = productSchema.parse(input);
  return createProduct({
    ...data,
    code: data.code || undefined,
    description: data.description || undefined,
  });
}
