export type ReceivableLine = {
  id: string;
  customerId: string;
  customer: { name: string };
  balanceDue: number | string;
  dueDate?: Date | string;
};

export type CustomerReceivableGroup = {
  customerId: string;
  customerName: string;
  totalBalance: number;
  titleCount: number;
  receivableIds: string[];
  items: ReceivableLine[];
};

/** Agrupa títulos em aberto por cliente (soma dos saldos devedores). */
export function groupReceivablesByCustomer<T extends ReceivableLine>(
  receivables: T[],
): CustomerReceivableGroup[] {
  const map = new Map<string, CustomerReceivableGroup>();

  for (const item of receivables) {
    const balance = Number(item.balanceDue);
    const existing = map.get(item.customerId);

    if (existing) {
      existing.totalBalance += balance;
      existing.titleCount += 1;
      existing.receivableIds.push(item.id);
      existing.items.push(item);
    } else {
      map.set(item.customerId, {
        customerId: item.customerId,
        customerName: item.customer.name,
        totalBalance: balance,
        titleCount: 1,
        receivableIds: [item.id],
        items: [item],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.customerName.localeCompare(b.customerName, "pt-BR"),
  );
}
