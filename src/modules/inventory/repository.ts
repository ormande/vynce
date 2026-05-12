import { db } from "@/lib/db";

export async function listInventoryMovements(branchIds?: string[]) {
  return db.inventoryMovement.findMany({
    where:
      branchIds && branchIds.length > 0
        ? { branchId: { in: branchIds } }
        : undefined,
    include: {
      product: true,
      performedBy: true,
      branch: true,
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}
