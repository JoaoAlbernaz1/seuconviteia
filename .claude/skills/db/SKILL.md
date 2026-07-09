---
name: db
description: Use ao trabalhar com Prisma, schema, seed, relacoes/indices, queries ou qualquer acesso a banco — mesmo que a tarefa nao fale "banco" (ex.: novo campo num form, nova entidade, RSVP, presentes). Garante o padrao multi-tenant e as convencoes de migration.
---

# Banco — Prisma + Postgres (Supabase em prod)

Dev: Postgres 17 no Docker (`sc-postgres`, **porta 5433**). Prod: projeto Supabase
`seuconviteia-prod`. Client singleton em `lib/db.ts`.
Schema em `prisma/schema.prisma` — **ja existe e esta em uso**:
models `Professional`, `Event`, `Guest`, `GiftItem`, `Photo`, `Recado`, `Template`,
`Transaction` + enums `Plan`, `EventType`, `EventStatus`, `GuestStatus`, `GiftMode`.

## Versao (NAO mexer sem motivo)

**Prisma fixado na v6.19.3.** A v7 quebra `url = env("DATABASE_URL")` no datasource —
ja quebrou uma vez. So subir de major com migracao deliberada (existe a skill global
`prisma-upgrade-v7` se um dia for o caso).

## Convencoes obrigatorias

- **FKs sao reais** (o `relationMode = "prisma"` do PlanetScale foi removido em
  `0e3b1b3`): o banco aplica integridade e `onDelete: Cascade`.
- **TODA coluna de relacao precisa de `@@index([...])` explicito** (ex.: `eventId`,
  `professionalId`). Postgres **nao** indexa coluna de FK automaticamente — so a
  chave primaria referenciada. Sem o indice, a query por relacao fica lenta.
- **Duas conexoes**: `DATABASE_URL` e o pooler (transaction mode) e leva
  `?pgbouncer=true&connection_limit=1`; `DIRECT_URL` e a conexao direta e serve
  apenas as migrations. Trocar isso derruba producao por esgotamento de conexao.
- **O Prisma CLI le apenas `.env`**, nunca `.env.local` (isso e convencao do
  Next.js). Conexao de dev mora no `.env`.
- Campos flexiveis do evento (paleta, textos, programacao, pix, fotos) vivem no JSON
  **`Event.customization`** — lido/normalizado por `lib/eventoFesta.ts` e
  `lib/convite.ts` (`lerConteudo`). Novo campo de personalizacao entra AI, nao como
  coluna nova.
- **Plano e da CONTA**: `Professional.plan`; o evento herda (`Event.plan` setado em
  criar/editar). Gating de recurso le SEMPRE `lib/plans.ts` (fonte unica) — nunca
  espalhe `if plan === ...` pelo codigo.
- Isolamento multi-tenant: toda query de dado de cliente filtra por
  `professionalId`/`eventId`; ownership re-validado no servidor (padrao real em
  `app/(dashboard)/actions.ts`).
- Unicidade de subdominio e global (`gerarSlugUnico` + RESERVED em `lib/tenant.ts`).

## Fluxo de alteracao de schema

1. Editar `prisma/schema.prisma` (lembrar `@@index` nas relacoes novas).
2. `pnpm db:migrate --name <descricao>` — cria o arquivo em `prisma/migrations/` e
   aplica no dev. **Commitar a migration.** Nao use `db:push`: o banco e
   compartilhado, e `push` sem historico sobrescreve o schema do outro sem registro.
3. Atualizar `prisma/seed.ts` se o dado demo mudar — o seed e **idempotente**, mantenha assim.
4. Prod: o `vercel-build` roda `prisma migrate deploy` a cada deploy. O CI roda
   `pnpm build` (sem migrate) contra envs dummy — nunca toca banco.

## Tipos e validacao

- Zod valida TODA entrada externa (forms/actions/API) — o tipo do Prisma nao protege
  contra input malicioso, ele so descreve o banco.
