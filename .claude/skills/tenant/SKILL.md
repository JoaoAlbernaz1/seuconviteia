---
name: tenant
description: Use ao mexer em roteamento por subdominio, middleware, isolamento multi-tenant, ou qualquer query/feature que dependa de qual evento/profissional esta sendo servido.
---

# Multi-tenancy — SeuConvite IA

Plataforma multi-tenant por **subdominio**. Resolucao no `middleware.ts`, com helper
puro e testavel em `lib/tenant.ts`.

## Resolucao de subdominio

`resolveSubdomain(host, rootDomain)` retorna o label do subdominio, ou `null` para
raiz/www/reservados. O middleware usa `NEXT_PUBLIC_ROOT_DOMAIN` (default `localhost:3000`).

- raiz (`seuconviteia.com`) e `www` -> `next()` (marketing).
- labels **RESERVED** = `["www","app","api","admin","send"]` -> `next()`.
  - `app.` = painel; `api`/`admin`/`send` reservados a infra/e-mail.
- `<slug>.<root>` -> `rewrite` para `/_sites/<slug>` (site publico do evento).

`slugify()` normaliza nomes para subdominio: minusculas, sem acento (NFD), `[^a-z0-9]`
vira `-`, colapsa/apara hifens. Use ao criar o slug de um evento.

## Grupos de rota (`app/`)

- `(marketing)` — dominio raiz (landing).
- `(dashboard)` — painel do profissional, servido em `app.`.
- `(event)` — layout dos sites publicos; o conteudo real e renderizado via rewrite
  do middleware para `%5Fsites/[sub]` (segmento publico `/_sites/<slug>`).

## ⚠️ Gotcha do matcher (bug real ja pago)

O matcher do `middleware.ts` **exclui `/api` e qualquer path com extensao**
(`.*\.[\w]+$`) — esses paths NUNCA sao reescritos pro site do evento. Consequencia:
no subdominio do evento **nao existe rota `/api/*` nem path tipo `/arquivo.ics`**
(o "Adicionar a agenda" deu 404 por isso). Solucao: paths sem extensao com route
handler — ex.: `/agenda` serve o calendario com `Content-Type: text/calendar` e o
nome `.ics` no `Content-Disposition`.

## Regras de ouro

- **Isole TODA query por `tenantId`/`eventId`.** Nunca consulte sem filtro de tenant;
  nunca confie so no subdominio para autorizacao — valide ownership no servidor.
- Slug **indisponivel/reservado** na criacao: rejeitar (checar `RESERVED` + unicidade).
- Evento **expirado/inexistente/despublicado**: o site deve responder 404/pagina propria,
  nunca vazar dado de outro tenant.
- Subdominio so aceita **um nivel** (sem pontos internos).

## Teste local

Chrome resolve `*.localhost`. Com `NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000`:

- `cliente.localhost:3000` -> site do evento "cliente".
- `app.localhost:3000` -> painel (reservado).
- `localhost:3000` -> marketing.
