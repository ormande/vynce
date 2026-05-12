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

export async function getSales(search?: string) {
  return listSales(search);
}

export async function registerSale(input: unknown, sellerId?: string) {
  const data = saleSchema.parse(input);

  const products = await db.product.findMany({
    where: {
      id: {
        in: data.items.map((item) => item.productId),
      },
    },
  });

  const productMap = new Map(products.map((product) => [product.id, product]));

  const items = data.items.map((item) => {
    const product = productMap.get(item.productId);

    if (!product) {
      throw new AppError("Produto não encontrado.", 404);
    }

    if (product.stockQuantity < item.quantity) {
      throw new AppError(`Estoque insuficiente para ${product.name}.`, 400);
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
    const sale = await tx.sale.create({
      data: {
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
      const currentStock = item.product.stockQuantity - item.quantity;

      await tx.product.update({
        where: { id: item.product.id },
        data: { stockQuantity: currentStock },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.product.id,
          performedById: sellerId,
          type: "SALE",
          quantity: item.quantity,
          previousStock: item.product.stockQuantity,
          currentStock,
          note: `Venda ${sale.id}`,
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
