import {
  PaymentMethod,
  Prisma,
  ReceivableStatus,
  SalePaymentStatus,
} from "@prisma/client";

import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { listSales } from "@/modules/sales/repository";
import { saleSchema } from "@/modules/sales/schemas";

export async function getSales(search?: string, branchIds?: string[]) {
  return listSales(search, branchIds);
}

export async function registerSale(
  input: unknown,
  sellerId?: string,
  options?: { roleSlug?: string; branchIds?: string[] },
) {
  const data = saleSchema.parse(input);

  if (
    options?.roleSlug === "seller" &&
    options.branchIds &&
    options.branchIds.length > 0 &&
    !options.branchIds.includes(data.branchId)
  ) {
    throw new AppError("Você não pode registrar venda nesta unidade.", 403);
  }

  const products = await db.product.findMany({
    where: {
      id: {
        in: data.items.map((item) => item.productId),
      },
    },
  });

  const productMap = new Map(products.map((product) => [product.id, product]));

  const branch = await db.branch.findFirst({
    where: { id: data.branchId, isActive: true },
  });

  if (!branch) {
    throw new AppError("Unidade não encontrada ou inativa.", 404);
  }

  const neededByProduct = new Map<string, number>();
  for (const line of data.items) {
    neededByProduct.set(
      line.productId,
      (neededByProduct.get(line.productId) ?? 0) + line.quantity,
    );
  }

  for (const [productId] of neededByProduct) {
    const product = productMap.get(productId);
    if (!product) {
      throw new AppError("Produto não encontrado.", 404);
    }
    if (Number(product.salePrice) < Number(product.minPrice)) {
      throw new AppError(
        `Preço sugerido do produto ${product.name} está abaixo do preço mínimo cadastrado.`,
        400,
      );
    }
  }

  const items = data.items.map((item) => {
    const product = productMap.get(item.productId);

    if (!product) {
      throw new AppError("Produto não encontrado.", 404);
    }

    return {
      product,
      quantity: item.quantity,
      total: Number(product.salePrice) * item.quantity,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal - data.discount;
  const isCredit = data.paymentMethod === PaymentMethod.CREDIT;

  return db.$transaction(async (tx) => {
    for (const [productId, needQty] of neededByProduct) {
      const product = productMap.get(productId)!;
      const row = await tx.branchStock.findUnique({
        where: {
          branchId_productId: {
            branchId: data.branchId,
            productId,
          },
        },
      });
      if (!row || row.quantity < needQty) {
        throw new AppError(
          `Estoque insuficiente na unidade para ${product.name}.`,
          400,
        );
      }
    }

    const sale = await tx.sale.create({
      data: {
        branchId: data.branchId,
        sessionId: data.sessionId?.trim() ? data.sessionId.trim() : undefined,
        customerId: data.customerId,
        sellerId,
        paymentMethod: data.paymentMethod,
        paymentStatus: isCredit
          ? SalePaymentStatus.PENDING
          : SalePaymentStatus.PAID,
        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(data.discount),
        total: new Prisma.Decimal(total),
        soldAt: new Date(data.soldAt),
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        notes: data.notes || undefined,
        items: {
          create: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.product.salePrice,
            costSnapshot: item.product.costPrice,
            total: new Prisma.Decimal(item.total),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    for (const item of items) {
      const productBefore = await tx.product.findUniqueOrThrow({
        where: { id: item.product.id },
      });
      const branchRow = await tx.branchStock.findUniqueOrThrow({
        where: {
          branchId_productId: {
            branchId: data.branchId,
            productId: item.product.id,
          },
        },
      });

      if (branchRow.quantity < item.quantity) {
        throw new AppError(
          `Estoque insuficiente na unidade para ${item.product.name}.`,
          400,
        );
      }

      const newBranchQty = branchRow.quantity - item.quantity;
      const previousStock = productBefore.stockQuantity;
      const newProductStock = previousStock - item.quantity;

      await tx.branchStock.update({
        where: { id: branchRow.id },
        data: { quantity: newBranchQty },
      });

      await tx.product.update({
        where: { id: item.product.id },
        data: { stockQuantity: newProductStock },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.product.id,
          branchId: data.branchId,
          performedById: sellerId,
          type: "SALE",
          quantity: item.quantity,
          previousStock,
          currentStock: newProductStock,
          note: `Venda ${sale.id} (${branch.name})`,
        },
      });
    }

    if (isCredit) {
      await tx.receivable.create({
        data: {
          customerId: data.customerId,
          saleId: sale.id,
          originalAmount: new Prisma.Decimal(total),
          paidAmount: new Prisma.Decimal(0),
          balanceDue: new Prisma.Decimal(total),
          dueDate: data.dueDate ? new Date(data.dueDate) : new Date(data.soldAt),
          status: ReceivableStatus.OPEN,
          notes: data.notes || undefined,
        },
      });
    } else {
      await tx.payment.create({
        data: {
          customerId: data.customerId,
          saleId: sale.id,
          createdById: sellerId,
          amount: new Prisma.Decimal(total),
          method: data.paymentMethod,
          receivedAt: new Date(data.soldAt),
        },
      });
    }

    return sale;
  });
}
