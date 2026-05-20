import { Prisma } from "@prisma/client";

import { AppError } from "@/lib/errors";
import { onlyDigits } from "@/lib/utils";
import {
  SHOW_CUSTOMERS_MODULE_UI,
  SHOW_RECEIVABLES_MODULE_UI,
} from "@/lib/platform-config";
import {
  createCustomer,
  ensureWalkInSaleCustomer,
  findCustomerWithCounts,
  hardDeleteCustomer,
  listCustomers,
  patchCustomer,
  WALK_IN_SALE_CUSTOMER_PHONE,
} from "@/modules/customers/repository";
import { customerSchema } from "@/modules/customers/schemas";

export async function getCustomers(search?: string) {
  const customers = await listCustomers(search);

  return customers
    .filter((customer) => customer.phone !== WALK_IN_SALE_CUSTOMER_PHONE)
    .map((customer) => ({
      ...customer,
      purchaseHistoryCount: customer.sales.length,
      outstandingBalance: customer.receivables.reduce(
        (total, receivable) => total + Number(receivable.balanceDue),
        0,
      ),
    }));
}

/** Opções mínimas para o formulário de venda (com ou sem módulo de clientes na UI). */
export async function getCustomersForSaleForm() {
  const walkIn = await ensureWalkInSaleCustomer();

  if (SHOW_CUSTOMERS_MODULE_UI) {
    const rows = await listCustomers();
    return {
      walkInCustomerId: walkIn.id,
      customers: rows.map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        isWalkIn: customer.phone === WALK_IN_SALE_CUSTOMER_PHONE,
      })),
    };
  }

  if (SHOW_RECEIVABLES_MODULE_UI) {
    const rows = await listCustomers();
    return {
      walkInCustomerId: walkIn.id,
      customers: rows
        .filter((customer) => customer.phone !== WALK_IN_SALE_CUSTOMER_PHONE)
        .map((customer) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          isWalkIn: false,
        })),
    };
  }

  return {
    walkInCustomerId: walkIn.id,
    customers: [
      {
        id: walkIn.id,
        name: walkIn.name,
        phone: WALK_IN_SALE_CUSTOMER_PHONE,
        isWalkIn: true,
      },
    ],
  };
}

export async function updateCustomer(id: string, input: unknown) {
  if (!SHOW_CUSTOMERS_MODULE_UI) {
    throw new AppError("Módulo de clientes indisponível.", 404);
  }

  const data = customerSchema.parse(input);
  const phoneDigits = onlyDigits(data.phone);
  const cpfDigits = data.cpf ? onlyDigits(data.cpf) : "";

  if (phoneDigits === WALK_IN_SALE_CUSTOMER_PHONE) {
    throw new AppError("Este telefone é reservado para vendas avulsas.", 400);
  }

  try {
    return await patchCustomer(id, {
      name: data.name,
      phone: phoneDigits,
      cpf: cpfDigits || null,
      address: data.address || null,
      notes: data.notes || null,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("Já existe um cliente com este telefone ou CPF.", 409);
    }
    throw error;
  }
}

export async function deleteCustomer(id: string) {
  if (!SHOW_CUSTOMERS_MODULE_UI) {
    throw new AppError("Módulo de clientes indisponível.", 404);
  }

  const customer = await findCustomerWithCounts(id);
  if (!customer) throw new AppError("Cliente não encontrado.", 404);

  if (customer._count.sales > 0 || customer._count.receivables > 0) {
    throw new AppError(
      "Não é possível excluir um cliente com histórico de compras ou recebíveis em aberto.",
      409,
    );
  }

  await hardDeleteCustomer(id);
}

export async function registerCustomer(input: unknown) {
  const data = customerSchema.parse(input);

  const phoneDigits = onlyDigits(data.phone);
  const cpfDigits = data.cpf ? onlyDigits(data.cpf) : "";

  if (phoneDigits === WALK_IN_SALE_CUSTOMER_PHONE) {
    throw new AppError("Este telefone é reservado para vendas avulsas.", 400);
  }

  try {
    return await createCustomer({
      ...data,
      phone: phoneDigits,
      cpf: cpfDigits || undefined,
      address: data.address || undefined,
      notes: data.notes || undefined,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("Já existe um cliente com este telefone ou CPF.", 409);
    }
    throw error;
  }
}
