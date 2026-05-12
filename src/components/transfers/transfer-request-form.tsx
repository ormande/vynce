"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  listStocksForTransferFromBranchAction,
  requestTransferAction,
} from "@/modules/transfers/actions";

type BranchOpt = { id: string; name: string; isWarehouse: boolean };
type StockOpt = { productId: string; name: string; quantity: number };

export function TransferRequestForm({
  branchesFrom,
  branchesToPool,
}: {
  branchesFrom: BranchOpt[];
  branchesToPool: BranchOpt[];
}) {
  const router = useRouter();
  const [fromBranchId, setFromBranchId] = useState(branchesFrom[0]?.id ?? "");
  const [toBranchId, setToBranchId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [stocks, setStocks] = useState<StockOpt[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const branchesTo = useMemo(
    () => branchesToPool.filter((b) => b.id !== fromBranchId),
    [branchesToPool, fromBranchId],
  );

  const effectiveToBranchId = useMemo(() => {
    if (branchesTo.some((b) => b.id === toBranchId)) return toBranchId;
    return branchesTo[0]?.id ?? "";
  }, [branchesTo, toBranchId]);

  useEffect(() => {
    if (!fromBranchId) {
      return;
    }
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) {
        setLoadingStocks(true);
      }
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
    if (!fromBranchId || !destination || !productId) {
      setError("Preencha origem, destino e produto.");
      return;
    }
    setPending(true);
    const res = await requestTransferAction({
      fromBranchId,
      toBranchId: destination,
      productId,
      quantity,
      notes,
    });
    setPending(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setNotes("");
    setQuantity(1);
    router.refresh();
  }

  if (branchesFrom.length === 0) {
    return (
      <p className="text-sm text-rose-700">
        Nenhuma unidade disponível para solicitar transferência.
      </p>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="text-sm font-medium text-[var(--foreground)]">Unidade de origem</label>
        <Select
          className="mt-2"
          value={fromBranchId}
          onChange={(e) => {
            setFromBranchId(e.target.value);
            setToBranchId("");
          }}
          disabled={branchesFrom.length === 1}
        >
          {branchesFrom.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.isWarehouse ? " (depósito)" : ""}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-[var(--foreground)]">Unidade de destino</label>
        <Select
          className="mt-2"
          value={effectiveToBranchId}
          onChange={(e) => setToBranchId(e.target.value)}
          disabled={branchesTo.length === 0}
        >
          {branchesTo.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.isWarehouse ? " (depósito)" : ""}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-[var(--foreground)]">Produto</label>
        <Select
          className="mt-2"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          disabled={loadingStocks || stocks.length === 0}
        >
          {loadingStocks ? (
            <option value="">Carregando…</option>
          ) : stocks.length === 0 ? (
            <option value="">Sem estoque na origem</option>
          ) : (
            stocks.map((s) => (
              <option key={s.productId} value={s.productId}>
                {s.name} ({s.quantity} disp.)
              </option>
            ))
          )}
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-[var(--foreground)]">Quantidade</label>
        <Input
          className="mt-2"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value) || 1)}
        />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm font-medium text-[var(--foreground)]">Observações (opcional)</label>
        <Input className="mt-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error ? <p className="md:col-span-2 text-sm text-rose-700">{error}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" className="rounded-full" disabled={pending || !productId}>
          {pending ? "Enviando…" : "Solicitar transferência"}
        </Button>
      </div>
    </form>
  );
}
