"use client";

import Link from "next/link";
import { Users } from "lucide-react";

import { MonthlySalesChart } from "@/components/charts/monthly-sales-chart";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";

type CompanyReports = {
  summary: {
    today: number;
    week: number;
    month: number;
  };
  monthLabel: string;
  monthlySeries: {
    date: string;
    label: string;
    total: number;
  }[];
};

type SellerRow = {
  id: string;
  name: string;
  branchName: string;
  status: string;
  salesCount: number;
  revenue: number;
  premiumTotal: number;
  discountTotal: number;
};

export function ReportsPageContent({
  currentTab,
  company,
  sellers,
}: {
  currentTab: "empresa" | "funcionarios";
  company?: CompanyReports | null;
  sellers?: SellerRow[] | null;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex space-x-1 overflow-x-auto">
          <Link
            href="/reports?tab=empresa"
            className={cn(
              "rounded-2xl px-5 py-2.5 text-sm font-semibold transition whitespace-nowrap cursor-pointer",
              currentTab === "empresa"
                ? "bg-accent !text-accent-foreground shadow-lg shadow-[rgba(19,41,35,0.16)]"
                : "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]",
            )}
          >
            Empresa
          </Link>
          <Link
            href="/reports?tab=funcionarios"
            className={cn(
              "rounded-2xl px-5 py-2.5 text-sm font-semibold transition whitespace-nowrap cursor-pointer",
              currentTab === "funcionarios"
                ? "bg-accent !text-accent-foreground shadow-lg shadow-[rgba(19,41,35,0.16)]"
                : "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]",
            )}
          >
            Funcionários
          </Link>
        </div>
      </div>

      {currentTab === "empresa" && company ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <p className="text-sm text-[var(--muted-foreground)]">Vendas do dia</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {formatCurrency(company.summary.today)}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-[var(--muted-foreground)]">Vendas da semana</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {formatCurrency(company.summary.week)}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-[var(--muted-foreground)]">Vendas do mês</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {formatCurrency(company.summary.month)}
              </p>
            </Card>
          </div>

          <Card>
            <h3 className="text-xl font-semibold text-[var(--foreground)]">Vendas do mês</h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Faturamento diário no mês corrente.
            </p>
            <div className="mt-6">
              <MonthlySalesChart data={company.monthlySeries} monthLabel={company.monthLabel} />
            </div>
          </Card>
        </>
      ) : null}

      {currentTab === "funcionarios" && sellers ? (
        <Card>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-[var(--foreground)]">Desempenho por funcionário</h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Indicadores do mês corrente. Inclui funcionários e o dono da empresa, para registro.
              </p>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {sellers.length} funcionário(s) cadastrado(s)
            </p>
          </div>

          <Table>
            <thead>
              <tr className="text-center text-sm text-[var(--muted-foreground)]">
                <th className="px-4 py-2 text-left">Nome</th>
                <th className="px-4 py-2">Unidade</th>
                <th className="px-4 py-2">Vendas</th>
                <th className="px-4 py-2">Valor gerado</th>
                <th className="px-4 py-2">Valor agregado</th>
                <th className="px-4 py-2">Desconto aplicado</th>
                <th className="px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {sellers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-[var(--muted-foreground)]">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--panel-strong)] mb-3">
                        <Users className="h-6 w-6 opacity-40" />
                      </div>
                      <p>Nenhum funcionário cadastrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sellers.map((seller) => (
                  <tr
                    key={seller.id}
                    className="rounded-3xl bg-[var(--panel-strong)] text-center transition-colors hover:bg-white"
                  >
                    <td className="rounded-l-3xl px-4 py-4 text-left font-medium text-[var(--foreground)]">
                      {seller.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                      {seller.branchName}
                    </td>
                    <td className="px-4 py-4 font-medium text-[var(--foreground)]">
                      {seller.salesCount}
                    </td>
                    <td className="px-4 py-4 font-medium text-[var(--foreground)]">
                      {formatCurrency(seller.revenue)}
                    </td>
                    <td className="px-4 py-4 font-medium text-emerald-700">
                      {formatCurrency(seller.premiumTotal)}
                    </td>
                    <td className="px-4 py-4 font-medium text-amber-700">
                      {formatCurrency(seller.discountTotal)}
                    </td>
                    <td className="rounded-r-3xl px-4 py-4 text-right">
                      <Badge tone={seller.status === "ACTIVE" ? "success" : "neutral"}>
                        {seller.status === "ACTIVE" ? "Ativo" : "Desativado"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>
      ) : null}
    </div>
  );
}

