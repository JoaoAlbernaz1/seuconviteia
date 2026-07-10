---
name: deploy
description: Use ao fazer deploy na Vercel, configurar dominio/wildcard, DNS ou variaveis de ambiente de producao do SeuConvite IA.
---

# Deploy — Vercel

Hospedagem na **Vercel**, projeto **unico** (marketing + painel + sites de evento
saem do mesmo app; quem separa e o `middleware.ts` por subdominio).

## Dominios

Adicione no projeto da Vercel **os dois**:

- `seuconviteia.com` (apex) — marketing.
- `*.seuconviteia.com` (**wildcard**) — cobre `app.`, `<cliente>.`, etc.

Sem o wildcard, novos subdominios de evento nao resolvem.

## DNS

- Apex `seuconviteia.com` -> registro recomendado pela Vercel (A/ALIAS).
- Wildcard `*.seuconviteia.com` -> **CNAME para a Vercel** (`cname.vercel-dns.com`).
- Garanta que `NEXT_PUBLIC_ROOT_DOMAIN=seuconviteia.com` em producao.

## Variaveis de ambiente

Configure na Vercel todas as chaves de `.env.example`:

- `DATABASE_URL` — pooler do projeto Supabase **`seuconviteia-prod`** (porta `6543`),
  com `?pgbouncer=true&connection_limit=1`. Sem esse sufixo, prepared statements
  quebram de forma intermitente sob concorrencia.
- `DIRECT_URL` — conexao direta do mesmo projeto (porta `5432`). Usada pelo
  `vercel-build` (`prisma migrate deploy`). Sem ela, o build falha.
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `RESEND_API_KEY`, `EMAIL_FROM`, `SUPPORT_EMAIL`
- `MERCADOPAGO_ACCESS_TOKEN`, `BLOB_READ_WRITE_TOKEN`
- `NEXT_PUBLIC_ROOT_DOMAIN`, `CRON_SECRET`

## Notas

- Crons (Vercel Cron) devem validar `CRON_SECRET`; webhooks de pagamento devem
  verificar assinatura antes de processar.
- Passos manuais (registro de dominio, DNS, Google Workspace, etc.) ficam
  documentados em `docs/ops/` (preenchidos na Fase 8).
