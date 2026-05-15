import { Prisma } from "@prisma/client";

import { AppError } from "@/lib/errors";
import { categoryInputSchema } from "@/modules/products/category-schemas";
import {
  createCategory,
  deleteCategory,
  findCategoryById,
  listAllCategoriesWithCounts,
  updateCategory,
} from "@/modules/products/category-repository";

export async function getCategoriesForManagement() {
  const categories = await listAllCategoriesWithCounts();
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    isActive: category.isActive,
    productCount: category._count.products,
    createdAt: category.createdAt.toISOString(),
  }));
}

export async function registerCategory(input: unknown, createdById?: string) {
  const data = categoryInputSchema.parse(input);

  try {
    return await createCategory({
      name: data.name,
      description: data.description || null,
      createdById,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("Já existe uma categoria com este nome.", 409);
    }
    throw error;
  }
}

export async function updateCategoryById(id: string, input: unknown) {
  const data = categoryInputSchema.parse(input);
  const existing = await findCategoryById(id);

  if (!existing) {
    throw new AppError("Categoria não encontrada.", 404);
  }

  try {
    return await updateCategory(id, {
      name: data.name,
      description: data.description || null,
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("Já existe uma categoria com este nome.", 409);
    }
    throw error;
  }
}

export async function removeCategory(id: string) {
  const existing = await findCategoryById(id);

  if (!existing) {
    throw new AppError("Categoria não encontrada.", 404);
  }

  if (existing._count.products > 0) {
    return updateCategory(id, { isActive: false });
  }

  return deleteCategory(id);
}

export async function reactivateCategory(id: string) {
  const existing = await findCategoryById(id);

  if (!existing) {
    throw new AppError("Categoria não encontrada.", 404);
  }

  return updateCategory(id, { isActive: true });
}
