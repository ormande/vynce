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

## [1.0.0] — 2026-05-01

### Adicionado
- Estrutura inicial do projeto com Next.js, Prisma e PostgreSQL.
- Schema base: `User`, `Product`, `Sale`, `SaleItem`, `InventoryMovement`, `Role`, `Permission`, `UserPermission`, `Account`, `Session`.
- Configuração do NextAuth.
- Layout base com sidebar e componentes de UI.
- Configuração do Tailwind CSS 4.
