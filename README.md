# Vynce

Sistema web fullstack para gestao comercial de pequenos e medios negocios, com foco em clientes, produtos, estoque, vendas a vista e fiado, recebimentos, dashboard e relatorios.

## Stack

- Next.js 16 + App Router
- TypeScript
- PostgreSQL
- Prisma ORM
- NextAuth com Google
- Tailwind CSS 4
- Zod + React Hook Form
- Vitest

## Principais funcionalidades da base

- Login com Google e persistencia do usuario no banco
- Papeis `owner` e `employee`, com estrutura pronta para permissoes
- Dashboard com metricas de vendas, pendencias, clientes e estoque
- Cadastro de clientes com saldo devedor e historico derivados
- Cadastro de produtos com categorias, precos, status e estoque
- Fluxo inicial de venda com atualizacao automatica de estoque
- Contas a receber com vencimento, baixa parcial/total e status visual
- Relatorios iniciais para visao gerencial
- API integrada ao projeto com separacao por modulos

## Arquitetura

Estrutura principal:

```text
prisma/
  schema.prisma
  seed.ts
  migrations/
src/
  app/
    (auth)/
    (app)/
    api/
  components/
    auth/
    charts/
    forms/
    layout/
    ui/
  lib/
  modules/
    auth/
    customers/
    dashboard/
    inventory/
    payments/
    products/
    sales/
    users/
  tests/
```

Padrao adotado:

- `app/`: rotas, paginas e route handlers
- `components/`: UI reutilizavel, layout, formularios e graficos
- `modules/`: regras de negocio, schemas Zod, repositorios e servicos por dominio
- `lib/`: autenticacao, banco, permissoes, utilitarios e tratamento de erro
- `prisma/`: modelagem, seed e migration inicial

## Modelagem coberta

Entidades principais:

- `User`
- `Role`
- `Permission`
- `RolePermission`
- `UserPermission`
- `Customer`
- `Category`
- `Product`
- `InventoryMovement`
- `Sale`
- `SaleItem`
- `Receivable`
- `Payment`
- tabelas do NextAuth: `Account`, `Session`, `VerificationToken`

## Variaveis de ambiente

Copie `.env.example` para `.env` e ajuste:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vynce?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me-with-a-long-random-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Como rodar localmente

1. Instale as dependencias:

```bash
npm install
```

2. Garanta que o PostgreSQL esteja ativo e que o banco `vynce` exista.

3. Gere/aplique a estrutura do banco:

```bash
npm run prisma:migrate
```

4. Popule o banco com dados iniciais:

```bash
npm run db:seed
```

5. Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

6. Acesse:

```text
http://localhost:3000
```

## Scripts uteis

- `npm run dev`: desenvolvimento
- `npm run build`: build de producao
- `npm run start`: executar build
- `npm run lint`: lint
- `npm run typecheck`: validacao TypeScript
- `npm test`: testes
- `npm run prisma:generate`: gerar client Prisma
- `npm run prisma:migrate`: rodar migrations em desenvolvimento
- `npm run db:seed`: popular dados iniciais

## Seed inicial

O seed cria:

- permissoes base
- papeis `owner` e `employee`
- categorias iniciais
- produtos de exemplo
- clientes de exemplo
- vendas e recebiveis de exemplo

Regra inicial de acesso:

- o primeiro usuario autenticado via Google vira `Owner/Admin`
- usuarios seguintes entram como `Funcionario`

## Status atual da base

Entregue nesta versao:

- base fullstack organizada
- autenticacao com Google configurada
- modelagem relacional consistente
- paginas iniciais do produto
- CRUD inicial para clientes e produtos
- fluxo inicial de vendas e pagamentos
- dashboard e relatorios
- migration inicial
- seed
- testes e lint configurados

## Proximos passos recomendados

- adicionar edicao e exclusao completas nas entidades
- refinar gestao de permissoes por tela e acao
- incluir paginacao e filtros avancados
- expandir auditoria de estoque
- adicionar exportacao de relatorios
- cobrir regras de negocio com mais testes
