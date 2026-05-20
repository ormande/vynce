"use client";

import Link from "next/link";
import { User, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Seller = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  status: "ACTIVE" | "INVITED" | "DISABLED";
  roleSlug: string;
  userBranches: {
    branch: {
      id: string;
      name: string;
    };
  }[];
};

export function SellersPageContent({ sellers }: { sellers: Seller[] }) {
  const [showDisabled, setShowDisabled] = useState(false);

  const awaitingConfig = sellers.filter(
    (s) =>
      s.status === "ACTIVE" &&
      s.userBranches.length === 0 &&
      s.roleSlug !== "owner",
  );
  const activeSellers = sellers.filter(
    (s) =>
      s.status === "ACTIVE" &&
      (s.userBranches.length > 0 || s.roleSlug === "owner"),
  );
  const disabledSellers = sellers.filter((s) => s.status === "DISABLED");

  return (
    <div className="space-y-8">
      {/* Aguardando configuração */}
      {awaitingConfig.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
            Aguardando configuração
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {awaitingConfig.map((seller) => (
              <SellerCard key={seller.id} seller={seller} />
            ))}
          </div>
        </section>
      )}

      {/* Funcionários ativos */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
          Funcionários ativos
        </h2>
        {activeSellers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeSellers.map((seller) => (
              <SellerCard key={seller.id} seller={seller} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">
            Nenhum funcionário ativo no momento.
          </p>
        )}
      </section>

      {/* Desativados */}
      {disabledSellers.length > 0 && (
        <section>
          <button
            onClick={() => setShowDisabled(!showDisabled)}
            className="flex items-center gap-2 text-lg font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
          >
            Desativados ({disabledSellers.length})
            {showDisabled ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
          {showDisabled && (
            <div className="mt-4 grid gap-4 opacity-70 grayscale md:grid-cols-2 xl:grid-cols-3">
              {disabledSellers.map((seller) => (
                <SellerCard key={seller.id} seller={seller} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function SellerCard({ seller }: { seller: Seller }) {
  const isOwner = seller.roleSlug === "owner";
  const branchName =
    seller.userBranches[0]?.branch.name ?? (isOwner ? "Administrador" : undefined);

  return (
    <Card className="group relative flex flex-col overflow-visible transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)]">
      <Link
        href={`/sellers/${seller.id}`}
        className="absolute inset-0 z-0 cursor-pointer rounded-[28px]"
        aria-label={`Abrir detalhes de ${seller.name ?? "Vendedor"}`}
      />
      <div className="relative z-10 flex flex-1 flex-col p-5 pointer-events-none">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--panel-strong)] text-[var(--accent)]">
            {seller.image ? (
              <img
                src={seller.image}
                alt={seller.name ?? ""}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-6 w-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-[var(--foreground)]">
              {seller.name ?? "Sem nome"}
            </h3>
            <p className="truncate text-sm text-[var(--muted-foreground)]">
              {seller.email}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {isOwner ? <Badge tone="neutral">Proprietário</Badge> : null}
          {branchName ? (
            <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/50 px-3 py-1 text-xs font-medium text-[var(--foreground)]">
              <Building2 className="h-3 w-3 text-[var(--accent)]" />
              {branchName}
            </div>
          ) : !isOwner ? (
            <Badge tone="warning">Sem unidade</Badge>
          ) : null}
          <Badge tone={seller.status === "ACTIVE" ? "success" : "neutral"}>
            {seller.status === "ACTIVE" ? "Ativo" : "Desativado"}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
