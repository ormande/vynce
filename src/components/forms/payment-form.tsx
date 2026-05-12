"use client";

import { PaymentMethod } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function PaymentForm({
  receivables,
}: {
  receivables: {
    id: string;
    customer: { name: string };
    balanceDue: number | string;
    customerId: string;
    saleId: string | null;
  }[];
}) {
  const router = useRouter();
  const [receivableId, setReceivableId] = useState(receivables[0]?.id ?? "");
  const [amount, setAmount] = useState<number>(
    Number(receivables[0]?.balanceDue ?? 0),
  );
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const receivable = receivables.find((item) => item.id === receivableId);

    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receivableId,
        customerId: receivable?.customerId,
        saleId: receivable?.saleId ?? undefined,
        amount,
        method,
        receivedAt,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setError(data.message || "Não foi possível registrar o pagamento.");
      return;
    }

    router.refresh();
  }

  return (
    <Card>
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Registrar pagamento</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Baixa parcial ou total de recebíveis com atualização automática do saldo do cliente.
        </p>
      </div>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <Select value={receivableId} onChange={(e) => setReceivableId(e.target.value)}>
          {receivables.map((receivable) => (
            <option key={receivable.id} value={receivable.id}>
              {receivable.customer.name} ({Number(receivable.balanceDue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})
            </option>
          ))}
        </Select>
        <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
          <option value={PaymentMethod.CASH}>Dinheiro</option>
          <option value={PaymentMethod.PIX}>Pix</option>
          <option value={PaymentMethod.DEBIT_CARD}>Cartão de débito</option>
          <option value={PaymentMethod.CREDIT_CARD}>Cartão de crédito</option>
        </Select>
        <Input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Valor recebido"
        />
        <Input
          type="date"
          value={receivedAt}
          onChange={(e) => setReceivedAt(e.target.value)}
        />
        {error ? (
          <p className="text-sm text-rose-600 md:col-span-2">{error}</p>
        ) : null}
        <div className="md:col-span-2">
          <Button type="submit">Registrar pagamento</Button>
        </div>
      </form>
    </Card>
  );
}
