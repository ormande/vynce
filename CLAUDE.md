# Vynce — Guia para Agentes de IA

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma 6, NextAuth v4, PostgreSQL (Railway).

## Padrões de UI obrigatórios

### Modais / Overlays

- **Proibição de Diálogos Nativos**: Nunca usar `window.confirm`, `window.alert` ou `window.prompt`. Sempre usar modais personalizados seguindo o padrão do app.
- **Renderização via Portal**: Todo modal deve ser renderizado via `createPortal(…, document.body)`. Isso é obrigatório porque o `<main>` do AppShell usa `backdrop-blur`, que cria um stacking context e faz com que `position: fixed` seja relativo ao bloco da página em vez da viewport. Sem o portal, o modal fica centralizado apenas na área de conteúdo, ignorando a sidebar.

**Estrutura canônica:**

```tsx
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";

export function MeuModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-[28px] border border-white/20 bg-[var(--panel-strong)] shadow-[0_40px_100px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold text-[var(--foreground)]">Título</h3>
            <p className="text-sm text-[var(--muted-foreground)]">Subtítulo opcional.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-[var(--muted-foreground)] hover:bg-[var(--panel)] transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* conteúdo */}
        <div className="overflow-y-auto px-6 py-6">
          {/* ... */}
        </div>
      </div>
    </div>,
    document.body
  );
}
```

**Regras rígidas:**
- Sempre usar `createPortal` — nunca renderizar o modal dentro da árvore de componentes sem portal.
- Z-index do overlay: `z-[1000]` (nunca `z-50` ou menor).
- Backdrop: `bg-black/65 backdrop-blur-md` (sem variações de cor).
- Caixa do modal: `rounded-[28px] border border-white/20 bg-[var(--panel-strong)] shadow-[0_40px_100px_rgba(0,0,0,0.35)]`.
- Bloquear scroll do body com `document.body.style.overflow`.
- Fechar ao clicar no backdrop via `<div className="absolute inset-0" onClick={onClose} />`.
- **Animações obrigatórias**: usar `useAnimatedModal(isOpen)` de `@/lib/use-animated-modal` para enter/exit. Substituir `if (!isOpen || !mounted)` por `if (!shouldRender || !mounted)`. Aplicar classes dinâmicas no overlay e na caixa (ver seção Animações).

---

### Abas de navegação (Tab Navigation)

Usar sempre o padrão da página de Estoque (`/inventory`). Nunca usar pill-container (`rounded-full border p-1`) nem botões com borda individual.

**Estrutura canônica:**

```tsx
import { cn } from "@/lib/utils";

<div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-6">
  <div className="flex space-x-1 overflow-x-auto">
    <Link
      href="/pagina?filtro=valor"
      className={cn(
        "rounded-2xl px-5 py-2.5 text-sm font-semibold transition whitespace-nowrap",
        isActive
          ? "bg-accent !text-accent-foreground shadow-lg shadow-[rgba(19,41,35,0.16)]"
          : "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
      )}
    >
      Rótulo da aba
    </Link>
  </div>
  {/* botão de ação opcional, alinhado à direita */}
</div>
```

**Regras rígidas:**
- Container: `flex items-center justify-between border-b border-[var(--border)] pb-3 mb-6`.
- Tabs: `flex space-x-1 overflow-x-auto` (sem gap, sem border, sem background no container).
- Aba ativa: `bg-accent !text-accent-foreground shadow-lg shadow-[rgba(19,41,35,0.16)]`.
- Aba inativa: `bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]`.
- Padding individual: `rounded-2xl px-5 py-2.5 text-sm font-semibold`.
- Se houver botão de ação (ex: "Nova Transferência"), colocá-lo à direita do mesmo `flex` container, alinhado com `items-center`.
- Sempre usar `cn()` de `@/lib/utils` para classes condicionais — nunca template literal com ternário.

---

### Listas suspensas (Select / Dropdown)

Nunca usar o `<select>` nativo do navegador nem o wrapper `Select` de `@/components/ui/select`. Sempre usar `DropdownSelect` de `@/components/ui/dropdown-select`.

**Importação:**

```tsx
import { DropdownSelect } from "@/components/ui/dropdown-select";
```

**Uso:**

```tsx
<DropdownSelect
  value={value}
  onChange={(value) => setValue(value)}          // recebe string, não evento
  options={[{ value: "id", label: "Rótulo" }]}  // sempre DropdownOption[]
  placeholder="Selecione uma opção"
  disabled={false}
  invalid={false}                                 // true para estado de erro
  className="mt-2"
/>
```

**Regras rígidas:**
- `onChange` recebe `string` diretamente — nunca usar `e.target.value`.
- `options` deve ser sempre `{ value: string; label: string }[]` — nunca passar `<option>` como children.
- Para estados de carregamento ou lista vazia, usar `disabled={true}` e passar o texto explicativo em `placeholder` (ex: `"Carregando…"`, `"Nenhuma opção disponível"`).
- Ao usar `DropdownSelect` dentro de um modal, o container externo do modal **não pode ter `overflow-hidden`**, pois isso corta o dropdown que é `position: absolute`. Manter `overflow-hidden` apenas no container de conteúdo scrollável interno, se necessário.

---

### Campos de data (DatePicker)

Nunca usar `<input type="date">` nativo do navegador. Sempre usar `DatePicker` de `@/components/ui/date-picker`.

**Importação:**

```tsx
import { DatePicker } from "@/components/ui/date-picker";
```

**Uso:**

```tsx
<DatePicker
  value={soldAt}                        // string ISO: "yyyy-MM-dd"
  onChange={setSoldAt}                  // recebe string, não evento
  placeholder="Selecione uma data"
  invalid={false}
  disabled={false}
  clearable={false}                     // true para campos opcionais (ex.: vencimento)
  min="2026-01-01"                      // opcional
  max="2026-12-31"                      // opcional
  className="mt-2"
/>
```

**Regras rígidas:**
- `value` e `onChange` usam sempre o formato `yyyy-MM-dd` (compatível com APIs e banco).
- `onChange` recebe `string` diretamente — nunca usar `e.target.value`.
- Para datas opcionais, usar `clearable={true}` e permitir `value=""`.
- O popover do calendário segue o mesmo padrão visual do `DropdownSelect` (bordas arredondadas, backdrop, z-index local `z-30`).
- Dentro de modais, o container externo **não pode ter `overflow-hidden`** (mesma regra do `DropdownSelect`).

---

### Campos Numéricos

Nunca usar `<input type="number">` com valor inicial fixo (ex.: `1`) nem spinners visíveis.

Sempre que adicionar um campo numérico (ex: quantidade, preço):
- Nunca travar com um número obrigatório inicial (ex: não deixar `1` fixo).
- Usar `placeholder="0"` ou outro valor apropriado.
- Permitir que o campo fique vazio inicialmente.
- Remover as setas (spinners) de aumentar/diminuir número via CSS/Tailwind.
- Para valores monetários, preferir `CurrencyInput` de `@/components/ui/currency-input` em vez de `type="number"`.

**Exemplo de Input:**

```tsx
<Input
  type="number"
  placeholder="0"
  value={value || ""}
  onChange={(e) => setValue(e.target.value)}
  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
/>
```

---

### Animações

O sistema usa um conjunto de keyframes e tokens Tailwind definidos em `globals.css`. Toda implementação de itens visuais deve seguir o padrão abaixo — nunca criar `@keyframes` avulsos ou classes de animação fora deste sistema.

**Tokens disponíveis (classes Tailwind):**

| Classe | Uso |
|--------|-----|
| `animate-modal-in` | Entrada da caixa do modal (scale + fadeUp, spring 300ms) |
| `animate-modal-out` | Saída da caixa do modal (scale + fadeDown, 180ms) |
| `animate-overlay-in` | Fade-in do backdrop do modal (220ms) |
| `animate-overlay-out` | Fade-out do backdrop do modal (180ms) |
| `animate-page-in` | Entrada de conteúdo de página (slideUp + fade, spring 340ms) |
| `animate-fade-in` | Fade-in genérico para elementos que surgem na tela (220ms) |
| `animate-slide-down` | Entrada de painéis/dropdowns suspensos (slideDown + fade, 200ms) |

**Regras por tipo de elemento:**

- **Modais**: usar `useAnimatedModal` + classes dinâmicas. O overlay recebe `isClosing ? "animate-overlay-out" : "animate-overlay-in"` e a caixa recebe `isClosing ? "animate-modal-out" : "animate-modal-in"`.
- **Painéis suspensos** (dropdowns, popovers, comboboxes): usar `animate-slide-down` na entrada. Sem animação de saída necessária (desaparece por unmount imediato).
- **Transições de página**: já gerenciadas automaticamente pelo `PageTransitionWrapper` em `app-shell.tsx`. Não adicionar `animate-page-in` manualmente nas pages.
- **Botões**: `active:scale-[0.97]` já embutido no componente `Button`. Não duplicar.
- **Cards e itens de lista** que surgem dinamicamente: usar `animate-fade-in`.

**Padrão modal com animação:**

```tsx
import { useAnimatedModal } from "@/lib/use-animated-modal";

const { shouldRender, isClosing } = useAnimatedModal(isOpen);
if (!shouldRender || !mounted) return null;

return createPortal(
  <div className={`fixed inset-0 z-[1000] ... ${isClosing ? "animate-overlay-out" : "animate-overlay-in"}`}>
    <div className="absolute inset-0" onClick={onClose} />
    <div className={`relative ... ${isClosing ? "animate-modal-out" : "animate-modal-in"}`}>
      {/* conteúdo */}
    </div>
  </div>,
  document.body,
);
```

---

### Toasts e Feedback de Operações

Sempre que envolver alguma alteração que envolva operação dentro do sistema (ex: salvar, deletar, confirmar, cancelar):
- Mostrar um toast de sucesso ou erro usando a biblioteca `sonner`.
- O toast deve ser informativo e condizente com o design do sistema.

**Exemplo de uso:**

```tsx
import { toast } from "sonner";

// Sucesso
toast.success("Produto salvo com sucesso!");

// Erro
toast.error("Erro ao salvar produto", {
  description: res.message
});
```

---

### Busca global (header)

- Componente: `GlobalSearch` em `src/components/layout/global-search.tsx`.
- API: `GET /api/search?q=` → grupos com `category`, `items[]` (`title`, `snippet`, `href`).
- Escopo (dono): Produtos, Categorias, Unidades, Funcionários, Usuários e acessos, Vendas, Transferências; Clientes/Recebíveis se os módulos estiverem ativos em `platform-config`.
- Vendedor: produtos, unidades vinculadas, vendas e transferências da própria filial.
- Painel suspenso abaixo do campo (não modal); usar `PanelScrollList` quando houver mais de ~5 itens (`max-h-[min(320px,50vh)]` + scroll).
- Cada grupo exibe **título da seção** (ex.: Produtos, Vendas) e, em cada item, **título** + **snippet** com o trecho/campo onde o termo foi encontrado (`buildMatchSnippet` em `src/lib/search-utils.ts`).
- Mínimo 2 caracteres; debounce ~300ms.

### Central de notificações (header)

- Componente: `NotificationCenter` em `src/components/layout/notification-center.tsx`.
- API: `GET /api/notifications` → lista com `category`, `title`, `snippet`, `href`, `createdAt`.
- Abrir via **modal com portal** (`z-[1000]`, backdrop padrão); conteúdo com `PanelScrollList` se passar de ~5 itens.
- Mesma hierarquia visual da busca: categoria → itens com título + snippet.
- Badge no sino com contagem; dados agregados em `src/modules/notifications/service.ts` (transferências pendentes, estoque baixo, etc.).

---

### Tabelas

Referência canônica: listagens em `src/components/products/products-page-content.tsx` e `src/app/(app)/customers/page.tsx`.

Sempre que criar ou editar uma tabela de listagem:
- Envolver em `<Card className="mt-6">` (sem `p-4` extra no card da tabela).
- Usar `<Table>` de `@/components/ui/table` (já aplica `border-separate border-spacing-y-2`).
- O conteúdo das colunas e os respectivos títulos (headers) devem estar alinhados ao centro (`text-center`), a menos que haja uma razão muito específica para outro alinhamento (ex: primeira coluna identificadora com `text-left`, ou última coluna de ações com `text-right`).
- **Cada linha (`<tr>`) do corpo** deve ter sombreamento e hover iguais ao restante do sistema — nunca apenas `bg-[var(--panel-strong)]` sem sombra.

**Estrutura canônica:**

```tsx
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { cn } from "@/lib/utils";

<Card className="mt-6">
  <Table>
    <thead>
      <tr className="text-center text-sm text-[var(--muted-foreground)]">
        <th className="px-4 py-2 text-center">Coluna</th>
        <th className="px-4 py-2 text-right">Ações</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr
          key={item.id}
          className="rounded-3xl bg-[var(--panel-strong)] text-center transition-colors hover:bg-white shadow-sm hover:shadow-md"
        >
          <td className="rounded-l-3xl px-4 py-4 text-center font-medium text-[var(--foreground)]">
            {item.name}
          </td>
          <td className="rounded-r-3xl px-4 py-4 text-right">{/* ações */}</td>
        </tr>
      ))}
    </tbody>
  </Table>
</Card>
```

**Regras rígidas (linhas do `<tbody>`):**
- Classes obrigatórias no `<tr>`: `rounded-3xl bg-[var(--panel-strong)] transition-colors hover:bg-white shadow-sm hover:shadow-md` (acrescentar `text-center` quando todas as células forem centralizadas).
- Primeira célula: `rounded-l-3xl px-4 py-4`.
- Última célula: `rounded-r-3xl px-4 py-4` (usar `cn()` na penúltima coluna se a última for opcional, ex.: coluna de ações condicional).
- Não usar `rounded-2xl` nem omitir `shadow-sm hover:shadow-md` — isso quebra a consistência visual com produtos, clientes, estoque e transferências.

---

## Variáveis CSS disponíveis

```
--background       #eef1ea
--foreground       #17211d
--panel            rgba(255,255,255,0.76)
--panel-strong     #eff3ee
--border           rgba(74,98,87,0.12)
--border-strong    rgba(54,73,65,0.18)
--accent           #315b4d
--accent-strong    #23463a
--accent-foreground #fff8f2
--muted-foreground #607168
--ring             #315b4d
```

## Layout do AppShell

```
<div>                          ← flex row, full height
  <aside> sidebar </aside>     ← sticky, lg:h-[calc(100vh-2rem)]
  <main>                       ← rounded-[36px], backdrop-blur ← CRIA STACKING CONTEXT
    {children}
  </main>
</div>
```

O `backdrop-blur` no `<main>` é a razão pela qual modais precisam de `createPortal`. Qualquer `position: fixed` dentro de `<main>` será posicionado relativo a ele, não à viewport.

## Seed do banco

Rodar com `npx tsx prisma/seed.ts` (não `npx prisma db seed` — o campo `prisma.seed` já foi adicionado ao `package.json`, mas verificar antes de usar).

## Permissões

O JWT armazena permissões/branches em cache curto. O callback `jwt` em `src/lib/auth.ts` recarrega do banco em três situações: (1) login, (2) trigger explícito `update`, e (3) a cada `JWT_REFRESH_INTERVAL_MS` (30 segundos por padrão). Após alterar permissões no banco, basta aguardar até 30s ou disparar um `update()` da sessão — não é necessário fazer logout.
