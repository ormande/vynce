import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { GoogleSignInButton } from "@/components/auth/google-signin-button";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">

      {/* Decoração de fundo — orb central sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)] opacity-[0.055] blur-[120px]"
      />

      {/* Wordmark */}
      <div className="relative z-10 mb-10 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[var(--muted-foreground)]">
          Sistema Comercial
        </p>
        <h1 className="mt-2 font-serif text-5xl font-semibold text-[var(--foreground)]">
          Vynce
        </h1>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-[28px] border border-white/70 bg-[rgba(252,250,247,0.88)] px-8 py-9 shadow-[0_32px_80px_rgba(15,23,42,0.09)] backdrop-blur-sm">

          <h2 className="font-serif text-2xl font-semibold text-[var(--foreground)]">
            Acesso ao sistema
          </h2>
          <p className="mt-2 text-sm leading-[1.75] text-[var(--muted-foreground)]">
            Entre com sua conta Google para acessar vendas,
            estoque e recebíveis — tudo em um painel só.
          </p>

          {error === "AccountDisabled" && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700">
              <span className="mt-0.5 shrink-0 text-base leading-none">⚠</span>
              <span>Sua conta foi desativada. Entre em contato com o administrador.</span>
            </div>
          )}

          <div className="mt-7">
            <GoogleSignInButton />
          </div>

          {/* Divider info */}
          <div className="mt-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>OAuth 2.0 seguro</span>
            </div>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <p className="mt-5 text-center text-xs leading-[1.7] text-[var(--muted-foreground)]">
            O primeiro usuário a entrar torna-se administrador.
            Os seguintes entram como vendedor com permissões restritas.
          </p>
        </div>

        {/* Voltar */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
          >
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </main>
  );
}
