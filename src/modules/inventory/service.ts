import { db } from "@/lib/db";
import { getProducts } from "@/modules/products/service";
import { listInventoryMovements } from "@/modules/inventory/repository";

export async function getInventorySnapshot(params: {
  branchId?: string | "global";
  page?: number;
  pageSize?: number;
}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const skip = (page - 1) * pageSize;
  const isGlobal = !params.branchId || params.branchId === "global";

  if (!isGlobal) {
    const branchId = params.branchId!;
    const [movements, branchStocks, total, allBranchStocks] = await Promise.all([
      listInventoryMovements([branchId]),
      db.branchStock.findMany({
        where: { branchId },
        include: { product: { include: { category: true } }, branch: true },
        orderBy: { product: { name: "asc" } },
        skip,
        take: pageSize,
      }),
      db.branchStock.count({ where: { branchId } }),
      db.branchStock.findMany({
        where: { branchId },
        include: { product: true, branch: true },
      }),
    ]);

    const lowStock = allBranchStocks
      .filter((row) => row.quantity <= row.lowStockThreshold)
      .map((row) => ({
        id: row.id,
        name: row.product.name,
        stockQuantity: row.quantity,
        lowStockThreshold: row.lowStockThreshold,
        branchName: row.branch.name,
      }))
      .slice(0, 10);

    const items = branchStocks.map((bs) => ({
      id: bs.product.id,
      name: bs.product.name,
      code: bs.product.code,
      categoryName: bs.product.category.name,
      salePrice: bs.product.salePrice,
      stockQuantity: bs.quantity,
      status: bs.product.status,
    }));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      lowStock,
      movements,
      mode: "branch" as const,
    };
  }

  const [productsResult, movements, allProducts] = await Promise.all([
    getProducts({ page, pageSize: pageSize, status: "ALL" }),
    listInventoryMovements(),
    db.product.findMany({
      select: { id: true, name: true, stockQuantity: true, lowStockThreshold: true }
    }),
  ]);

  const lowStock = allProducts
    .filter((product) => product.stockQuantity <= product.lowStockThreshold)
    .map((product) => ({
      id: product.id,
      name: product.name,
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold,
      branchName: null,
    }))
    .slice(0, 10);

  const items = productsResult.items.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    categoryName: p.category.name,
    salePrice: p.salePrice,
    stockQuantity: p.stockQuantity,
    status: p.status,
  }));

  return {
    items,
    total: productsResult.total,
    page: productsResult.page,
    pageSize: productsResult.pageSize,
    totalPages: productsResult.totalPages,
    lowStock,
    movements,
    mode: "global" as const,
  };
}
