"use client";

import { PaymentMethod } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency, parseCurrencyInput } from "@/lib/utils";

type ProductOption = {
  id: string;
  name: string;
  salePrice: number | string;
  stockQuantity: number;
};

type BranchOption = {
  id: string;
  name: string;
  isWarehouse: boolean;
};

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: PaymentMethod.CASH, label: "Dinheiro" },
  { value: PaymentMethod.PIX, label: "Pix" },
  { value: PaymentMethod.DEBIT_CARD, label: "Cartão de débito" },
  { value: PaymentMethod.CREDIT_CARD, label: "Cartão de crédito" },
];

const numberInputClassName =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

export function SaleForm({
  branches,
  defaultBranchId,
  customerId,
  products,
}: {
  branches: BranchOption[];
  defaultBranchId: string;
  customerId: string;
  products: ProductOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [saleTotal, setSaleTotal] = useState("");
  const [useDiscount, setUseDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");

  const branchOptions = useMemo(
    () =>
      branches.map((branch) => ({
        value: branch.id,
        label: `${branch.name}${branch.isWarehouse ? " (depósito)" : ""}`,
      })),
    [branches],
  );

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.id,
        label: `${product.name} (${product.stockQuantity} un.)`,
      })),
    [products],
  );

  const paymentOptions = useMemo(
    () => PAYMENT_METHOD_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
    [],
  );

  const currentProduct = products.find((product) => product.id === productId);
  const parsedQuantity = quantity === "" ? 0 : Number(quantity);
  const catalogUnitPrice = Number(currentProduct?.salePrice ?? 0);
  const catalogTotal = catalogUnitPrice * Math.max(parsedQuantity, 0);
  const parsedDiscount = parseCurrencyInput(discountAmount);
  const computedSaleTotal = useDiscount
    ? Math.max(0, catalogTotal - parsedDiscount)
    : parseCurrencyInput(saleTotal);
  const displaySaleTotal = useDiscount
    ? formatCurrency(computedSaleTotal)
    : saleTotal;

  const priceError = useMemo(() => {
    if (!parsedQuantity) return null;

    if (useDiscount) {
      if (catalogTotal <= 0) return null;
      if (parsedDiscount <= 0) return "Informe o valor do desconto.";
      if (parsedDiscount >= catalogTotal - 0.009) {
        return "O desconto deve ser menor que o preço do sistema.";
      }
      if (computedSaleTotal <= 0) return "O valor final da venda deve ser maior que zero.";
      return null;
    }

    const manualTotal = parseCurrencyInput(saleTotal);
    if (!manualTotal) return null;
    if (manualTotal < catalogTotal - 0.009) {
      return "Valor abaixo do preço do produto. Marque a opção de desconto para continuar.";
    }
    return null;
  }, [
    parsedQuantity,
    useDiscount,
    parsedDiscount,
    catalogTotal,
    computedSaleTotal,
    saleTotal,
  ]);

  useEffect(() => {
    if (useDiscount) return;

    if (catalogTotal > 0) {
      setSaleTotal(formatCurrency(catalogTotal));
    } else {
      setSaleTotal("");
    }
  }, [productId, catalogTotal, useDiscount]);

  function handleDiscountChange(value: string) {
    setDiscountAmount(value);
  }

  function handleSaleTotalChange(value: string) {
    if (useDiscount) return;
    setSaleTotal(value);
  }

  function handleDiscountToggle(checked: boolean) {
    setUseDiscount(checked);
    if (checked) {
      setDiscountAmount("");
    } else {
      setDiscountAmount("");
      setSaleTotal(catalogTotal > 0 ? formatCurrency(catalogTotal) : "");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!branchId) {
      setError("Nenhuma unidade disponível para registrar a venda.");
      return;
    }

    if (!customerId) {
      setError("Cliente padrão de venda não configurado.");
      return;
    }

    if (!parsedQuantity || parsedQuantity < 1) {
      setError("Informe uma quantidade válida.");
      return;
    }

    if (!computedSaleTotal || computedSaleTotal <= 0) {
      setError(useDiscount ? "Informe um desconto válido." : "Informe o valor da venda.");
      return;
    }

    if (priceError) {
      setError(priceError);
      return;
    }

    const unitPrice = computedSaleTotal / parsedQuantity;

    const response = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        branchId,
        customerId,
        paymentMethod,
        applyDiscount: useDiscount,
        discount: useDiscount ? parsedDiscount : 0,
        items: [{ productId, quantity: parsedQuantity, unitPrice }],
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setError(data.message || "Não foi possível registrar a venda.");
      toast.error("Erro ao registrar venda", { description: data.message });
      return;
    }

    toast.success("Venda registrada com sucesso!");
    setQuantity("");
    setSaleTotal("");
    setUseDiscount(false);
    setDiscountAmount("");
    router.refresh();
  }

  return (
    <Card>
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Registrar venda</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Vendas à vista com valor ajustável. Para vender abaixo do preço do sistema, marque a opção de desconto.
        </p>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        {branches.length > 0 ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Unidade</label>
            <DropdownSelect
              value={branchId}
              onChange={setBranchId}
              options={branchOptions}
              placeholder="Selecione a unidade"
            />
          </div>
        ) : (
          <p className="text-sm text-rose-700 md:col-span-2">
            Cadastre uma unidade ativa antes de registrar vendas.
          </p>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Produto</label>
          <DropdownSelect
            value={productId}
            onChange={setProductId}
            options={productOptions}
            placeholder="Selecione o produto"
            disabled={productOptions.length === 0}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Quantidade</label>
          <Input
            type="number"
            placeholder="0"
            value={quantity}
            onChange={(e) => {
              const val = e.target.value;
              setQuantity(val === "" ? "" : Number(val));
            }}
            className={numberInputClassName}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Forma de pagamento</label>
          <DropdownSelect
            value={paymentMethod}
            onChange={(value) => setPaymentMethod(value as PaymentMethod)}
            options={paymentOptions}
            placeholder="Selecione a forma de pagamento"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3">
          <input
            type="checkbox"
            id="useDiscount"
            className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent)]"
            checked={useDiscount}
            onChange={(e) => handleDiscountToggle(e.target.checked)}
          />
          <label htmlFor="useDiscount" className="text-sm text-[var(--foreground)]">
            Venda com desconto (valor abaixo do preço do sistema)
          </label>
        </div>

        {useDiscount ? (
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Desconto</label>
            <CurrencyInput
              value={discountAmount}
              onChange={handleDiscountChange}
              placeholder="R$ 0,00"
              aria-invalid={!!priceError}
              className={cn(priceError && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10")}
            />
          </div>
        ) : null}

        <div
          className={cn(
            "md:col-span-2 rounded-3xl border p-4 transition-colors",
            priceError
              ? "border-rose-500/40 bg-rose-50/50"
              : "border-[var(--border)] bg-[var(--panel-strong)]",
          )}
        >
          <p className="text-sm text-[var(--muted-foreground)]">
            {useDiscount ? "Valor da venda (calculado)" : "Valor da venda"}
          </p>
          <CurrencyInput
            value={displaySaleTotal}
            onChange={handleSaleTotalChange}
            placeholder="R$ 0,00"
            readOnly={useDiscount}
            aria-invalid={!!priceError}
            className={cn(
              "mt-1 h-auto rounded-xl border-0 px-3 py-2 text-2xl font-semibold text-[var(--foreground)] shadow-none",
              useDiscount
                ? "cursor-default bg-white/40 focus:ring-0"
                : "bg-white/60 placeholder:text-[var(--muted-foreground)]/50 focus:border-[var(--accent)] focus:bg-white focus:ring-2 focus:ring-[color:rgba(31,90,70,0.12)]",
              priceError && !useDiscount && "bg-rose-50/80 text-rose-900 focus:border-rose-500 focus:ring-rose-500/10",
            )}
          />
          {catalogTotal > 0 ? (
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Preço no sistema: {formatCurrency(catalogTotal)}
              {parsedQuantity > 1 ? ` (${formatCurrency(catalogUnitPrice)} un.)` : ""}
              {useDiscount && parsedDiscount > 0 ? (
                <span className="ml-1 text-[var(--foreground)]">
                  · Desconto: {formatCurrency(parsedDiscount)}
                </span>
              ) : null}
            </p>
          ) : null}
          {priceError ? (
            <p className="mt-1 text-xs font-medium text-rose-600">{priceError}</p>
          ) : null}
        </div>

        {error ? (
          <p className="text-sm text-rose-600 md:col-span-2">{error}</p>
        ) : null}
        <div className="md:col-span-2">
          <Button
            type="submit"
            disabled={branches.length === 0 || !branchId || !!priceError}
          >
            Registrar venda
          </Button>
        </div>
      </form>
    </Card>
  );
}
