import { ProductStatus } from "@prisma/client";

import {
  createProduct,
  listCategories,
  listProducts,
} from "@/modules/products/repository";
import { productSchema } from "@/modules/products/schemas";

export async function getProducts(params?: {
  search?: string;
  status?: ProductStatus | "ALL";
}) {
  return listProducts(params);
}

export async function getActiveCategories() {
  return listCategories();
}

export async function registerProduct(input: unknown) {
  const data = productSchema.parse(input);
  return createProduct({
    ...data,
    code: data.code || undefined,
    description: data.description || undefined,
  });
}
