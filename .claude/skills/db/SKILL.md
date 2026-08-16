---
name: db
description: Use ao trabalhar com Prisma, schema, seed, relacoes/indices, queries ou qualquer acesso a banco — mesmo que a tarefa nao fale "banco" (ex.: novo campo num form, nova entidade, RSVP, presentes). Garante o padrao multi-tenant e as regras do Postgres/Supabase.
---

# Banco — Prisma + PostgreSQL (Supabase em prod)

Dev: Postgres 17 no Docker (`sc-postgres`, porta 5433). Prod: **Supabase**. Client singleton em
`lib/db.ts`. Schema em `prisma/schema.prisma` — **ja existe e esta em uso**:
models `Professional`, `Event`, `Guest`, `GiftItem`, `Photo`, `Recado`, `Template`,
`Transaction` + enums `Plan`, `EventType`, `EventStatus`, `GuestStatus`, `GiftMode`.

## Versao (NAO mexer sem motivo)

**Prisma fixado na v6.19.3.** A v7 quebra `url = env("DATABASE_URL")` no datasource —
ja quebrou uma vez. So subir de major com migracao deliberada (existe a skill global
`prisma-upgrade-v7` se um dia for o caso).

## Convencoes obrigatorias

- **FKs sao REAIS** (o `relationMode = "prisma"` foi aposentado em 16/08/2026): o banco
  aplica integridade e `onDelete: Cascade` de verdade. Ainda assim, **TODA coluna de
  relacao precisa de `@@index([...])` explicito** (ex.: `eventId`, `professionalId`) —
  o Postgres nao cria indice automatico do lado que referencia.
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
2. `pnpm db:migrate --name <descricao>` (cria o arquivo em `prisma/migrations/` e aplica
   no banco local). O repo tem historico de migrations — **nao usar `db:push`**, que
   dessincroniza o historico.
3. Atualizar `prisma/seed.ts` se o dado demo mudar — o seed e **idempotente**, mantenha assim.
4. Prod/Supabase: `pnpm db:deploy` (`prisma migrate deploy`) ANTES do deploy da aplicacao —
   a ordem esta em `docs/ops/editor-document-rollout.md` e `docs/ops/reconciliacao-prod-postgres.md`.

## Tipos e validacao

- Zod valida TODA entrada externa (forms/actions/API) — o tipo do Prisma nao protege
  contra input malicioso, ele so descreve o banco.
