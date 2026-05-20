"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";

export function PlatformPreferences({
  initialAllowSalesWithoutStock,
  initialSingleUnitMode,
}: {
  initialAllowSalesWithoutStock: boolean;
  initialSingleUnitMode: boolean;
}) {
  const router = useRouter();
  const [allowSalesWithoutStock, setAllowSalesWithoutStock] = useState(
    initialAllowSalesWithoutStock,
  );
  const [singleUnitMode, setSingleUnitMode] = useState(initialSingleUnitMode);
  const [saving, setSaving] = useState(false);

  async function persistSettings(next: {
    allowSalesWithoutStock: boolean;
    singleUnitMode: boolean;
  }) {
    setSaving(true);
    try {
      const response = await fetch("/api/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error("Erro ao salvar preferência", { description: data.message });
        return false;
      }

      router.refresh();
      return true;
    } catch {
      toast.error("Não foi possível salvar a preferência.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSalesWithoutStockToggle(checked: boolean) {
    const prev = allowSalesWithoutStock;
    setAllowSalesWithoutStock(checked);
    const ok = await persistSettings({
      allowSalesWithoutStock: checked,
      singleUnitMode,
    });
    if (!ok) setAllowSalesWithoutStock(prev);
    else {
      toast.success(
        checked
          ? "Vendas sem estoque habilitadas."
          : "Vendas exigem estoque na unidade novamente.",
      );
    }
  }

  async function handleSingleUnitToggle(checked: boolean) {
    const prev = singleUnitMode;
    setSingleUnitMode(checked);
    const ok = await persistSettings({
      allowSalesWithoutStock,
      singleUnitMode: checked,
    });
    if (!ok) setSingleUnitMode(prev);
    else {
      toast.success(
        checked
          ? "Modo unidade única ativado. Transferências foram ocultadas."
          : "Modo multiunidade restaurado.",
      );
    }
  }

  return (
    <Card>
      <h3 className="text-xl font-semibold text-[var(--foreground)]">
        Preferências operacionais
      </h3>
      <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
        Controle regras de estoque, vendas e operação em uma ou várias unidades.
      </p>

      <div className="mt-6 space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-4">
          <input
            type="checkbox"
            id="singleUnitMode"
            className="mt-0.5 h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent)]"
            checked={singleUnitMode}
            disabled={saving}
            onChange={(e) => handleSingleUnitToggle(e.target.checked)}
          />
          <label htmlFor="singleUnitMode" className="text-sm text-[var(--foreground)]">
            <span className="font-medium">Unidade única</span>
            <span className="mt-1 block text-[var(--muted-foreground)]">
              Para negócios com um só ponto de venda. Oculta Transferências no menu e desativa
              fluxos de movimentação entre filiais.
            </span>
          </label>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-4">
          <input
            type="checkbox"
            id="allowSalesWithoutStock"
            className="mt-0.5 h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent)]"
            checked={allowSalesWithoutStock}
            disabled={saving}
            onChange={(e) => handleSalesWithoutStockToggle(e.target.checked)}
          />
          <label htmlFor="allowSalesWithoutStock" className="text-sm text-[var(--foreground)]">
            <span className="font-medium">Permitir vendas sem estoque</span>
            <span className="mt-1 block text-[var(--muted-foreground)]">
              Quando ativo, permite vender mesmo sem saldo na unidade (o estoque ainda é baixado após
              a venda). Desativado, bloqueia a venda se não houver quantidade suficiente.
            </span>
          </label>
        </div>
      </div>
    </Card>
  );
}
