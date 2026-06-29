---
name: db
description: Use ao trabalhar com Prisma, PlanetScale, schema, migrations, relacoes/indices ou qualquer acesso a banco. Garante o padrao multi-tenant e as restricoes do PlanetScale.
---

# Banco — Prisma + PlanetScale

Banco MySQL no **PlanetScale**, acesso via **Prisma**. (Schema entra na Fase 1; o
client singleton vive em `lib/db.ts`.)

## Convencoes obrigatorias

- **Provider** `mysql`. Connection string em `DATABASE_URL`.
- **`relationMode = "prisma"`** no datasource: o PlanetScale **nao usa foreign keys**.
  Consequencias:
  - Defina as relacoes no schema normalmente (`@relation`), mas a integridade e
    aplicada pelo Prisma, nao pelo banco.
  - **Adicione `@@index([...])` explicito em TODA coluna de FK** (ex.: `eventId`,
    `tenantId`), senao as queries ficam lentas (sem indice implicito de FK).
- **Client singleton** em `lib/db.ts` (evita esgotar conexoes no hot-reload do dev):
  cachear em `globalThis` fora de producao.

## Migrations

- Dev/iteracao rapida: `prisma db push` (sincroniza schema sem arquivo de migration).
- Producao/historico: `prisma migrate dev` / `prisma migrate deploy`.
- PlanetScale: mudancas de schema saem via deploy request (branch -> main). Evite
  operacoes que o PlanetScale bloqueia (ex.: FKs reais).

## Multi-tenant (critico)

- Toda tabela de dado de cliente carrega `tenantId` (e/ou `eventId`).
- **Nunca** faca query sem filtrar por tenant. Centralize helpers que ja recebem o
  `tenantId` para reduzir risco de vazamento entre tenants.
- Unicidade de slug/subdominio deve considerar o escopo correto (global para o
  subdominio do evento).

## Tipos

- Gere/valide com `prisma generate`. Use Zod nas bordas (input de API/forms), nao
  confie no tipo do banco para validar entrada do usuario.
