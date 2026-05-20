import {
  type InventoryMovementType,
  type Prisma,
} from "@prisma/client";

import { AppError } from "@/lib/errors";

type Tx = Prisma.TransactionClient;

export async function syncProductStockFromBranches(tx: Tx, productId: string) {
  const aggregate = await tx.branchStock.aggregate({
    where: { productId },
    _sum: { quantity: true },
  });
  const total = aggregate._sum.quantity ?? 0;

  await tx.product.update({
    where: { id: productId },
    data: { stockQuantity: total },
  });

  return total;
}

export async function ensureBranchStockRow(
  tx: Tx,
  branchId: string,
  productId: string,
) {
  const existing = await tx.branchStock.findUnique({
    where: {
      branchId_productId: { branchId, productId },
    },
  });

  if (existing) {
    return existing;
  }

  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { lowStockThreshold: true },
  });

  if (!product) {
    throw new AppError("Produto não encontrado.", 404);
  }

  return tx.branchStock.create({
    data: {
      branchId,
      productId,
      quantity: 0,
      lowStockThreshold: product.lowStockThreshold,
    },
  });
}

/** Ajusta estoque na unidade, sincroniza total do produto e registra movimentação. */
export async function applyBranchStockDelta(
  tx: Tx,
  params: {
    branchId: string;
    productId: string;
    delta: number;
    type: InventoryMovementType;
    performedById?: string;
    note?: string;
  },
) {
  if (!Number.isInteger(params.delta) || params.delta === 0) {
    throw new AppError("Quantidade de movimentação inválida.", 400);
  }

  const row = await ensureBranchStockRow(tx, params.branchId, params.productId);
  const previousBranchQty = row.quantity;
  const newBranchQty = previousBranchQty + params.delta;

  if (newBranchQty < 0) {
    throw new AppError("Estoque insuficiente na unidade para esta operação.", 400);
  }

  await tx.branchStock.update({
    where: { id: row.id },
    data: { quantity: newBranchQty },
  });

  await syncProductStockFromBranches(tx, params.productId);

  await tx.inventoryMovement.create({
    data: {
      productId: params.productId,
      branchId: params.branchId,
      performedById: params.performedById,
      type: params.type,
      quantity: params.delta,
      previousStock: previousBranchQty,
      currentStock: newBranchQty,
      note: params.note,
    },
  });

  return { previousBranchQty, newBranchQty };
}

export async function getBranchStockQuantity(
  tx: Tx,
  branchId: string,
  productId: string,
) {
  const row = await tx.branchStock.findUnique({
    where: {
      branchId_productId: { branchId, productId },
    },
    select: { quantity: true },
  });
  return row?.quantity ?? 0;
}
