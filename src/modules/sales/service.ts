import {
  PaymentMethod,
  Prisma,
  ReceivableStatus,
  SalePaymentStatus,
} from "@prisma/client";

import { brazilNoonFromDateKey } from "@/lib/brazil-dates";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  applyBranchStockDelta,
  getBranchStockQuantity,
} from "@/lib/stock-ledger";
import { WALK_IN_SALE_CUSTOMER_PHONE } from "@/modules/customers/repository";
import { getPlatformSettings } from "@/modules/platform-settings/service";
import {
  findSaleById,
  listSales,
  listSalesPaginated,
} from "@/modules/sales/repository";
import { saleSchema, saleUpdateSchema } from "@/modules/sales/schemas";

export async function getSales(search?: string, branchIds?: string[]) {
  return listSales(search, branchIds);
}

export async function getSalesPaginated(
  params: {
    search?: string;
    branchIds?: string[];
    page?: number;
    pageSize?: number;
  },
) {
  return listSalesPaginated(params);
}

function resolveSoldAt(data: { useCustomSoldAt: boolean; soldAt?: string }) {
  if (data.useCustomSoldAt && data.soldAt) {
    const parsed = brazilNoonFromDateKey(data.soldAt);
    if (Number.isNaN(parsed.getTime())) {
      throw new AppError("Data da venda inválida.", 400);
    }
    return parsed;
  }
  return new Date();
}

export async function registerSale(
  input: unknown,
  sellerId?: string,
  options?: { roleSlug?: string; branchIds?: string[] },
) {
  const data = saleSchema.parse(input);
  const { allowSalesWithoutStock } = await getPlatformSettings();

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

    const catalogUnitPrice = Number(product.salePrice);
    const unitPrice = item.unitPrice;
    const catalogLineTotal = catalogUnitPrice * item.quantity;

    if (unitPrice < catalogUnitPrice && !data.applyDiscount) {
      throw new AppError(
        `O valor de ${product.name} está abaixo do preço do sistema. Marque a opção de desconto para continuar.`,
        400,
      );
    }

    if (unitPrice < Number(product.minPrice)) {
      throw new AppError(
        `O valor de ${product.name} não pode ficar abaixo do preço mínimo permitido.`,
        400,
      );
    }

    return {
      product,
      quantity: item.quantity,
      unitPrice,
      catalogLineTotal,
      total: unitPrice * item.quantity,
    };
  });

  const catalogSubtotal = items.reduce((sum, item) => sum + item.catalogLineTotal, 0);
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const computedDiscount = Math.max(0, catalogSubtotal - subtotal);

  if (data.applyDiscount && computedDiscount <= 0) {
    throw new AppError("Informe um valor com desconto válido.", 400);
  }

  if (!data.applyDiscount && computedDiscount > 0) {
    throw new AppError(
      "Para vender abaixo do preço do sistema, marque a opção de desconto.",
      400,
    );
  }

  const discount = data.applyDiscount ? computedDiscount : 0;
  const total = subtotal;
  const soldAt = resolveSoldAt(data);
  const isCredit = data.paymentMethod === PaymentMethod.CREDIT;

  const customer = await db.customer.findUnique({
    where: { id: data.customerId },
    select: { id: true, phone: true, name: true },
  });

  if (!customer) {
    throw new AppError("Cliente não encontrado.", 404);
  }

  if (isCredit && customer.phone === WALK_IN_SALE_CUSTOMER_PHONE) {
    throw new AppError(
      "Selecione um cliente cadastrado para registrar venda fiado.",
      400,
    );
  }

  const dueDate = isCredit
    ? (() => {
        const parsed = new Date(`${data.dueDate}T12:00:00`);
        if (Number.isNaN(parsed.getTime())) {
          throw new AppError("Data de vencimento inválida.", 400);
        }
        return parsed;
      })()
    : undefined;

  return db.$transaction(async (tx) => {
    if (!allowSalesWithoutStock) {
      for (const [productId, needQty] of neededByProduct) {
        const product = productMap.get(productId)!;
        const available = await getBranchStockQuantity(tx, data.branchId, productId);
        if (available < needQty) {
          throw new AppError(
            `Estoque insuficiente na unidade para ${product.name} (${available} disponível).`,
            400,
          );
        }
      }
    }

    const sale = await tx.sale.create({
      data: {
        branchId: data.branchId,
        sessionId: data.sessionId?.trim() ? data.sessionId.trim() : undefined,
        customerId: data.customerId,
        sellerId,
        paymentMethod: data.paymentMethod,
        paymentStatus: isCredit ? SalePaymentStatus.PENDING : SalePaymentStatus.PAID,
        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(discount),
        total: new Prisma.Decimal(total),
        soldAt,
        dueDate,
        notes: data.notes || undefined,
        items: {
          create: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            costSnapshot: item.product.costPrice,
            total: new Prisma.Decimal(item.total),
          })),
        },
        ...(isCredit
          ? {
              receivable: {
                create: {
                  customerId: data.customerId,
                  status: ReceivableStatus.OPEN,
                  originalAmount: new Prisma.Decimal(total),
                  paidAmount: new Prisma.Decimal(0),
                  balanceDue: new Prisma.Decimal(total),
                  dueDate: dueDate!,
                },
              },
            }
          : {}),
      },
      include: {
        items: true,
        receivable: true,
      },
    });

    for (const item of items) {
      await applyBranchStockDelta(tx, {
        branchId: data.branchId,
        productId: item.product.id,
        delta: -item.quantity,
        type: "SALE",
        performedById: sellerId,
        note: `Venda ${sale.id} (${branch.name})`,
      });
    }

    if (!isCredit) {
      await tx.payment.create({
        data: {
          customerId: data.customerId,
          saleId: sale.id,
          createdById: sellerId,
          amount: new Prisma.Decimal(total),
          method: data.paymentMethod,
          receivedAt: soldAt,
        },
      });
    }

    return sale;
  });
}

export async function updateSale(
  id: string,
  input: unknown,
  options?: { roleSlug?: string; branchIds?: string[] },
) {
  const data = saleUpdateSchema.parse(input);
  const sale = await findSaleById(id);

  if (!sale) {
    throw new AppError("Venda não encontrada.", 404);
  }

  if (
    options?.roleSlug === "seller" &&
    options.branchIds &&
    options.branchIds.length > 0 &&
    !options.branchIds.includes(sale.branchId)
  ) {
    throw new AppError("Você não pode editar vendas desta unidade.", 403);
  }

  const customer = await db.customer.findUnique({
    where: { id: data.customerId },
    select: { id: true, phone: true },
  });

  if (!customer) {
    throw new AppError("Cliente não encontrado.", 404);
  }

  const isCredit = sale.paymentMethod === PaymentMethod.CREDIT;
  if (isCredit && customer.phone === WALK_IN_SALE_CUSTOMER_PHONE) {
    throw new AppError(
      "Selecione um cliente cadastrado para vendas fiado.",
      400,
    );
  }

  let soldAt = sale.soldAt;
  if (data.useCustomSoldAt && data.soldAt) {
    const parsed = brazilNoonFromDateKey(data.soldAt);
    if (Number.isNaN(parsed.getTime())) {
      throw new AppError("Data da venda inválida.", 400);
    }
    if (parsed.getTime() > Date.now()) {
      throw new AppError("A data da venda não pode ser futura.", 400);
    }
    soldAt = parsed;
  }

  let dueDate = sale.dueDate;
  if (isCredit) {
    if (!data.dueDate) {
      throw new AppError("Informe a data de vencimento do fiado.", 400);
    }
    const parsedDue = new Date(`${data.dueDate}T12:00:00`);
    if (Number.isNaN(parsedDue.getTime())) {
      throw new AppError("Data de vencimento inválida.", 400);
    }
    dueDate = parsedDue;
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.sale.update({
      where: { id },
      data: {
        customerId: data.customerId,
        soldAt,
        dueDate: isCredit ? dueDate : null,
        notes: data.notes?.trim() ? data.notes.trim() : null,
      },
      include: {
        customer: true,
        branch: true,
        items: { include: { product: true } },
        receivable: true,
      },
    });

    if (sale.receivable) {
      const now = new Date();
      const isOverdue = dueDate && dueDate < now;
      await tx.receivable.update({
        where: { id: sale.receivable.id },
        data: {
          customerId: data.customerId,
          dueDate: dueDate ?? sale.receivable.dueDate,
          status: isOverdue
            ? ReceivableStatus.OVERDUE
            : sale.receivable.status === ReceivableStatus.PAID
              ? ReceivableStatus.PAID
              : Number(sale.receivable.paidAmount) > 0
                ? ReceivableStatus.PARTIAL
                : ReceivableStatus.OPEN,
        },
      });
    }

    return updated;
  });
}

export async function deleteSale(
  id: string,
  options?: { roleSlug?: string; branchIds?: string[] },
) {
  const sale = await findSaleById(id);

  if (!sale) {
    throw new AppError("Venda não encontrada.", 404);
  }

  if (
    options?.roleSlug === "seller" &&
    options.branchIds &&
    options.branchIds.length > 0 &&
    !options.branchIds.includes(sale.branchId)
  ) {
    throw new AppError("Você não pode excluir vendas desta unidade.", 403);
  }

  if (sale.receivable && Number(sale.receivable.paidAmount) > 0) {
    throw new AppError(
      "Esta venda possui recebimentos no fiado. Estorne os pagamentos antes de excluir.",
      409,
    );
  }

  return db.$transaction(async (tx) => {
    for (const item of sale.items) {
      await applyBranchStockDelta(tx, {
        branchId: sale.branchId,
        productId: item.productId,
        delta: item.quantity,
        type: "RETURN",
        note: `Estorno venda excluída ${sale.id}`,
      });
    }

    if (sale.receivable) {
      await tx.payment.deleteMany({ where: { receivableId: sale.receivable.id } });
      await tx.receivable.delete({ where: { id: sale.receivable.id } });
    }

    await tx.payment.deleteMany({ where: { saleId: sale.id } });
    await tx.sale.delete({ where: { id: sale.id } });
  });
}
