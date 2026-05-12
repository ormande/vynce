"use client";

import { signOut } from "next-auth/react";
import { Lock, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function UnassignedContent({ email }: { email: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-6 py-16">
      <div className="w-full max-w-md rounded-[32px] border border-[var(--border-strong)] bg-[var(--panel)] p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--panel-strong)] text-[var(--accent)]">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-[var(--foreground)]">Acesso pendente</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
          Sua conta ainda não foi vinculada a nenhuma unidade. Aguarde o administrador configurar seu acesso.
        </p>
        <p className="mt-6 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Seu e-mail
        </p>
        <p className="mt-1 break-all text-base font-semibold text-[var(--foreground)]">{email || "—"}</p>
        <Button
          type="button"
          variant="secondary"
          className="mt-8 w-full rounded-full"
          onClick={() => void signOut({ callbackUrl: "/signin" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </main>
  );
}
