# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.11.0] — 2026-05-20

### Adicionado
- **Pagamento acima do saldo em Contas a receber**: permite receber mais que o débito do título; o excedente é gravado em `Payment.premiumAmount` (valor agregado pelo funcionário), sem crédito para o cliente.
- **Relatório de funcionários**: coluna **Valor agregado** inclui `premiumAmount` dos pagamentos de recebíveis registrados no mês.
- Migration `20260520180000_payment_premium_amount` (`premiumAmount` em `Payment`).

### Alterado
- **Baixa por cliente (FIFO)**: pagamento parcial continua rateando do vencimento mais antigo; excedente só no último título da fila; toast informa valor agregado quando houver.
- **Formulário de pagamento**: texto explicando valor acima do saldo e ausência de crédito ao cliente.

### Corrigido
- **`DatePicker` em modais**: calendário via portal em `document.body`, `z-index` acima dos modais (`1100`) e flip para cima quando falta espaço — corrige edição de datas em vendas/registros e contas a receber.

---

## [1.10.0] — 2026-05-20

### Adicionado
- **`loading.tsx` no grupo `(app)`** e **`AppShellSkeleton`**: feedback imediato na navegação; esqueleto só da área de conteúdo após casca persistente no layout.
- **`getPageMeta`** (`src/lib/page-meta.ts`): títulos e subtítulos do header derivados da URL no cliente.
- **Casca persistente** em `src/app/(app)/layout.tsx`: `AppShell` fixo entre rotas; `/unassigned` sem casca.
- **Memorização por requisição** com `cache()` do React em `auth`, `getPlatformSettings` e `getSetupSnapshot`.

### Alterado
- **Navegação**: animação de página reduzida para fade de 120ms (`--animate-page-in` → `vynce-fade-in`).
- **Sidebar e header** (`"use client"`): item ativo e título via `usePathname`; props `pathname` e `title`/`subtitle` removidas do `AppShell`.
- **Páginas `(app)`**: conteúdo sem `<AppShell>` individual; detalhes de unidade/funcionário exibem nome no corpo da página.
- **Busca condicional por aba** em vendas, recebíveis e relatórios (só consultas necessárias à aba aberta, um `Promise.all` por caso).
- **Transferências**: `Promise.all` para unidades, lista e badge; redirect para `/inventory` em `singleUnitMode` (sem aviso na URL direta).
- **Formulário de venda**: layout em duas colunas com painel **Resumo da venda** (sticky no mobile); seções Produto, Pagamento e Opções.
- **`DatePicker`**: calendário com largura fixa, posicionamento inteligente (abre para cima perto do rodapé) e `position: fixed`.
- **`getCustomersForSaleForm`**: usa `listCustomersForPicker` (só `id`, `name`, `phone`) em vez de `listCustomers` com vendas/recebíveis.
- **`AppShell`**: prop opcional `session` para evitar segundo `auth()` quando a página já resolveu a sessão.

### Corrigido
- **Botão “Acessar o sistema”** na landing: texto branco no fundo verde (`!text-white`, contornando `a { color: inherit }`).
- **Página de vendas (registros)**: serialização de `item.total` (`Decimal` → string) ao passar dados ao Client Component.
- **`ensureWalkInSaleCustomer`**: leitura com `findUnique` antes de criar (sem `upsert` em todo carregamento).

---

## [1.9.0] — 2026-05-20

### Adicionado
- **Agrupamento por cliente em Contas a receber** (aba Registrar pagamento): títulos em aberto do mesmo cliente são somados em um único saldo (ex.: R$ 40 + R$ 20 → R$ 60).
  - `groupReceivablesByCustomer` em `src/lib/receivable-groups.ts`.
  - `CustomerReceivableSearchInput`: busca por cliente com indicação de quantidade de títulos e saldo total.
- **Pagamento por cliente** (`POST /api/payments` com `customerId`): valor recebido distribuído automaticamente entre os títulos em aberto, do vencimento mais antigo ao mais recente (FIFO).

### Alterado
- **Formulário de pagamento**: seleção por **cliente** (em vez de título individual); texto de ajuda sobre baixa parcial e rateio FIFO.
- **Schema de pagamento**: `receivableId` opcional; exige `customerId` ou `receivableId` (fluxo da UI usa apenas `customerId`).

### Notas
- **Pagamento parcial**: se o valor recebido for menor que o saldo, os títulos ficam `PARTIAL` com `balanceDue` reduzido até nova baixa.
- **Vencimento**: continua editável por título na aba Registros (`ReceivableEditModal`); títulos quitados não podem ser alterados.

---

## [1.1.0] — 2026-05-12

### Adicionado
- Login com Google OAuth via NextAuth.
- Primeiro usuário registrado recebe role `owner` automaticamente.
- Demais usuários recebem role `seller`.
- Sistema multi-unidade: modelo `Branch` com suporte a depósito central.
- Vínculo seller ↔ unidade via `UserBranch`.
- Fila de espera para sellers sem unidade vinculada.
- Restrição de rotas por papel (middleware).
- Sidebar condicional por papel.
- Proteção por unidade em Server Actions e queries.
- Página de gerenciamento de funcionários (`/sellers`).
- Desativação de seller sem perda de histórico.
- Fluxo de transferência de estoque entre unidades com confirmação.
- Modelo `StockTransfer` e `CashRegisterSession` adicionados ao schema.

## [1.1.1] — 2026-05-12

### Alterado
- Refatoração da página de produtos para separar listagem de cadastro.
- Implementada paginação na listagem de produtos (20 por página).
- Cadastro de produtos movido para `/products/new`.
- Restrição de acesso à criação de produtos para usuários sem permissão de escrita.

## [1.2.0] — 2026-05-12

### Adicionado
- Componente reutilizável `ActionButton` para padronização de ações primárias e secundárias.
- Suporte a variantes `solid` e `subtle` no componente `Badge`.

### Melhorado
- Padronização de contraste: texto claro em fundos escuros e vice-versa em todo o sistema.
- Refatoração de botões em diversas páginas para utilizar componentes padronizados.

## [1.8.0] — 2026-05-20

### Adicionado
- **`ReceivableSearchInput`**: campo de recebível em Contas a receber no padrão do buscador de clientes (pesquisa ao focar, painel com scroll e altura limitada, largura total).
- **Script `scripts/reconcile-stock-from-sales.ts`** (`npm run db:reconcile-stock`): reconcilia vendas antigas que não geraram movimentação `SALE` (modo simulação por padrão; `--apply` grava as baixas). Comando `db:reconcile-stock` em `package.json`.

### Alterado
- **Vendas**: formulário em largura total com grid responsivo; ao mudar para fiado o nome do cliente permanece; data retroativa mantida após registrar várias vendas do mesmo dia; registros ordenados por `createdAt` (mais recentes primeiro).
- **Contas a receber**: formulário de pagamento em largura total; dropdown de recebível substituído pelo buscador pesquisável.
- **Dashboard**: gráfico principal passou a **Faturamento do mês** (série diária do mês corrente, alinhada ao card “Vendas do mês”).
- **Funcionários**: listagem inclui proprietário (`owner`) com badge, alinhado à aba de relatórios.
- **Unidades**: busca e vínculo aceitam vendedor e proprietário; equipe da unidade exibe ambos os perfis.
- **Configurações**: texto de “Permitir vendas sem estoque” esclarece que a opção dispensa apenas a validação de saldo, não a baixa automática.

### Corrigido
- **Estoque não baixava nas vendas** quando “Permitir vendas sem estoque” estava ativo: a opção agora só ignora a checagem de saldo insuficiente; toda venda continua gerando movimentação `SALE` e decremento na unidade.
- **Estoque (UI)**: removido card “Itens com estoque baixo”; card “Últimas movimentações” oculto em modo unidade única (`singleUnitMode`).
- **Unidades**: proprietário não aparecia na busca de vínculo nem podia ser associado à unidade única.

---

## [1.7.0] — 2026-05-20

### Adicionado
- **Vendas em abas** (`/sales?tab=`): aba **Registrar venda** (somente formulário) e aba **Registros** (tabela paginada com coluna Cliente, editar e excluir).
  - `SalesPageContent` com navegação no padrão de Estoque (`Link` + `cn()`).
  - `SaleEditModal`: edição de cliente, data da venda, vencimento (fiado) e observações; itens em somente leitura.
  - APIs `PATCH` e `DELETE` em `/api/sales/[id]`; `updateSale` e `deleteSale` no serviço (estorno de estoque na exclusão; bloqueio se fiado com pagamentos).
- **Contas a receber em abas** (`/receivables?tab=`): aba **Registrar pagamento** e aba **Registros** (tabela com cliente, paginação, editar e excluir).
  - `ReceivableEditModal` para vencimento e observações.
  - APIs `PATCH` e `DELETE` em `/api/receivables/[id]`; exclusão de título com venda vinculada remove a venda fiado correspondente.
- **Paginação padronizada (10 itens)**: `DEFAULT_PAGE_SIZE` em `src/lib/pagination.ts`, `TablePagination` (URL) e `ClientTablePagination` (estado local).
- **`CustomerSearchInput`** extraído para `src/components/sales/customer-search-input.tsx` (reutilizado no formulário e no modal de edição de venda).

### Alterado
- **Dashboard**: gráfico de faturamento da semana agrega vendas **por dia** (7 dias, zeros nos dias sem venda), alinhado ao indicador “Vendas da semana”; top clientes limitado a **3**; contas a receber limitadas a **3** títulos em aberto; card de estoque baixo removido; layout com gráfico em largura total e cards inferiores meio a meio.
- **Paginação 10 itens** em produtos (default do repositório), clientes, categorias, estoque, vendas (registros) e recebíveis (registros). Produtos passou de 20 para 10 por página.

### Corrigido
- Gráfico “Faturamento da semana” exibia um ponto por venda em vez do total diário, distorcendo a leitura do faturamento.

---

## [1.6.0] — 2026-05-20

### Adicionado
- **Exclusão de unidades com retorno de estoque**: novo botão de lixeira nos cards de `/branches` aciona um `ConfirmationModal` (variant danger). Antes da exclusão definitiva, todo o saldo de `BranchStock` da unidade é somado ao depósito central em transação atômica.
  - Service `removeBranch` valida: não permite excluir a única unidade-depósito, bloqueia exclusão quando há vendas ou transferências registradas (sugere desativar) e exige uma warehouse ativa para receber o estoque.
  - Repositório: novas funções `findAnyActiveWarehouse`, `countBranchSales`, `countBranchTransfers` e `deleteBranchWithStockMigration` (transação que soma estoque na warehouse e deleta a branch; `BranchStock` e `UserBranch` caem por cascade, `InventoryMovement.branchId` vira null pelo SetNull).
  - Server Action `deleteBranchAction` revalida `/branches`, `/inventory` e `/transfers`. Toast informa quantos produtos tiveram estoque migrado.

### Alterado
- **Cadastro de produtos sem estoque inicial**: `stockQuantity` virou opcional no `productSchema` (default 0). O `ProductForm` recebe nova prop `allowEmptyStock` e adapta label/placeholder/helper text. A validação obrigatória (> 0) só roda no client quando a opção `allowSalesWithoutStock` está desabilitada em Configurações.
- **Telefone do cliente agora é opcional**: schema Prisma alterado para `phone String?` (com `@unique` — o Postgres permite múltiplos NULLs em índices únicos). Migration `20260520140000_customer_phone_optional` aplicada. `customerSchema` valida formato (10–11 dígitos) apenas quando o campo é preenchido. `CustomerFormModal` exibe label "Telefone (opcional)" e remove a validação obrigatória do submit.

### Banco de dados
- Migration `20260520140000_customer_phone_optional`: `ALTER TABLE "Customer" ALTER COLUMN "phone" DROP NOT NULL`.

---

## [1.5.0] — 2026-05-20

### Corrigido
- **Lentidão de navegação entre páginas**: identificadas e resolvidas três causas combinadas que tornavam cada navegação ~8 queries em série antes da renderização.
  - `AppShell` agora carrega `auth()` + `getPlatformSettings()` em paralelo, e os badges (`transferBadgeCount` + `notificationCount`) também em paralelo via `Promise.all`.
  - Removido `dynamic import` de `getUnseenPendingTransfersCount` que custava extra a cada render.
- **`getNotificationCount` reescrito**: antes carregava 4 `findMany` com `include` apenas para retornar `.length`; agora usa 4 `count()` puros em paralelo, incluindo SQL raw para o filtro de estoque baixo (`stockQuantity <= lowStockThreshold`). Redução drástica de tempo e memória.
- **Cache do JWT (NextAuth)**: o callback `jwt` em `src/lib/auth.ts` recarregava role + permissions + branches do banco em **todas** as navegações. Agora o token mantém cache de 30s (`JWT_REFRESH_INTERVAL_MS`), recarregando apenas em login, em `update()` explícito da sessão ou após o intervalo. Mudanças de permissão continuam refletidas em até 30s sem necessidade de logout.

### Adicionado
- Campo `isActive` em `Customer` (default `true`) com migration `20260520120000_customer_is_active`.
- Função `softDeleteCustomer` no repositório de clientes: anonimiza nome, telefone, CPF, endereço e notas, e marca `isActive=false`.

### Alterado
- **Exclusão de clientes agora sempre funciona**: clientes sem histórico continuam sendo deletados fisicamente; clientes com vendas ou recebíveis em aberto passam por **soft delete** (anonimizados e removidos da listagem) preservando a integridade dos registros financeiros.
- `listCustomers` filtra apenas clientes ativos por padrão (parâmetro opcional `includeInactive`).
- API `DELETE /api/customers/[id]` retorna `mode: "soft" | "hard"` para que a UI exiba o toast apropriado.
- Modal de confirmação de exclusão adapta texto e label do botão conforme o cliente tenha histórico ou não.
- `CLAUDE.md` atualizado para documentar o novo comportamento de cache do JWT.

---

## [1.4.0] — 2026-05-20

### Adicionado
- **CRUD completo de clientes**: edição de dados via modal pré-preenchido, exclusão com confirmação; deleção bloqueada automaticamente quando o cliente possui histórico de compras ou recebíveis.
- API `PATCH /api/customers/[id]` e `DELETE /api/customers/[id]` com verificação de permissão `customersWrite`.
- Funções `updateCustomer` e `deleteCustomer` no serviço de clientes; `patchCustomer`, `findCustomerWithCounts` e `hardDeleteCustomer` no repositório.

### Melhorado
- `CustomerFormModal` unificado para criar e editar: aceita prop `customer?` opcional e alterna entre POST e PATCH; título e labels adaptados ao modo.
- Tabela de clientes com nova coluna "Ações" (visível apenas para `canWrite`): botão de lápis para editar e botão de lixeira para excluir (desabilitado com tooltip quando há histórico).
- Tabela de produtos: badge de status vira botão clicável para owners, alternando `ACTIVE`/`INACTIVE` via `PATCH /api/products/[id]` sem precisar abrir o modal de edição; estado atualizado localmente de forma otimista.

### Redesign
- **Página inicial** (`/`): header minimalista sem card, hero editorial centralizado com tipografia Cormorant Garamond em destaque, trecho "e recebíveis" em verde accent, CTA único com shadow colorida e feature strip horizontal no rodapé — elimina o layout de duas colunas com painel escuro anterior.
- **Página de login** (`/signin`): layout de painel único centralizado com orb de fundo verde sutil (`blur-[120px]`), wordmark "Vynce" isolado acima do card, botão Google com logotipo SVG oficial em quatro cores (branco, sem sobreposição de cor do sistema), divisor OAuth com `ShieldCheck`, nota sobre permissões — substitui o template de duas colunas genérico.
- `GoogleSignInButton` redesenhado: logo Google em SVG multicolor, fundo branco, borda sutil, `active:scale-[0.97]`.

---

## [1.3.0] — 2026-05-20

### Adicionado
- **Módulo de Clientes**: cadastro, listagem e histórico de compras com saldo em aberto.
- **Módulo de Recebíveis**: acompanhamento e baixa de títulos gerados por vendas fiado.
- **Configurações de Plataforma** (`PlatformSettings`): painel de preferências do sistema com opções persistidas no banco.
- **Modo Unidade Única** (`singleUnitMode`): oculta automaticamente transferências, multi-unidade e campos desnecessários quando o negócio opera com apenas uma filial.
- **Sincronização de estoque com vendas**: estoque é decrementado atomicamente no momento do registro da venda.
- **API de entrada de estoque** (`POST /api/inventory/inbound`): registro de entradas de mercadoria por unidade.
- **API de estoque por filial** (`GET /api/inventory/branch-stock`): consulta de saldo por produto e unidade.
- **Stock Ledger** (`src/lib/stock-ledger.ts`): camada de abstração para movimentações de estoque.
- **Setup blocks** (`src/lib/setup-blocks.ts`) e componente `SetupEmptyState`: guia de configuração inicial exibido quando o sistema ainda não está operacional.
- **Permissões de sessão** (`src/lib/session-permissions.ts`): utilitários para leitura de permissões do usuário logado sem consulta extra ao banco.
- **Sistema de animações**: keyframes e tokens Tailwind (`animate-modal-in/out`, `animate-overlay-in/out`, `animate-page-in`, `animate-fade-in`, `animate-slide-down`) definidos em `globals.css`.
- **Transições de página**: componente `PageTransitionWrapper` com fade + slide disparado a cada navegação.
- **Animações de entrada e saída de modais**: hook `useAnimatedModal` controla o ciclo de vida dos seis modais do sistema sem dependências externas de motion.
- **Press feedback nos botões**: `active:scale-[0.97]` no componente `Button`.

### Melhorado
- Campo de cliente na tela de venda substituído por combobox pesquisável: abre lista ao clicar, filtra por nome e telefone em tempo real, exibe telefone como hint e permite limpar a seleção com botão X embutido.
- Serviço de vendas refatorado com suporte a desconto, data retroativa e vínculo obrigatório de cliente em vendas fiado.
- Formulário de pagamento de recebíveis atualizado.
- Serviço de notificações expandido para cobrir estoque baixo, transferências pendentes e recebíveis vencidos.
- Serviço de busca global atualizado para indexar clientes, recebíveis e configurações de plataforma.
- Sidebar condicional por `singleUnitMode`: oculta transferências e exibe módulos de clientes/recebíveis conforme configuração da plataforma.
- `CLAUDE.md` atualizado com seção de **Animações** e regras obrigatórias de padrão visual.

### Banco de dados
- Migration `20260519120000_platform_settings_and_stock_sync`: modelo `PlatformSettings` e sincronização de estoque.
- Migration `20260519140000_single_unit_mode`: campo `singleUnitMode` em `PlatformSettings`.

---

## [1.2.1] — 2026-05-12

### Adicionado
- Modal de detalhes do produto com modos de visualização e edição.
- Coluna de "Ação" na listagem de produtos com botão de transferência.
- Função utilitária `canTransferProduct` em `src/lib/permissions.ts` para validação de transferências.
- Rota de API `PATCH /api/products/[id]` para atualização de produtos.

### Melhorado
- Listagem de produtos agora permite abrir detalhes ao clicar na linha.
- Proteção de rota aprimorada: vendedores não podem acessar a página de criação de produtos.
- Componente `ProductForm` refatorado para suportar edição e callbacks de sucesso.

## [1.0.0] — 2026-05-01

### Adicionado
- Estrutura inicial do projeto com Next.js, Prisma e PostgreSQL.
- Schema base: `User`, `Product`, `Sale`, `SaleItem`, `InventoryMovement`, `Role`, `Permission`, `UserPermission`, `Account`, `Session`.
- Configuração do NextAuth.
- Layout base com sidebar e componentes de UI.
- Configuração do Tailwind CSS 4.
