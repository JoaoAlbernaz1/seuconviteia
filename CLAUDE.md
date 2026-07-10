# SeuConvite IA — convencoes do repo

SaaS **B2B multi-tenant** ("iCasei multi-nicho"): profissionais criam sites de convite
para clientes, cada um em seu subdominio (`<cliente>.seuconviteia.com`). Marca turquesa+roxo.

**Stack:** Next.js 16 (App Router, React 19, React Compiler), TypeScript strict,
Tailwind v4, Prisma + Supabase (Postgres, FKs reais), Auth.js,
Mercado Pago (Pix), Resend, Vercel Blob, Vercel. Gerenciador: **pnpm**.

## Skills do projeto

Sempre **use a skill relevante antes de cada tarefa** (`.claude/skills/<nome>/SKILL.md`):

- **evt** — site publico do evento (template festa, paletas `--ev-*`, nichos, RSVP,
  componentes `components/evt/*`, gotchas de fuso/reduced-motion/carrossel).
- **brand** — marca do SaaS (turquesa+roxo, Fraunces/Sora) no marketing e painel;
  onde a marca NAO vale (site do evento).
- **tenant** — multi-tenancy por subdominio, `lib/tenant.ts`, matcher do middleware
  (sem `/api`/extensao no subdominio), isolamento por tenant.
- **db** — Prisma 6 (fixado) + Postgres/Supabase, `Event.customization`,
  plano herdado da conta, indices de FK, seed idempotente.
- **run** — banco Docker `sc-postgres` (porta 5433), comandos reais, login demo, gotchas de dev,
  checklist de pronto.
- **deploy** — Vercel, dominio + wildcard `*.seuconviteia.com`, env vars, DNS.

Skills globais instaladas que valem aqui: **prisma-client-api / prisma-cli /
prisma-database-setup** (queries e CLI), **authjs-skills** (Auth.js v5),
**webapp-testing** (verificar no navegador), **deploy-to-vercel** (Fase 8),
**pricing / onboarding-cro / emails** (quando o tema for negocio/CRO/e-mail).

## Convencoes de codigo

- **TypeScript strict.** Sem `any` injustificado; tipar bordas. **Zod** para validar
  toda entrada externa (forms, params, payloads de API/webhook).
- **Server Components por padrao**; `"use client"` so quando precisar de interatividade.
- **Isole TODA query por tenant** (`tenantId`/`eventId`). Nunca vaze dado entre tenants;
  valide ownership no servidor (nao confie so no subdominio).
- **LGPD:** formularios com dados pessoais precisam de consentimento explicito; colete
  o minimo necessario.
- **Crons:** proteger com `CRON_SECRET`. **Webhooks de pagamento:** verificar a
  assinatura antes de processar.
- **Commits semanticos** (`feat:`, `fix:`, `chore:`, `docs:`, ...).
- Brand tokens vivem em `app/globals.css`; use utilities do Tailwind, nao hex solto.

## Estrutura

- `app/(marketing)` raiz · `app/(dashboard)` painel (`app.`) · `app/(event)` + rewrite
  para `app/%5Fsites/[sub]` (sites de evento por subdominio).
- `lib/` — `tenant.ts` (resolucao de subdominio), `db.ts` (Prisma singleton),
  `plans.ts`, `payments/`, `storage/`, `email/`.
- `middleware.ts` — roteamento por subdominio.
- `docs/ops/` — processos manuais (dominio, infra, etc.), preenchidos na Fase 8.

## Dev tip

Testar tenants localmente: `NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000` no `.env.local`
e acessar `cliente.localhost:3000` (Chrome resolve `*.localhost`).
