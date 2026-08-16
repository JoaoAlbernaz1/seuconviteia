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

- `DATABASE_URL` / `DIRECT_URL` — connection strings do **Supabase** (banco de producao;
  a `DIRECT_URL` e a conexao direta usada pelas migrations).
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `RESEND_API_KEY`, `EMAIL_FROM`, `SUPPORT_EMAIL`
- `MERCADOPAGO_ACCESS_TOKEN`, `BLOB_READ_WRITE_TOKEN`
- `NEXT_PUBLIC_ROOT_DOMAIN`, `CRON_SECRET`

## Notas

- Crons (Vercel Cron) devem validar `CRON_SECRET`; webhooks de pagamento devem
  verificar assinatura antes de processar.
- Passos manuais (registro de dominio, DNS, Google Workspace, etc.) ficam
  documentados em `docs/ops/` (preenchidos na Fase 8).
