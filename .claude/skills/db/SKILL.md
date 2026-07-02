---
name: db
description: Use ao trabalhar com Prisma, schema, seed, relacoes/indices, queries ou qualquer acesso a banco — mesmo que a tarefa nao fale "banco" (ex.: novo campo num form, nova entidade, RSVP, presentes). Garante o padrao multi-tenant e as restricoes do PlanetScale.
---

# Banco — Prisma + MySQL (PlanetScale em prod)

Dev: MySQL 8 no Docker (`sc-mysql`). Prod: **PlanetScale**. Client singleton em
`lib/db.ts`. Schema em `prisma/schema.prisma` — **ja existe e esta em uso**:
models `Professional`, `Event`, `Guest`, `GiftItem`, `Photo`, `Recado`, `Template`,
`Transaction` + enums `Plan`, `EventType`, `EventStatus`, `GuestStatus`, `GiftMode`.

## Versao (NAO mexer sem motivo)

**Prisma fixado na v6.19.3.** A v7 quebra `url = env("DATABASE_URL")` no datasource —
ja quebrou uma vez. So subir de major com migracao deliberada (existe a skill global
`prisma-upgrade-v7` se um dia for o caso).

## Convencoes obrigatorias

- **`relationMode = "prisma"`**: PlanetScale nao usa FKs reais. Consequencia pratica:
  **TODA coluna de relacao precisa de `@@index([...])` explicito** (ex.: `eventId`,
  `professionalId`), senao a query fica lenta — nao ha indice implicito de FK.
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
2. `pnpm db:push` (dev; sem arquivo de migration) + `pnpm db:generate` se preciso.
3. Atualizar `prisma/seed.ts` se o dado demo mudar — o seed e **idempotente**, mantenha assim.
4. Prod/PlanetScale: mudanca sai via deploy request (branch -> main), na Fase 8.

## Tipos e validacao

- Zod valida TODA entrada externa (forms/actions/API) — o tipo do Prisma nao protege
  contra input malicioso, ele so descreve o banco.
