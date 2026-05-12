import { db } from "@/lib/db";
import { getProducts } from "@/modules/products/service";
import { listInventoryMovements } from "@/modules/inventory/repository";

export async function getInventorySnapshot(filter?: { branchIds?: string[] }) {
  const branchIds = filter?.branchIds;

  if (branchIds && branchIds.length > 0) {
    const [movements, branchStocks] = await Promise.all([
      listInventoryMovements(branchIds),
      db.branchStock.findMany({
        where: { branchId: { in: branchIds } },
        include: { product: true, branch: true },
        orderBy: { product: { name: "asc" } },
      }),
    ]);

    const lowStock = branchStocks
      .filter((row) => row.quantity <= row.lowStockThreshold)
      .map((row) => ({
        id: row.id,
        name: row.product.name,
        stockQuantity: row.quantity,
        lowStockThreshold: row.lowStockThreshold,
        branchName: row.branch.name,
      }));

    return {
      products: null as Awaited<ReturnType<typeof getProducts>> | null,
      lowStock,
      movements,
      mode: "branch" as const,
    };
  }

  const [products, movements] = await Promise.all([
    getProducts({ status: "ALL" }),
    listInventoryMovements(),
  ]);

  const lowStock = products.filter(
    (product) => product.stockQuantity <= product.lowStockThreshold,
  );

  return {
    products,
    lowStock,
    movements,
    mode: "global" as const,
  };
}
