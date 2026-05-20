import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { applyBranchStockDelta } from "@/lib/stock-ledger";
import { stockInboundSchema } from "@/modules/inventory/schemas";

export async function registerStockInbound(
  input: unknown,
  performedById?: string,
  options?: { roleSlug?: string; branchIds?: string[] },
) {
  const data = stockInboundSchema.parse(input);

  if (
    options?.roleSlug === "seller" &&
    options.branchIds &&
    options.branchIds.length > 0 &&
    !options.branchIds.includes(data.branchId)
  ) {
    throw new AppError("Você não pode lançar estoque nesta unidade.", 403);
  }

  const branch = await db.branch.findFirst({
    where: { id: data.branchId, isActive: true },
  });

  if (!branch) {
    throw new AppError("Unidade não encontrada ou inativa.", 404);
  }

  const product = await db.product.findFirst({
    where: { id: data.productId, status: "ACTIVE" },
  });

  if (!product) {
    throw new AppError("Produto não encontrado ou inativo.", 404);
  }

  return db.$transaction(async (tx) => {
    const result = await applyBranchStockDelta(tx, {
      branchId: data.branchId,
      productId: data.productId,
      delta: data.quantity,
      type: "INBOUND",
      performedById,
      note: data.note?.trim() || `Entrada de estoque em ${branch.name}`,
    });

    return {
      branchId: data.branchId,
      productId: data.productId,
      quantityAdded: data.quantity,
      branchQuantity: result.newBranchQty,
    };
  });
}

export async function getBranchStockMap(branchId: string) {
  const rows = await db.branchStock.findMany({
    where: { branchId },
    select: { productId: true, quantity: true },
  });

  return Object.fromEntries(rows.map((row) => [row.productId, row.quantity]));
}
