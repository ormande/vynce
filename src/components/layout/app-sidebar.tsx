import Link from "next/link";
import {
  BarChart3,
  Boxes,
  CreditCard,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Users,
} from "lucide-react";

import { SHOW_CUSTOMERS_MODULE_UI } from "@/lib/platform-config";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ...(SHOW_CUSTOMERS_MODULE_UI
    ? [{ href: "/customers" as const, label: "Clientes", icon: Users }]
    : []),
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/inventory", label: "Estoque", icon: Boxes },
  { href: "/sales", label: "Vendas", icon: Receipt },
  { href: "/receivables", label: "Recebiveis", icon: CreditCard },
  { href: "/reports", label: "Relatorios", icon: BarChart3 },
  { href: "/settings", label: "Configuracoes", icon: Settings },
];

export function AppSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="w-full max-w-xs rounded-[32px] border border-white/55 bg-[rgba(18,30,27,0.92)] p-4 text-white shadow-[0_30px_80px_rgba(16,24,40,0.22)]">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.32em] text-emerald-100/70">
          Vynce
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Comercial</h1>
        <p className="mt-2 text-sm text-emerald-50/70">
          Gestao elegante para operacao, estoque e recebiveis.
        </p>
      </div>

      <nav className="mt-6 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
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
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
