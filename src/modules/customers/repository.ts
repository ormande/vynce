import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/** Telefone reservado para vendas sem cadastro de cliente na UI (único no banco). */
export const WALK_IN_SALE_CUSTOMER_PHONE = "00000000000";

export async function listCustomers(search?: string) {
  const where: Prisma.CustomerWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { cpf: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  return db.customer.findMany({
    where,
    include: {
      sales: {
        select: {
          id: true,
          total: true,
          soldAt: true,
        },
      },
      receivables: {
        select: {
          balanceDue: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  cpf?: string;
  address?: string;
  notes?: string;
}) {
  return db.customer.create({
    data,
  });
}

export async function ensureWalkInSaleCustomer() {
  return db.customer.upsert({
    where: { phone: WALK_IN_SALE_CUSTOMER_PHONE },
    update: {},
    create: {
      name: "Venda avulsa",
      phone: WALK_IN_SALE_CUSTOMER_PHONE,
      notes: "Cliente interno usado quando o módulo de clientes está oculto na interface.",
    },
    select: { id: true, name: true },
  });
}
