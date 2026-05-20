"use client";

import { PaymentMethod } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ReceivableSearchInput } from "@/components/receivables/receivable-search-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { formatCurrency } from "@/lib/utils";

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: PaymentMethod.CASH, label: "Dinheiro" },
  { value: PaymentMethod.PIX, label: "Pix" },
  { value: PaymentMethod.DEBIT_CARD, label: "Cartão de débito" },
  { value: PaymentMethod.CREDIT_CARD, label: "Cartão de crédito" },
];

function parseCurrencyValue(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

function toCurrencyInputValue(amount: number | string) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  return formatCurrency(numeric);
}

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
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const paymentOptions = useMemo(
    () => PAYMENT_METHOD_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
    [],
  );

  useEffect(() => {
    if (receivables.length === 0) {
      setReceivableId("");
      setAmount("");
      return;
    }

    const current = receivables.find((item) => item.id === receivableId);
    const receivable = current ?? receivables[0];

    if (!current) {
      setReceivableId(receivable.id);
    }

    setAmount(toCurrencyInputValue(receivable.balanceDue));
  }, [receivableId, receivables]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedAmount = parseCurrencyValue(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Informe um valor válido.");
      return;
    }

    const receivable = receivables.find((item) => item.id === receivableId);

    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receivableId,
        customerId: receivable?.customerId,
        saleId: receivable?.saleId ?? undefined,
        amount: parsedAmount,
        method,
        receivedAt,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setError(data.message || "Não foi possível registrar o pagamento.");
      toast.error("Erro ao registrar pagamento", { description: data.message });
      return;
    }

    toast.success("Pagamento registrado com sucesso!");
    router.refresh();
  }

  return (
    <Card className="w-full">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Registrar pagamento</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Baixa parcial ou total de recebíveis com atualização automática do saldo do cliente.
        </p>
      </div>
      <form className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-3" onSubmit={handleSubmit}>
        <div className="sm:col-span-2 xl:col-span-3">
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Recebível
          </label>
          <ReceivableSearchInput
            receivables={receivables}
            value={receivableId}
            onChange={setReceivableId}
            onSelectReceivable={(r) => setAmount(toCurrencyInputValue(r.balanceDue))}
            placeholder={
              receivables.length === 0 ? "Nenhum título em aberto" : "Buscar título em aberto…"
            }
            disabled={receivables.length === 0}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Forma de pagamento
          </label>
          <DropdownSelect
            value={method}
            onChange={(value) => setMethod(value as PaymentMethod)}
            options={paymentOptions}
            placeholder="Selecione a forma de pagamento"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Valor recebido
          </label>
          <CurrencyInput value={amount} onChange={setAmount} placeholder="R$ 0,00" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
            Data do recebimento
          </label>
          <DatePicker
            value={receivedAt}
            onChange={setReceivedAt}
            placeholder="Data do recebimento"
          />
        </div>
        {error ? <p className="text-sm text-rose-600 sm:col-span-2 xl:col-span-3">{error}</p> : null}
        <div className="sm:col-span-2 xl:col-span-3">
          <Button type="submit" disabled={receivables.length === 0}>
            Registrar pagamento
          </Button>
        </div>
      </form>
    </Card>
  );
}
