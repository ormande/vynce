"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { cn } from "@/lib/utils";

export function SidebarSignOut() {
  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: "/signin" })}
      className={cn(
        "group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition",
        "hover:bg-white/8",
      )}
    >
      <LogOut className="h-4 w-4 shrink-0 text-emerald-50/75 transition-colors group-hover:text-white" />
      <span className="font-medium text-emerald-50/75 transition-colors group-hover:text-white">Sair</span>
    </button>
  );
}
