# Vynce

Sistema web de ponta a ponta para gestão comercial de pequenos e médios negócios, com foco em clientes, produtos, estoque, vendas à vista e fiado, recebimentos, dashboard e relatórios.

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

- Login com Google e persistência do usuário no banco
- Papéis `owner` e `seller` (Vendedor), com estrutura pronta para permissões
- Dashboard com métricas de vendas, pendências, clientes e estoque
- Cadastro de clientes com saldo devedor e histórico derivados
- Cadastro de produtos com categorias, preços, status e estoque
- Fluxo inicial de venda com atualização automática de estoque
- Contas a receber com vencimento, baixa parcial/total e status visual
- Relatórios iniciais para visão gerencial
- API integrada ao projeto com separação por módulos

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

Padrão adotado:

- `app/`: rotas, páginas e route handlers
- `components/`: UI reutilizável, layout, formulários e gráficos
- `modules/`: regras de negócio, schemas Zod, repositórios e serviços por domínio
- `lib/`: autenticação, banco, permissões, utilitários e tratamento de erro
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

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vynce?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me-with-a-long-random-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Como rodar localmente

1. Instale as dependências:

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

## Scripts úteis

- `npm run dev`: desenvolvimento
- `npm run build`: build de produção
- `npm run start`: executar build
- `npm run lint`: lint
- `npm run typecheck`: validação TypeScript
- `npm test`: testes
- `npm run prisma:generate`: gerar client Prisma
- `npm run prisma:migrate`: rodar migrations em desenvolvimento
- `npm run db:seed`: popular dados iniciais

## Seed inicial

O seed cria:

- permissões base
- papéis `owner` e `seller` (Vendedor)
- categorias iniciais
- produtos de exemplo
- clientes de exemplo
- vendas e recebíveis de exemplo

Regra inicial de acesso:

- o primeiro usuário autenticado via Google passa a ser proprietário/administrador
- usuários seguintes entram como `Vendedor` (`seller`)

## Status atual da base

Entregue nesta versão:

- base de ponta a ponta organizada
- autenticação com Google configurada
- modelagem relacional consistente
- páginas iniciais do produto
- CRUD inicial para clientes e produtos
- fluxo inicial de vendas e pagamentos
- dashboard e relatórios
- migration inicial
- seed
- testes e lint configurados

## Próximos passos recomendados

- adicionar edição e exclusão completas nas entidades
- refinar gestão de permissões por tela e ação
- incluir paginação e filtros avançados
- expandir auditoria de estoque
- adicionar exportação de relatórios
- cobrir regras de negócio com mais testes
