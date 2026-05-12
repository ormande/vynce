"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Building2, Calendar, Mail, Shield, Power, PowerOff, XCircle, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  disableSellerAction,
  reactivateSellerAction,
  updateSellerBranchAction,
  removeSellerBranchAction,
} from "@/modules/sellers/actions";

type Seller = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  status: "ACTIVE" | "INVITED" | "DISABLED";
  createdAt: Date;
  userBranches: {
    branch: {
      id: string;
      name: string;
    };
  }[];
  _count: {
    sales: number;
  };
};

type Branch = {
  id: string;
  name: string;
};

export function SellerDetailsContent({
  seller,
  branches,
}: {
  seller: Seller;
  branches: Branch[];
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentBranch = seller.userBranches[0]?.branch;

  async function handleDisable() {
    if (!window.confirm("Tem certeza que deseja desativar este funcionário? Ele perderá o acesso ao sistema imediatamente.")) {
      return;
    }
    setIsPending(true);
    setError(null);
    const res = await disableSellerAction(seller.id);
    setIsPending(false);
    if (!res.ok) setError(res.message);
    else router.refresh();
  }

  async function handleReactivate() {
    setIsPending(true);
    setError(null);
    const res = await reactivateSellerAction(seller.id);
    setIsPending(false);
    if (!res.ok) setError(res.message);
    else router.refresh();
  }

  async function handleUpdateBranch(branchId: string) {
    setIsPending(true);
    setError(null);
    const res = await updateSellerBranchAction(seller.id, branchId);
    setIsPending(false);
    if (!res.ok) setError(res.message);
    else router.refresh();
  }

  async function handleRemoveBranch() {
    if (!window.confirm("Remover o vínculo deste funcionário com a unidade atual?")) {
      return;
    }
    setIsPending(true);
    setError(null);
    const res = await removeSellerBranchAction(seller.id);
    setIsPending(false);
    if (!res.ok) setError(res.message);
    else router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/sellers")}
          className="rounded-full px-4 text-[var(--muted-foreground)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a lista
        </Button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Perfil */}
        <Card className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[32px] bg-[var(--panel-strong)] text-[var(--accent)]">
              {seller.image ? (
                <img
                  src={seller.image}
                  alt={seller.name ?? ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10" />
              )}
            </div>
            <h3 className="mt-4 text-xl font-semibold text-[var(--foreground)]">
              {seller.name ?? "Sem nome"}
            </h3>
            <Badge
              tone={seller.status === "ACTIVE" ? "success" : "neutral"}
              className="mt-2"
            >
              {seller.status === "ACTIVE" ? "Ativo" : "Desativado"}
            </Badge>

            <div className="mt-8 w-full space-y-4 text-left">
              <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                <Mail className="h-4 w-4" />
                <span className="truncate">{seller.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                <Calendar className="h-4 w-4" />
                <span>
                  Cadastrado em{" "}
                  {format(seller.createdAt, "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                <Shield className="h-4 w-4" />
                <span>Vendedor ({seller._count.sales} vendas)</span>
              </div>
            </div>

            <div className="mt-8 w-full pt-6 border-t border-[var(--border)]">
              {seller.status === "ACTIVE" ? (
                <Button
                  variant="outline"
                  className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
                  onClick={handleDisable}
                  disabled={isPending}
                >
                  <PowerOff className="mr-2 h-4 w-4" />
                  Desativar funcionário
                </Button>
              ) : (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleReactivate}
                  disabled={isPending}
                >
                  <Power className="mr-2 h-4 w-4" />
                  Reativar funcionário
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Unidade Vinculada */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            Unidade vinculada
          </h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            O vendedor só pode visualizar e realizar vendas na unidade à qual está vinculado.
          </p>

          <div className="mt-6">
            {currentBranch ? (
              <div className="flex items-center justify-between rounded-2xl border border-[var(--border-strong)] bg-[var(--panel-strong)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[var(--accent)] shadow-sm">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      {currentBranch.name}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Unidade atual
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-700 hover:bg-rose-50"
                  onClick={handleRemoveBranch}
                  disabled={isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Desvincular
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-8 text-center">
                <Building2 className="mx-auto h-8 w-8 text-[var(--muted-foreground)] opacity-50" />
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Nenhuma unidade vinculada.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8">
            <h4 className="text-sm font-semibold text-[var(--foreground)]">
              {currentBranch ? "Alterar unidade" : "Vincular a uma unidade"}
            </h4>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {branches
                .filter((b) => b.id !== currentBranch?.id)
                .map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => handleUpdateBranch(branch.id)}
                    disabled={isPending}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 text-left transition hover:bg-[var(--panel-strong)] disabled:opacity-50"
                  >
                    <Building2 className="h-4 w-4 text-[var(--muted-foreground)]" />
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {branch.name}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
