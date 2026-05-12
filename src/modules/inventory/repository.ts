import { db } from "@/lib/db";

export async function listInventoryMovements() {
  return db.inventoryMovement.findMany({
    include: {
      product: true,
      performedBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
