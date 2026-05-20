import Link from "next/link";
import { ArrowRight, BarChart3, CreditCard, Package, Smartphone } from "lucide-react";

const features = [
  {
    icon: Smartphone,
    label: "Operação diária",
    description: "Registre vendas, gerencie estoque e controle fiado em um fluxo contínuo.",
  },
  {
    icon: Package,
    label: "Catálogo e estoque",
    description: "Produtos, categorias, unidades e movimentações em tempo real.",
  },
  {
    icon: CreditCard,
    label: "Recebíveis e fiado",
    description: "Vencimentos, baixa parcial e status elegantes para cobranças.",
  },
  {
    icon: BarChart3,
    label: "Dashboard",
    description: "Indicadores essenciais para decisões rápidas e bem fundamentadas.",
  },
];

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden px-6 py-7 lg:px-12">

      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[var(--muted-foreground)]">
            Sistema Comercial
          </span>
          <span className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Vynce
          </span>
        </div>

        <Link
          href="/signin"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-white/80 px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] shadow-sm backdrop-blur transition hover:bg-white hover:shadow-md"
        >
          Entrar
          <ArrowRight className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
        </Link>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center py-24 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-[var(--muted-foreground)]">
          Gestão para pequenas e médias empresas
        </p>

        <h1 className="mt-7 max-w-4xl font-serif text-6xl font-semibold leading-[1.06] text-[var(--foreground)] lg:text-8xl">
          Vendas, estoque
          <br />
          <span className="text-[var(--accent)]">e recebíveis</span>
          <br />
          em um só lugar.
        </h1>

        <p className="mt-8 max-w-lg text-base leading-[1.85] text-[var(--muted-foreground)]">
          O Vynce reúne o essencial da operação comercial em uma interface limpa,
          com autenticação segura, multi-unidades e controle completo de fiado.
        </p>

        <div className="mt-11 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/signin"
            className="inline-flex items-center gap-2.5 rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_18px_50px_rgba(49,91,77,0.28)] transition hover:bg-[var(--accent-strong)] hover:shadow-[0_22px_60px_rgba(49,91,77,0.34)] active:scale-[0.97]"
          >
            Acessar o sistema
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[var(--muted-foreground)] underline-offset-4 transition hover:text-[var(--foreground)] hover:underline"
          >
            Ir direto ao painel
          </Link>
        </div>
      </section>

      {/* Feature strip */}
      <footer className="border-t border-[var(--border)] pt-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="flex items-start gap-3.5">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm ring-1 ring-[var(--border-strong)] text-[var(--accent)]">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{f.label}</p>
                  <p className="mt-1 text-xs leading-[1.7] text-[var(--muted-foreground)]">
                    {f.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </footer>
    </main>
  );
}
