# SeuConvite IA

**O seu site de convite em minutos.** SaaS B2B multi-tenant — um "iCasei multi-nicho":
o profissional (assessor de eventos, cerimonialista, fotografo, etc.) cria sites de
convite para os clientes, cada um publicado em seu proprio subdominio
(`<cliente>.seuconviteia.com`). Inclui RSVP (confirmacao de presenca), lista de
presentes, galeria e mais — por plano.

## Stack

- **Next.js 16** (App Router, React 19, React Compiler) + **TypeScript** (strict)
- **Tailwind CSS v4** (design tokens em `app/globals.css`)
- **Prisma + PlanetScale** (MySQL, `relationMode = "prisma"`) — _Fase 1_
- **Auth.js (NextAuth)** — _Fase 4_
- **Mercado Pago** (Pix + webhooks) — _Fase 6_
- **Resend** (e-mail transacional) + **Vercel Blob** (uploads)
- **Vercel** (deploy, dominio + wildcard `*.seuconviteia.com`)
- **pnpm** (gerenciador de pacotes)

## Multi-tenancy

Resolucao por subdominio no `middleware.ts` (helper puro em `lib/tenant.ts`):

| Host                          | Destino                                   |
| ----------------------------- | ----------------------------------------- |
| `seuconviteia.com` / `www.`   | Marketing — grupo `app/(marketing)`       |
| `app.seuconviteia.com`        | Painel do profissional — `app/(dashboard)`|
| `<slug>.seuconviteia.com`     | Site do evento — rewrite p/ `/_sites/<slug>` |

Labels reservados (nunca viram evento): `www`, `app`, `api`, `admin`, `send`.

## Rodando localmente

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Copie `.env.example` para `.env.local` e preencha as variaveis.

### Testando subdominios localmente

O Chrome resolve `*.localhost` automaticamente. Para emular tenants em dev, use
`NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000` no `.env.local` e acesse:

```
http://localhost:3000          # marketing (raiz)
http://cliente.localhost:3000  # site do evento "cliente"
http://app.localhost:3000      # painel (label reservado)
```

> Em producao, `NEXT_PUBLIC_ROOT_DOMAIN=seuconviteia.com`.

## Scripts

```bash
pnpm dev      # servidor de desenvolvimento (porta 3000)
pnpm build    # build de producao
pnpm start    # serve o build
pnpm lint     # ESLint
```

`pnpm-workspace.yaml` libera o build de pacotes nativos (`sharp`, `unrs-resolver`).

## Fases do projeto

- **Fase 0 — Setup (atual):** marca (tokens + fontes), estrutura de pastas, stubs,
  `.env.example`, middleware de tenant, skills e `CLAUDE.md`.
- **Fase 1 — Banco:** Prisma + PlanetScale, schema multi-tenant, client singleton.
- **Fase 2 — Tenancy:** resolucao de subdominio ligada ao banco, isolamento por tenant.
- **Fase 3 — Marketing:** landing completa.
- **Fase 4 — Painel:** Auth.js, painel do profissional, CRUD de eventos.
- **Fase 5 — Site do evento:** renderizacao publica por subdominio (RSVP, presentes, fotos).
- **Fase 6 — Pagamentos:** Mercado Pago (Pix), planos e gating.
- **Fase 7 — Comunicacao:** e-mails (Resend), uploads (Vercel Blob), crons.
- **Fase 8 — Operacao:** dominio, infra, Google Workspace, divulgacao (ver `docs/ops/`).

## Convencoes

Veja `CLAUDE.md` (convencoes do repo + skills do projeto em `.claude/skills/`).
