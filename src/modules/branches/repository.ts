import { db } from "@/lib/db";

export async function findAllBranches() {
  return db.branch.findMany({
    where: { isActive: true },
    orderBy: [{ isWarehouse: "desc" }, { name: "asc" }],
  });
}

export async function findAllBranchesAdmin() {
  const branches = await db.branch.findMany({
    orderBy: [{ isWarehouse: "desc" }, { name: "asc" }],
  });

  const zeroStockByBranch = await db.branchStock.groupBy({
    by: ["branchId"],
    where: { quantity: 0 },
    _count: { id: true },
  });

  const zeroMap = new Map(
    zeroStockByBranch.map((row) => [row.branchId, row._count.id]),
  );

  return branches.map((branch) => ({
    ...branch,
    zeroStockProductCount: zeroMap.get(branch.id) ?? 0,
  }));
}

export async function findBranchById(id: string) {
  return db.branch.findUnique({
    where: { id },
    include: {
      branchStocks: {
        include: { product: { include: { category: true } } },
        orderBy: { product: { name: "asc" } },
      },
      userBranches: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              status: true,
              role: { select: { slug: true } },
            },
          },
        },
      },
    },
  });
}

export async function createBranch(data: {
  name: string;
  address?: string | null;
  isWarehouse?: boolean;
}) {
  return db.$transaction(async (tx) => {
    const branch = await tx.branch.create({
      data: {
        name: data.name,
        address: data.address || null,
        isWarehouse: data.isWarehouse ?? false,
      },
    });

    const products = await tx.product.findMany({ select: { id: true, lowStockThreshold: true } });
    if (products.length > 0) {
      await tx.branchStock.createMany({
        data: products.map((product) => ({
          branchId: branch.id,
          productId: product.id,
          quantity: 0,
          lowStockThreshold: product.lowStockThreshold,
        })),
        skipDuplicates: true,
      });
    }

    return branch;
  });
}

export async function updateBranch(
  id: string,
  data: { name?: string; address?: string | null; isWarehouse?: boolean },
) {
  return db.branch.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.address !== undefined ? { address: data.address } : {}),
      ...(data.isWarehouse !== undefined ? { isWarehouse: data.isWarehouse } : {}),
    },
  });
}

export async function toggleBranchActive(id: string) {
  const current = await db.branch.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!current) {
    return null;
  }
  return db.branch.update({
    where: { id },
    data: { isActive: !current.isActive },
  });
}

export async function findUserByIdWithRole(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    include: { role: { select: { slug: true } } },
  });
}

export async function getLinkedUserIdSetForBranch(branchId: string) {
  const rows = await db.userBranch.findMany({
    where: { branchId },
    select: { userId: true },
  });
  return new Set(rows.map((r) => r.userId));
}

export async function searchSellerUsers(query: string) {
  const q = query.trim();
  if (!q) {
    return [];
  }

  return db.user.findMany({
    where: {
      role: { slug: "seller" },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true, image: true },
    take: 20,
    orderBy: [{ name: "asc" }],
  });
}

export async function findUserBranchLink(userId: string, branchId: string) {
  return db.userBranch.findUnique({
    where: { userId_branchId: { userId, branchId } },
    include: {
      user: { include: { role: { select: { slug: true } } } },
    },
  });
}

export async function createUserBranchAssignment(userId: string, branchId: string) {
  return db.userBranch.create({
    data: {
      userId,
      branchId,
      accessAll: false,
    },
  });
}

export async function deleteUserBranchAssignment(userId: string, branchId: string) {
  await db.userBranch.delete({
    where: { userId_branchId: { userId, branchId } },
  });
}
