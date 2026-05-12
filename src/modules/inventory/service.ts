import { getProducts } from "@/modules/products/service";
import { listInventoryMovements } from "@/modules/inventory/repository";

export async function getInventorySnapshot() {
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
  };
}
