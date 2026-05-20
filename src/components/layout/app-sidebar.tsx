"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  Building2,
  CreditCard,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Users,
} from "lucide-react";

import { SidebarSignOut } from "@/components/layout/sidebar-sign-out";
import {
  SHOW_CUSTOMERS_MODULE_UI,
  SHOW_RECEIVABLES_MODULE_UI,
} from "@/lib/platform-config";
import { cn } from "@/lib/utils";

function buildOwnerNavItems(singleUnitMode: boolean) {
  return [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(SHOW_CUSTOMERS_MODULE_UI
      ? [{ href: "/customers" as const, label: "Clientes", icon: Users }]
      : []),
    { href: "/products", label: "Produtos", icon: Package },
    { href: "/branches", label: "Unidades", icon: Building2 },
    { href: "/sellers", label: "Funcionários", icon: Users },
    { href: "/inventory", label: "Estoque", icon: Boxes },
    ...(!singleUnitMode
      ? [{ href: "/transfers" as const, label: "Transferências", icon: ArrowLeftRight }]
      : []),
    { href: "/sales", label: "Vendas", icon: Receipt },
    ...(SHOW_RECEIVABLES_MODULE_UI
      ? [{ href: "/receivables" as const, label: "Contas a receber", icon: CreditCard }]
      : []),
    { href: "/reports", label: "Relatórios", icon: BarChart3 },
    { href: "/settings", label: "Configurações", icon: Settings },
  ];
}

function buildSellerNavItems(singleUnitMode: boolean) {
  return [
    { href: "/sales", label: "Vendas", icon: Receipt },
    { href: "/inventory", label: "Estoque", icon: Boxes },
    ...(!singleUnitMode
      ? [{ href: "/transfers" as const, label: "Transferências", icon: ArrowLeftRight }]
      : []),
  ];
}

export function AppSidebar({
  roleSlug,
  transferBadgeCount = 0,
  singleUnitMode = false,
}: {
  roleSlug?: string | null;
  transferBadgeCount?: number;
  singleUnitMode?: boolean;
}) {
  const path = usePathname();
  const items =
    roleSlug === "seller"
      ? buildSellerNavItems(singleUnitMode)
      : buildOwnerNavItems(singleUnitMode);

  return (
    <aside className="w-full max-w-xs rounded-[32px] border border-white/55 bg-[rgba(18,30,27,0.92)] p-4 text-white shadow-[0_30px_80px_rgba(16,24,40,0.22)]">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.32em] text-emerald-100/70">
          Vynce
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Comercial</h1>
        <p className="mt-2 text-sm text-emerald-50/70">
          Gestão elegante para operação, estoque e recebíveis.
        </p>
      </div>

      <nav className="mt-6 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = path === item.href || path.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition cursor-pointer",
                active ? "bg-white shadow-lg" : "hover:bg-white/8",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active
                    ? "text-slate-900"
                    : "text-emerald-50/75 group-hover:text-white",
                )}
              />
              <span
                className={cn(
                  "font-medium transition-colors",
                  active
                    ? "text-slate-900"
                    : "text-emerald-50/75 group-hover:text-white",
                )}
              >
                {item.label}
              </span>
              {item.href === "/transfers" && transferBadgeCount > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                  {transferBadgeCount}
                </span>
              )}
            </Link>
          );
        })}
        <div className="mt-2 border-t border-white/10 pt-2">
          <SidebarSignOut />
        </div>
      </nav>
    </aside>
  );
}
