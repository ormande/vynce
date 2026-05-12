"use client";

import { PaymentMethod } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type ProductOption = {
  id: string;
  name: string;
  salePrice: number | string;
  stockQuantity: number;
};

type CustomerOption = {
  id: string;
  name: string;
};

export function SaleForm({
  customers,
  products,
  showCustomerSelector = true,
}: {
  customers: CustomerOption[];
  products: ProductOption[];
  /** Quando `false`, usa o único cliente passado (ex.: venda avulsa) sem exibir o campo. */
  showCustomerSelector?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH,
  );
  const [soldAt, setSoldAt] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const response = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        paymentMethod,
        soldAt,
        dueDate,
        discount: 0,
        items: [{ productId, quantity }],
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setError(data.message || "Não foi possível registrar a venda.");
      return;
    }

    setQuantity(1);
    setDueDate("");
    router.refresh();
  }

  const currentProduct = products.find((product) => product.id === productId);
  const estimatedTotal =
    Number(currentProduct?.salePrice ?? 0) * Math.max(quantity, 0);

  return (
    <Card>
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Registrar venda</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {showCustomerSelector
            ? "Fluxo enxuto para vendas à vista ou fiado, com atualização automática de estoque e contas a receber."
            : "Vendas registradas em nome interno padrão; estoque e recebíveis seguem iguais."}
        </p>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        {showCustomerSelector ? (
          <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </Select>
        ) : null}
        <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} ({product.stockQuantity} un.)
            </option>
          ))}
        </Select>
        <Input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          placeholder="Quantidade"
        />
        <Select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
        >
          <option value={PaymentMethod.CASH}>Dinheiro</option>
          <option value={PaymentMethod.PIX}>Pix</option>
          <option value={PaymentMethod.DEBIT_CARD}>Cartão de débito</option>
          <option value={PaymentMethod.CREDIT_CARD}>Cartão de crédito</option>
          <option value={PaymentMethod.CREDIT}>Fiado</option>
        </Select>
        <Input type="date" value={soldAt} onChange={(e) => setSoldAt(e.target.value)} />
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          placeholder="Vencimento"
        />
        <div className="md:col-span-2 rounded-3xl border border-[var(--border)] bg-[var(--panel-strong)] p-4">
          <p className="text-sm text-[var(--muted-foreground)]">Valor estimado</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
            {estimatedTotal.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
        {error ? (
          <p className="text-sm text-rose-600 md:col-span-2">{error}</p>
        ) : null}
        <div className="md:col-span-2">
          <Button type="submit">Registrar venda</Button>
        </div>
      </form>
    </Card>
  );
}
