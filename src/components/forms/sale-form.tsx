"use client";

import { PaymentMethod } from "@prisma/client";
import { addDays, format, startOfToday } from "date-fns";
import { CalendarDays, Package, Percent, SlidersHorizontal, Wallet } from "lucide-react";
import { CustomerSearchInput } from "@/components/sales/customer-search-input";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { Input } from "@/components/ui/input";
import { SHOW_RECEIVABLES_MODULE_UI } from "@/lib/platform-config";
import { cn, formatCurrency, parseCurrencyInput } from "@/lib/utils";

type ProductOption = {
  id: string;
  name: string;
  salePrice: number | string;
};

type BranchOption = {
  id: string;
  name: string;
  isWarehouse: boolean;
};

const BASE_PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: PaymentMethod.CASH, label: "Dinheiro" },
  { value: PaymentMethod.PIX, label: "Pix" },
  { value: PaymentMethod.DEBIT_CARD, label: "Cartão de débito" },
  { value: PaymentMethod.CREDIT_CARD, label: "Cartão de crédito" },
];

function defaultDueDateIso() {
  return format(addDays(new Date(), 30), "yyyy-MM-dd");
}

type CustomerOption = {
  id: string;
  name: string;
  phone?: string | null;
  isWalkIn?: boolean;
};

const numberInputClassName =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[color:rgba(49,91,77,0.12)] text-[var(--accent)]">
        <Icon className="h-4 w-4" />
      </div>
      <h4 className="text-sm font-semibold tracking-tight text-[var(--foreground)]">{title}</h4>
    </div>
  );
}

function OptionToggle({
  active,
  onToggle,
  icon: Icon,
  label,
  id,
}: {
  active: boolean;
  onToggle: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  id: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={active}
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-medium transition",
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm"
          : "border-[var(--border)] bg-[var(--panel-strong)] text-[var(--muted-foreground)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </button>
  );
}

export function SaleForm({
  branches,
  defaultBranchId,
  walkInCustomerId,
  customers,
  products,
  showCustomerPicker = false,
}: {
  branches: BranchOption[];
  defaultBranchId: string;
  walkInCustomerId: string;
  customers: CustomerOption[];
  products: ProductOption[];
  showCustomerPicker?: boolean;
}) {
  const router = useRouter();
  const fiadoCustomers = useMemo(
    () => customers.filter((customer) => !customer.isWalkIn),
    [customers],
  );
  const [error, setError] = useState<string | null>(null);
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDateIso);
  const [useCustomSoldAt, setUseCustomSoldAt] = useState(false);
  const [soldAt, setSoldAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [branchStockByProduct, setBranchStockByProduct] = useState<Record<string, number>>(
    {},
  );
  const [saleTotal, setSaleTotal] = useState("");
  const [useDiscount, setUseDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");

  const isCredit = paymentMethod === PaymentMethod.CREDIT;

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
        label: product.name,
      })),
    [products],
  );

  useEffect(() => {
    if (!branchId) {
      setBranchStockByProduct({});
      return;
    }

    let cancelled = false;

    async function loadBranchStock() {
      try {
        const response = await fetch(
          `/api/inventory/branch-stock?branchId=${encodeURIComponent(branchId)}`,
        );
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as {
          stockByProduct?: Record<string, number>;
        };
        if (!cancelled) {
          setBranchStockByProduct(data.stockByProduct ?? {});
        }
      } catch {
        if (!cancelled) {
          setBranchStockByProduct({});
        }
      }
    }

    void loadBranchStock();
    return () => {
      cancelled = true;
    };
  }, [branchId]);

  const paymentOptions = useMemo(() => {
    const options = [...BASE_PAYMENT_METHOD_OPTIONS];
    if (SHOW_RECEIVABLES_MODULE_UI) {
      options.push({ value: PaymentMethod.CREDIT, label: "Fiado" });
    }
    return options.map((option) => ({ value: option.value, label: option.label }));
  }, []);

  const customerOptions = useMemo(() => {
    const pool = isCredit
      ? fiadoCustomers
      : customers.filter((customer) => !customer.isWalkIn);
    return pool.map((customer) => ({
      value: customer.id,
      label: customer.name,
    }));
  }, [customers, fiadoCustomers, isCredit]);

  const effectiveCustomerId = isCredit
    ? selectedCustomerId
    : selectedCustomerId || walkInCustomerId;

  function handlePaymentMethodChange(value: PaymentMethod) {
    setPaymentMethod(value);
    if (value === PaymentMethod.CREDIT) {
      if (
        selectedCustomerId &&
        !fiadoCustomers.some((c) => c.id === selectedCustomerId)
      ) {
        setSelectedCustomerId(fiadoCustomers[0]?.id ?? "");
      }
    }
  }

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

    if (isCredit) {
      if (fiadoCustomers.length === 0) {
        setError("Cadastre um cliente antes de registrar venda fiado.");
        return;
      }
      if (!selectedCustomerId) {
        setError("Selecione o cliente para venda fiado.");
        return;
      }
    } else if (!walkInCustomerId) {
      setError("Cliente padrão de venda não configurado.");
      return;
    }

    if (isCredit && !dueDate) {
      setError("Informe a data de vencimento do fiado.");
      return;
    }

    if (useCustomSoldAt && !soldAt) {
      setError("Informe a data da venda.");
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
        customerId: effectiveCustomerId,
        paymentMethod,
        dueDate: isCredit ? dueDate : undefined,
        useCustomSoldAt,
        soldAt: useCustomSoldAt ? soldAt : undefined,
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
    if (!useCustomSoldAt) {
      setSoldAt(format(new Date(), "yyyy-MM-dd"));
    }
    router.refresh();
  }

  const branchStockForProduct = productId ? (branchStockByProduct[productId] ?? 0) : 0;
  const branchStockLoading = productId && branchStockByProduct[productId] === undefined;
  const productName = currentProduct?.name ?? "—";
  const quantityLabel = parsedQuantity > 0 ? String(parsedQuantity) : "—";
  const submitDisabled =
    branches.length === 0 ||
    !branchId ||
    !!priceError ||
    (isCredit && fiadoCustomers.length === 0);

  const summaryPanel = (variant: "sidebar" | "sticky") => (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)]",
        variant === "sidebar" ? "p-5 shadow-sm" : "border-x-0 border-b-0 rounded-none px-0 py-4",
        priceError && variant === "sidebar" && "border-rose-500/40",
      )}
    >
      <h4
        className={cn(
          "font-semibold text-[var(--foreground)]",
          variant === "sticky" ? "text-sm" : "text-base",
        )}
      >
        Resumo da venda
      </h4>

      <div className="space-y-2.5 text-sm">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[var(--muted-foreground)]">
            {productName} × {quantityLabel}
          </span>
          <span className="shrink-0 font-medium text-[var(--foreground)]">
            {catalogTotal > 0 ? formatCurrency(catalogTotal) : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[var(--muted-foreground)]">Preço no sistema</span>
          <span className="font-medium text-[var(--foreground)]">
            {catalogTotal > 0 ? formatCurrency(catalogTotal) : "—"}
          </span>
        </div>
        {useDiscount && parsedDiscount > 0 ? (
          <div className="flex items-center justify-between gap-3 text-rose-700">
            <span>Desconto</span>
            <span className="font-medium">− {formatCurrency(parsedDiscount)}</span>
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "border-t border-[var(--border)] pt-4 transition-colors",
          priceError && "rounded-2xl border-rose-500/30 bg-rose-50/40 px-3 -mx-1",
        )}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Total
        </p>
        <CurrencyInput
          value={displaySaleTotal}
          onChange={handleSaleTotalChange}
          placeholder="R$ 0,00"
          readOnly={useDiscount}
          aria-invalid={!!priceError}
          className={cn(
            "mt-1 h-auto rounded-xl border-0 px-0 py-1 text-2xl font-semibold text-[var(--foreground)] shadow-none lg:text-3xl",
            useDiscount
              ? "cursor-default bg-transparent focus:ring-0"
              : "bg-transparent placeholder:text-[var(--muted-foreground)]/50 focus:border-[var(--accent)] focus:bg-white/60 focus:ring-2 focus:ring-[color:rgba(31,90,70,0.12)]",
            priceError && !useDiscount && "text-rose-700 focus:border-rose-500 focus:ring-rose-500/10",
          )}
        />
        {parsedQuantity > 1 && catalogTotal > 0 ? (
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {formatCurrency(catalogUnitPrice)} por unidade
          </p>
        ) : null}
        {priceError ? (
          <p className="mt-1 text-xs font-medium text-rose-600">{priceError}</p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={submitDisabled}>
        Registrar venda
      </Button>
    </div>
  );

  return (
    <Card className="w-full overflow-visible">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Registrar venda</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Vendas à vista ou fiado com valor ajustável. Fiado gera automaticamente um título em Contas a
          receber. Para vender abaixo do preço do sistema, marque a opção de desconto.
        </p>
      </div>

      <form
        className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)] lg:items-start lg:gap-8"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-6 max-lg:pb-2">
          <section className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)]/40 p-5">
            <SectionHeading icon={Package} title="Produto e quantidade" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {branches.length > 0 ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                    Unidade
                  </label>
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

              <div className={cn(branches.length === 0 && "md:col-span-2")}>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  Produto
                </label>
                <div className="flex items-start gap-2">
                  <DropdownSelect
                    value={productId}
                    onChange={setProductId}
                    options={productOptions}
                    placeholder="Selecione o produto"
                    disabled={productOptions.length === 0}
                    className="min-w-0 flex-1"
                  />
                  {productId && branchId ? (
                    <Badge
                      tone={
                        branchStockLoading
                          ? "neutral"
                          : branchStockForProduct > 0
                            ? "success"
                            : "warning"
                      }
                      className="mt-0.5 shrink-0 whitespace-nowrap"
                    >
                      {branchStockLoading ? "…" : `${branchStockForProduct} un.`}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  Quantidade
                </label>
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
            </div>
          </section>

          <section className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)]/40 p-5">
            <SectionHeading icon={Wallet} title="Pagamento" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  Forma de pagamento
                </label>
                <DropdownSelect
                  value={paymentMethod}
                  onChange={(value) => handlePaymentMethodChange(value as PaymentMethod)}
                  options={paymentOptions}
                  placeholder="Selecione a forma de pagamento"
                />
              </div>

              {isCredit ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                    Vencimento do fiado
                  </label>
                  <DatePicker
                    value={dueDate}
                    onChange={setDueDate}
                    min={format(new Date(), "yyyy-MM-dd")}
                    placeholder="Selecione a data de vencimento"
                  />
                </div>
              ) : null}

              {(showCustomerPicker || isCredit) && (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                    Cliente
                    {!isCredit ? (
                      <span className="ml-1 font-normal text-[var(--muted-foreground)]">
                        (opcional)
                      </span>
                    ) : null}
                  </label>
                  <CustomerSearchInput
                    customers={
                      isCredit ? fiadoCustomers : customers.filter((c) => !c.isWalkIn)
                    }
                    value={selectedCustomerId}
                    onChange={setSelectedCustomerId}
                    placeholder={
                      isCredit
                        ? fiadoCustomers.length === 0
                          ? "Nenhum cliente cadastrado"
                          : "Selecione o cliente"
                        : "Venda avulsa se não informar"
                    }
                    disabled={isCredit && fiadoCustomers.length === 0}
                  />
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)]/40 p-5">
            <SectionHeading icon={SlidersHorizontal} title="Opções" />
            <div className="flex flex-wrap gap-2">
              <OptionToggle
                id="useDiscount"
                active={useDiscount}
                onToggle={() => handleDiscountToggle(!useDiscount)}
                icon={Percent}
                label="Aplicar desconto"
              />
              <OptionToggle
                id="useCustomSoldAt"
                active={useCustomSoldAt}
                onToggle={() => setUseCustomSoldAt(!useCustomSoldAt)}
                icon={CalendarDays}
                label="Data retroativa"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {useDiscount ? (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                    Desconto
                  </label>
                  <CurrencyInput
                    value={discountAmount}
                    onChange={handleDiscountChange}
                    placeholder="R$ 0,00"
                    aria-invalid={!!priceError}
                    className={cn(
                      priceError &&
                        "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10",
                    )}
                  />
                </div>
              ) : null}

              {useCustomSoldAt ? (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                    Data da venda
                  </label>
                  <DatePicker
                    value={soldAt}
                    onChange={setSoldAt}
                    max={format(startOfToday(), "yyyy-MM-dd")}
                    placeholder="Selecione a data da venda"
                  />
                </div>
              ) : null}
            </div>
          </section>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-4">{summaryPanel("sidebar")}</aside>

        <aside className="sticky bottom-0 z-20 -mx-6 border-t border-[var(--border)] bg-[var(--panel)]/95 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
          {summaryPanel("sticky")}
        </aside>
      </form>
    </Card>
  );
}
