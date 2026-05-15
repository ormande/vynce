import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { Card } from "@/components/ui/card";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[36px] border border-white/60 bg-[rgba(17,30,27,0.92)] p-10 text-white shadow-[0_30px_100px_rgba(15,23,42,0.18)]">
          <p className="text-xs uppercase tracking-[0.32em] text-emerald-100/70">
            Acesso seguro
          </p>
          <h1 className="mt-5 text-5xl font-semibold">Entre no Vynce</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-emerald-50/80">
            Autenticação com Google integrada ao banco de dados, com perfil
            persistido, função do usuário e base pronta para futuras políticas
            de permissão.
          </p>
          <div className="mt-8 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/6 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-sm text-emerald-50/80">
              O primeiro usuário autenticado passa a ser proprietário/administrador
              por padrão. Os próximos entram como vendedor, com permissões restritas.
            </p>
          </div>
        </div>

        <Card className="flex flex-col justify-center p-8 lg:p-10">
          <h2 className="text-3xl font-semibold text-[var(--foreground)]">
            Acesso ao sistema
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
            Entre com sua conta Google para acessar o painel: vendas, produtos,
            estoque e contas a receber ficam reunidos em um fluxo só, com
            permissões por perfil.
          </p>
          {error === "AccountDisabled" && (
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">
              Sua conta foi desativada. Entre em contato com o administrador.
            </div>
          )}
          <div className="mt-8">
            <GoogleSignInButton />
          </div>
          <Link
            href="/"
            className="mt-5 inline-flex w-fit rounded-full border border-[var(--border-strong)] bg-[rgba(255,248,242,0.96)] px-5 py-3 text-sm font-semibold text-[var(--accent-strong)] shadow-[0_14px_32px_rgba(15,23,42,0.08)] transition hover:bg-white"
          >
            Voltar para a página inicial
          </Link>
        </Card>
      </div>
    </main>
  );
}
