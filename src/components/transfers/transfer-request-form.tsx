"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import {
  listStocksForTransferFromBranchAction,
  requestTransferAction,
} from "@/modules/transfers/actions";

type BranchOpt = { id: string; name: string; isWarehouse: boolean };
type StockOpt = { productId: string; name: string; quantity: number };

export function TransferRequestForm({
  branchesFrom,
  branchesToPool,
  onSuccess,
}: {
  branchesFrom: BranchOpt[];
  branchesToPool: BranchOpt[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [fromBranchId, setFromBranchId] = useState(branchesFrom[0]?.id ?? "");
  const [toBranchId, setToBranchId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [stocks, setStocks] = useState<StockOpt[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedStock = useMemo(() => {
    return stocks.find((s) => s.productId === productId);
  }, [stocks, productId]);

  const quantityError = useMemo(() => {
    if (quantity && selectedStock && quantity > selectedStock.quantity) {
      return `Quantidade superior ao estoque disponível (${selectedStock.quantity} un.)`;
    }
    return null;
  }, [quantity, selectedStock]);

  const branchesTo = useMemo(
    () => branchesToPool.filter((b) => b.id !== fromBranchId),
    [branchesToPool, fromBranchId],
  );

  const effectiveToBranchId = useMemo(() => {
    if (branchesTo.some((b) => b.id === toBranchId)) return toBranchId;
    return branchesTo[0]?.id ?? "";
  }, [branchesTo, toBranchId]);

  useEffect(() => {
    if (!fromBranchId) return;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) setLoadingStocks(true);
    });
    void listStocksForTransferFromBranchAction(fromBranchId).then((res) => {
      if (cancelled) return;
      setLoadingStocks(false);
      if (!res.ok) {
        setStocks([]);
        setError(res.message);
        return;
      }
      setStocks(res.stocks);
      setProductId((prev) => {
        if (prev && res.stocks.some((s) => s.productId === prev)) return prev;
        return res.stocks[0]?.productId ?? "";
      });
      setError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [fromBranchId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const destination = effectiveToBranchId;
    if (!fromBranchId || !destination || !productId || !quantity) {
      setError("Preencha origem, destino, produto e quantidade.");
      return;
    }
    if (quantityError) {
      setError(quantityError);
      return;
    }
    setPending(true);
    const res = await requestTransferAction({
      fromBranchId,
      toBranchId: destination,
      productId,
      quantity: Number(quantity),
      notes,
    });
    setPending(false);
    if (!res.ok) {
      setError(res.message);
      toast.error("Erro ao solicitar transferência", { description: res.message });
      return;
    }
    toast.success("Solicitação de transferência enviada!");
    setNotes("");
    setQuantity("");
    router.refresh();
    if (onSuccess) onSuccess();
  }

  if (branchesFrom.length === 0) {
    return (
      <p className="text-sm text-rose-700">
        Nenhuma unidade disponível para solicitar transferência.
      </p>
    );
  }

  const fromOptions = branchesFrom.map((b) => ({
    value: b.id,
    label: b.name + (b.isWarehouse ? " (depósito)" : ""),
  }));

  const toOptions = branchesTo.map((b) => ({
    value: b.id,
    label: b.name + (b.isWarehouse ? " (depósito)" : ""),
  }));

  const stockOptions = stocks.map((s) => ({
    value: s.productId,
    label: `${s.name} (${s.quantity} un. disponíveis)`,
  }));

  const stockPlaceholder = loadingStocks
    ? "Carregando…"
    : stocks.length === 0
      ? "Sem estoque na origem"
      : "Selecione um produto";

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 md:grid-cols-2">
      {/* 1ª linha: origem e destino */}
      <div>
        <label className="text-sm font-medium text-[var(--foreground)]">Unidade de origem</label>
        <DropdownSelect
          className="mt-2"
          value={fromBranchId}
          onChange={(value) => {
            setFromBranchId(value);
            setToBranchId("");
          }}
          disabled={branchesFrom.length === 1}
          placeholder="Selecione a origem"
          options={fromOptions}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-[var(--foreground)]">Unidade de destino</label>
        <DropdownSelect
          className="mt-2"
          value={effectiveToBranchId}
          onChange={(value) => setToBranchId(value)}
          disabled={branchesTo.length === 0}
          placeholder="Selecione o destino"
          options={toOptions}
        />
      </div>

      {/* 2ª linha: produto e quantidade */}
      <div>
        <label className="text-sm font-medium text-[var(--foreground)]">Produto</label>
        <DropdownSelect
          className="mt-2"
          value={productId || undefined}
          onChange={(value) => setProductId(value)}
          disabled={loadingStocks || stocks.length === 0}
          placeholder={stockPlaceholder}
          options={stockOptions}
          invalid={!!quantityError}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-[var(--foreground)]">Quantidade</label>
        <Input
          className={cn(
            "mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            quantityError && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10"
          )}
          type="number"
          placeholder="0"
          value={quantity}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "") {
              setQuantity("");
            } else {
              setQuantity(Number(val));
            }
          }}
        />
        {quantityError && (
          <p className="mt-1 text-xs font-medium text-rose-600">{quantityError}</p>
        )}
      </div>

      {/* 3ª linha: observações */}
      <div className="md:col-span-2">
        <label className="text-sm font-medium text-[var(--foreground)]">Observações (opcional)</label>
        <Input className="mt-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error ? <p className="md:col-span-2 text-sm text-rose-700">{error}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" className="rounded-full" disabled={pending || !productId || !!quantityError}>
          {pending ? "Enviando…" : "Solicitar transferência"}
        </Button>
      </div>
    </form>
  );
}
