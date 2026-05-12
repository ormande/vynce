# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
