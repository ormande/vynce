import { SHOW_CUSTOMERS_MODULE_UI } from "@/lib/platform-config";
import {
  createCustomer,
  ensureWalkInSaleCustomer,
  listCustomers,
} from "@/modules/customers/repository";
import { customerSchema } from "@/modules/customers/schemas";

export async function getCustomers(search?: string) {
  const customers = await listCustomers(search);

  return customers.map((customer) => ({
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
  if (SHOW_CUSTOMERS_MODULE_UI) {
    const rows = await listCustomers();
    return rows.map((customer) => ({ id: customer.id, name: customer.name }));
  }

  const walkIn = await ensureWalkInSaleCustomer();
  return [{ id: walkIn.id, name: walkIn.name }];
}

export async function registerCustomer(input: unknown) {
  const data = customerSchema.parse(input);
  return createCustomer({
    ...data,
    cpf: data.cpf || undefined,
    address: data.address || undefined,
    notes: data.notes || undefined,
  });
}
