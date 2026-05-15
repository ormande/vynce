import Link from "next/link";
import { ArrowRight, BarChart3, CreditCard, Package, Smartphone } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-6 py-8 lg:px-10">
      <header className="flex items-center justify-between rounded-full border border-white/60 bg-white/65 px-6 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--muted-foreground)]">
            Vynce
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Sistema Comercial</h1>
        </div>
        <Link
          href="/signin"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[rgba(255,250,244,0.98)] shadow-[0_14px_30px_rgba(35,70,58,0.18)] transition hover:bg-[var(--accent-strong)]"
          style={{ color: "rgba(255,250,244,0.98)" }}
        >
          <span style={{ color: "rgba(255,250,244,0.98)" }}>
            Entrar com Google
          </span>
          <ArrowRight
            className="h-4 w-4 text-[rgba(255,250,244,0.98)]"
            style={{ color: "rgba(255,250,244,0.98)" }}
          />
        </Link>
      </header>

      <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[40px] border border-white/60 bg-[rgba(17,30,27,0.92)] p-8 text-white shadow-[0_30px_100px_rgba(15,23,42,0.18)] lg:p-12">
          <p className="text-sm uppercase tracking-[0.28em] text-emerald-100/70">
            Gestão moderna para PMEs
          </p>
          <h2 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight lg:text-7xl">
            Vendas, estoque e recebíveis em um fluxo limpo, elegante e pronto para crescer.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/78">
            O Vynce foi estruturado para operação diária eficiente, com arquitetura de ponta a ponta organizada, autenticação com Google, PostgreSQL, Prisma e módulos preparados para evolução real.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-[rgba(255,248,242,0.98)] px-6 py-3 text-sm font-semibold text-[var(--accent-strong)] shadow-[0_14px_32px_rgba(10,16,14,0.12)] transition hover:bg-white"
              style={{ color: "var(--accent-strong)" }}
            >
              <span style={{ color: "var(--accent-strong)" }}>
                Abrir dashboard
              </span>
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-full border border-[rgba(230,238,233,0.24)] bg-[rgba(255,255,255,0.04)] px-6 py-3 text-sm font-semibold text-[rgba(255,248,242,0.98)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:bg-[rgba(255,255,255,0.08)]"
              style={{ color: "rgba(255,248,242,0.98)" }}
            >
              <span style={{ color: "rgba(255,248,242,0.98)" }}>
                Configurar acesso
              </span>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          {[
            {
              icon: Smartphone,
              title: "Operação comercial",
              copy:
                "Vendas, estoque e recebíveis em um só lugar: a base Vynce fica estável enquanto cada empresa aplica sua marca por cima.",
            },
            {
              icon: Package,
              title: "Produtos e estoque",
              copy: "Gestão de catálogo, categorias, níveis baixos e movimentações de saída por venda.",
            },
            {
              icon: CreditCard,
              title: "Fiado e recebimentos",
              copy: "Controle de vencimentos, baixa parcial e status elegantes para cobranças.",
            },
            {
              icon: BarChart3,
              title: "Dashboard e relatórios",
              copy: "Visão operacional e gerencial com indicadores essenciais para o negócio.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-[28px] border border-white/60 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--panel-strong)] text-[var(--accent)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-[var(--foreground)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
                  {item.copy}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
