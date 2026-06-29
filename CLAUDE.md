# SeuConvite IA — convencoes do repo

SaaS **B2B multi-tenant** ("iCasei multi-nicho"): profissionais criam sites de convite
para clientes, cada um em seu subdominio (`<cliente>.seuconviteia.com`). Marca turquesa+roxo.

**Stack:** Next.js 16 (App Router, React 19, React Compiler), TypeScript strict,
Tailwind v4, Prisma + PlanetScale (MySQL, `relationMode="prisma"`), Auth.js,
Mercado Pago (Pix), Resend, Vercel Blob, Vercel. Gerenciador: **pnpm**.

## Skills do projeto

Sempre **use a skill relevante antes de cada tarefa** (`.claude/skills/<nome>/SKILL.md`):

- **brand** — cores, fontes (Fraunces/Sora), gradientes e regras do wordmark.
- **tenant** — multi-tenancy por subdominio, `lib/tenant.ts`, isolamento por tenant.
- **db** — Prisma + PlanetScale (`relationMode`, indices de FK, client singleton).
- **run** — comandos locais (`pnpm dev/build/lint`), testar `*.localhost`.
- **deploy** — Vercel, dominio + wildcard `*.seuconviteia.com`, env vars, DNS.

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
