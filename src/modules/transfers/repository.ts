import { type Prisma, type TransferStatus } from "@prisma/client";

import { db } from "@/lib/db";
import {
  applyBranchStockDelta,
  ensureBranchStockRow,
  getBranchStockQuantity,
} from "@/lib/stock-ledger";

export const stockTransferInclude = {
  fromBranch: true,
  toBranch: true,
  product: true,
  requestedBy: { select: { id: true, name: true, email: true } },
  confirmedBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.StockTransferInclude;

export type StockTransferWithRelations = Prisma.StockTransferGetPayload<{
  include: typeof stockTransferInclude;
}>;

export async function findPendingTransfersToBranches(branchIds: string[]) {
  if (branchIds.length === 0) {
    return [];
  }
  return db.stockTransfer.findMany({
    where: { status: "PENDING", toBranchId: { in: branchIds } },
    include: stockTransferInclude,
    orderBy: { requestedAt: "desc" },
  });
}

export async function findTransfersRequestedBy(userId: string) {
  return db.stockTransfer.findMany({
    where: { requestedById: userId },
    include: stockTransferInclude,
    orderBy: { requestedAt: "desc" },
  });
}

export async function findAllTransfers(status?: TransferStatus) {
  return db.stockTransfer.findMany({
    where: status ? { status } : undefined,
    include: stockTransferInclude,
    orderBy: { requestedAt: "desc" },
  });
}

export async function findTransferById(id: string) {
  return db.stockTransfer.findUnique({
    where: { id },
    include: stockTransferInclude,
  });
}

export async function createStockTransfer(data: Prisma.StockTransferCreateInput) {
  return db.stockTransfer.create({ data });
}

/** Confirma transferência: estoque + movimentos + status, em transação atômica. */
export async function confirmStockTransferAtomic(
  transferId: string,
  confirmedById: string,
) {
  return db.$transaction(async (tx) => {
    const t = await tx.stockTransfer.findUnique({ where: { id: transferId } });
    if (!t || t.status !== "PENDING") {
      throw new Error("Transferência não encontrada ou já processada.");
    }

    const fromAvailable = await getBranchStockQuantity(
      tx,
      t.fromBranchId,
      t.productId,
    );
    if (fromAvailable < t.quantity) {
      throw new Error(
        "Estoque insuficiente na unidade de origem para confirmar esta transferência.",
      );
    }

    await ensureBranchStockRow(tx, t.toBranchId, t.productId);

    const [fromBr, toBr] = await Promise.all([
      tx.branch.findUnique({ where: { id: t.fromBranchId }, select: { name: true } }),
      tx.branch.findUnique({ where: { id: t.toBranchId }, select: { name: true } }),
    ]);

    await applyBranchStockDelta(tx, {
      branchId: t.fromBranchId,
      productId: t.productId,
      delta: -t.quantity,
      type: "TRANSFER_OUT",
      performedById: confirmedById,
      note: `Transferência ${t.id} → ${toBr?.name ?? t.toBranchId}`,
    });

    await applyBranchStockDelta(tx, {
      branchId: t.toBranchId,
      productId: t.productId,
      delta: t.quantity,
      type: "TRANSFER_IN",
      performedById: confirmedById,
      note: `Transferência ${t.id} ← ${fromBr?.name ?? t.fromBranchId}`,
    });

    return tx.stockTransfer.update({
      where: { id: transferId },
      data: {
        status: "CONFIRMED",
        confirmedById,
        confirmedAt: new Date(),
      },
      include: stockTransferInclude,
    });
  });
}
