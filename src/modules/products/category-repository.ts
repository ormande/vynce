import { db } from "@/lib/db";

export async function listAllCategoriesWithCounts() {
  return db.category.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
    },
  });
}

export async function findCategoryById(id: string) {
  return db.category.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true } },
    },
  });
}

export async function createCategory(data: {
  name: string;
  description?: string | null;
  createdById?: string;
}) {
  return db.category.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      createdById: data.createdById,
    },
    include: {
      _count: { select: { products: true } },
    },
  });
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    isActive?: boolean;
  },
) {
  return db.category.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
    include: {
      _count: { select: { products: true } },
    },
  });
}

export async function deleteCategory(id: string) {
  return db.category.delete({ where: { id } });
}
