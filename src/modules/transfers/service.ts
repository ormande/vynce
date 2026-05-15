import { AppError } from "@/lib/errors";
import {
  cancelTransferSchema,
  confirmTransferSchema,
  requestTransferSchema,
} from "@/modules/transfers/schemas";
import {
  confirmStockTransferAtomic,
  createStockTransfer,
  findAllTransfers,
  findPendingTransfersToBranches,
  findTransferById,
  findTransfersRequestedBy,
} from "@/modules/transfers/repository";
import { db } from "@/lib/db";

type SessionContext = {
  userId: string;
  roleSlug?: string;
  branchIds: string[];
  accessAll: boolean;
};

function assertSellerOwnsFromBranch(ctx: SessionContext, fromBranchId: string) {
  if (ctx.roleSlug !== "seller") return;
  if (ctx.accessAll) return;
  if (!ctx.branchIds.includes(fromBranchId)) {
    throw new AppError("Você não pode solicitar transferência a partir desta unidade.", 403);
  }
}

function assertSellerCanConfirm(ctx: SessionContext, toBranchId: string) {
  if (ctx.roleSlug === "owner") return;
  if (ctx.roleSlug !== "seller") {
    throw new AppError("Sem permissão para confirmar transferências.", 403);
  }
  if (ctx.accessAll) return;
  if (!ctx.branchIds.includes(toBranchId)) {
    throw new AppError("Apenas a equipe da unidade de destino pode confirmar o recebimento.", 403);
  }
}

export async function requestTransfer(input: unknown, ctx: SessionContext) {
  const data = requestTransferSchema.parse(input);

  if (data.fromBranchId === data.toBranchId) {
    throw new AppError("Origem e destino devem ser unidades diferentes.", 400);
  }

  assertSellerOwnsFromBranch(ctx, data.fromBranchId);

  const [fromBranch, toBranch] = await Promise.all([
    db.branch.findFirst({
      where: { id: data.fromBranchId, isActive: true },
    }),
    db.branch.findFirst({
      where: { id: data.toBranchId, isActive: true },
    }),
  ]);

  if (!fromBranch || !toBranch) {
    throw new AppError("Unidade de origem ou destino inválida ou inativa.", 400);
  }

  const stock = await db.branchStock.findUnique({
    where: {
      branchId_productId: {
        branchId: data.fromBranchId,
        productId: data.productId,
      },
    },
  });

  if (!stock || stock.quantity < data.quantity) {
    throw new AppError("Quantidade indisponível na unidade de origem.", 400);
  }

  const product = await db.product.findUnique({ where: { id: data.productId } });
  if (!product) {
    throw new AppError("Produto não encontrado.", 404);
  }

  return createStockTransfer({
    fromBranch: { connect: { id: data.fromBranchId } },
    toBranch: { connect: { id: data.toBranchId } },
    product: { connect: { id: data.productId } },
    requestedBy: { connect: { id: ctx.userId } },
    quantity: data.quantity,
    status: "PENDING",
    notes: data.notes?.trim() ? data.notes.trim() : null,
  });
}

export async function confirmTransfer(input: unknown, ctx: SessionContext) {
  const { transferId } = confirmTransferSchema.parse(input);

  const existing = await findTransferById(transferId);
  if (!existing || existing.status !== "PENDING") {
    throw new AppError("Transferência não encontrada ou já processada.", 404);
  }

  assertSellerCanConfirm(ctx, existing.toBranchId);

  try {
    return await confirmStockTransferAtomic(transferId, ctx.userId);
  } catch (e) {
    if (e instanceof Error) {
      throw new AppError(e.message, 400);
    }
    throw e;
  }
}

export async function cancelTransfer(input: unknown, ctx: SessionContext) {
  const { transferId } = cancelTransferSchema.parse(input);

  const existing = await findTransferById(transferId);
  if (!existing || existing.status !== "PENDING") {
    throw new AppError("Transferência não encontrada ou já processada.", 404);
  }

  const isOwner = ctx.roleSlug === "owner";
  const isRequester = existing.requestedById === ctx.userId;
  if (!isOwner && !isRequester) {
    throw new AppError("Somente quem solicitou ou o proprietário pode cancelar.", 403);
  }

  const result = await db.stockTransfer.updateMany({
    where: { id: transferId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  if (result.count === 0) {
    throw new AppError("Não foi possível cancelar esta transferência.", 400);
  }

  return findTransferById(transferId);
}

export async function listMyRequestedTransfers(userId: string) {
  return findTransfersRequestedBy(userId);
}

export async function listPendingInboundForBranches(branchIds: string[]) {
  return findPendingTransfersToBranches(branchIds);
}

export async function listAllTransfersForAdmin(status?: "PENDING" | "CONFIRMED" | "CANCELLED") {
  return findAllTransfers(status);
}

export async function listAllTransfersForBranches(branchIds: string[]) {
  if (branchIds.length === 0) return [];
  return db.stockTransfer.findMany({
    where: {
      OR: [
        { fromBranchId: { in: branchIds } },
        { toBranchId: { in: branchIds } }
      ]
    },
    include: {
      fromBranch: true,
      toBranch: true,
      product: true,
      requestedBy: { select: { id: true, name: true, email: true } },
      confirmedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { requestedAt: "desc" },
  });
}

export async function getBranchStocksForTransferPicker(branchId: string) {
  return db.branchStock.findMany({
    where: { branchId, quantity: { gt: 0 } },
    include: { product: true },
    orderBy: { product: { name: "asc" } },
  });
}

export async function getUnseenPendingTransfersCount(userId: string, branchIds: string[]) {
  if (branchIds.length === 0) return 0;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lastTransfersViewedAt: true },
  });

  const where: any = {
    status: "PENDING",
    toBranchId: { in: branchIds },
  };

  if (user?.lastTransfersViewedAt) {
    where.requestedAt = { gt: user.lastTransfersViewedAt };
  }

  return db.stockTransfer.count({ where });
}

export async function markTransfersAsViewed(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { lastTransfersViewedAt: new Date() },
  });
}
