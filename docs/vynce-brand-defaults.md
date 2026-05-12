# Vynce — paleta e tokens visuais padrão (base da plataforma)

Este arquivo registra a identidade visual **padrão do produto** (demos, reuniões, template antes do white-label).  
Para uma empresa cliente, substitua principalmente as variáveis em `src/app/globals.css` e textos de marca (ex.: sidebar “Vynce”, metadados em `src/app/layout.tsx`).

## Fontes

| Uso        | Família              | Origem                          |
|-----------|----------------------|----------------------------------|
| Corpo/UI | Manrope              | `next/font` em `layout.tsx`     |
| Títulos  | Cormorant Garamond   | `next/font` em `layout.tsx`     |

Tokens CSS: `--font-manrope`, `--font-cormorant` (via classes no `<html>`).

## Cores principais (`:root` em `src/app/globals.css`)

| Token                 | Valor     | Uso típico                          |
|----------------------|-----------|-------------------------------------|
| `--background`     | `#eef1ea` | Fundo base da aplicação            |
| `--foreground`       | `#17211d` | Texto principal                    |
| `--panel`          | `rgba(255, 255, 255, 0.76)` | Painéis translúcidos   |
| `--panel-strong`   | `#eff3ee` | Fundos de cartões / listas         |
| `--border`         | `rgba(74, 98, 87, 0.12)` | Bordas suaves              |
| `--border-strong`  | `rgba(54, 73, 65, 0.18)` | Bordas mais visíveis       |
| `--accent`         | `#315b4d` | Botões primários, ícones de destaque |
| `--accent-strong`  | `#23463a` | Hover / ênfase do accent           |
| `--muted-foreground` | `#607168` | Texto secundário                 |
| `--ring`           | `#315b4d` | Foco (outline)                     |

## Fundo da página (`html` em `globals.css`)

Gradiente composto por:

- Radial `rgba(92, 124, 112, 0.18)` (canto superior esquerdo)
- Radial `rgba(206, 191, 168, 0.18)` (canto superior direito)
- Linear `135deg`: `#edf1eb` → `#f7f4ef` (45%) → `#eef1ea`

## Shell escuro (sidebar e blocos hero)

Valores recorrentes no JSX (não centralizados em `:root`):

- Painel escuro: `rgba(17, 30, 27, 0.92)` — hero na home e login.
- Sidebar app: `rgba(18, 30, 27, 0.92)`.
- Texto claro sobre escuro: tons `emerald-50` / `emerald-100` (Tailwind) para labels e ícones inativos.
- Cartão ativo na sidebar: branco com texto `slate-900`.

## Texto sobre accent (botões)

- `rgba(255, 250, 244, 0.98)` — usado em CTAs sobre `--accent`.

## Onde trocar na white-label

1. `src/app/globals.css` — paleta inteira.
2. `src/components/layout/app-sidebar.tsx` — nome “Vynce”, tagline “Comercial”.
3. `src/app/layout.tsx` — `metadata.title` / `description`.
4. Páginas marketing (`src/app/page.tsx`, `src/app/(auth)/signin/page.tsx`) — copy e blocos decorativos.

Manter **este arquivo** atualizado quando a base Vynce mudar de cor, para você poder restaurar o look “oficial” após uma implantação customizada.
