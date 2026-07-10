---
name: run
description: Use para rodar, verificar ou depurar o app localmente (dev server, banco, build, lint, testes, testar subdominios). Tem os comandos reais e os gotchas do projeto.
---

# Rodar e verificar localmente

Gerenciador de pacotes: **pnpm**. Porta padrao: **3000**.

## Banco local (pre-requisito do dev)

Postgres 17 em Docker, container **`sc-postgres`**
(`postgresql://postgres:postgres@127.0.0.1:5433/seuconviteia`):

```bash
docker start sc-postgres  # container ja existe; so precisa estar de pe
pnpm db:migrate           # aplica as migrations versionadas
pnpm db:seed              # seed idempotente (evento demo maria-clara + login demo)
```

**Porta 5433, nao 5432.** Esta maquina roda um PostgreSQL nativo do Windows
(servico `postgresql-x64-17`) escutando na 5432; se o container subir na 5432, o
Prisma conecta no servico nativo e falha com `P1000: Authentication failed`.

Se `prisma generate` der `EPERM ... query_engine-windows.dll.node`, o dev server
esta segurando o arquivo. Mate o processo `node` do Next e rode de novo.

Recriar o container do zero (ele nao vem junto ao trocar de maquina):

```bash
docker run -d --name sc-postgres --restart unless-stopped \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=seuconviteia \
  -p 5433:5432 postgres:17
```

Login demo do painel: **demo@seuconviteia.com / demo12345**.

## Comandos

```bash
pnpm dev                # dev server -> http://localhost:3000 (Turbopack/HMR)
pnpm build              # build de producao (DEVE passar antes de subir)
pnpm lint               # ESLint (flat config)
pnpm test               # Vitest (~100 testes em lib/*.test.ts)
pnpm exec tsc --noEmit  # typecheck estrito
pnpm db:studio          # inspecionar o banco
```

## Testar subdominios (multi-tenant)

Chrome resolve `*.localhost` sem `/etc/hosts`. Com `NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000`:

- `http://localhost:3000` — marketing (landing).
- `http://app.localhost:3000` — painel do profissional.
- `http://maria-clara.localhost:3000` — site do evento demo.

## Gotchas (todos ja aconteceram de verdade)

- **Turbopack serve CSS VELHO as vezes** (classe nova nao aparece no compilado):
  `rm -rf .next` + reiniciar o dev. Nao perca tempo debugando o CSS antes disso.
- **Zumbi na :3000**: se o dev subir na :3001, tem um `next dev` antigo vivo —
  `lsof -ti :3000 | xargs kill` antes de rodar de novo.
- **Screenshot headless ENGANA**: o iframe do mapa demora ~6s pra pintar e os
  reveals so disparam ao rolar — nao julgue "bugado" por screenshot cru; o Joao
  avalia AO VIVO no navegador dele (regra do projeto).
- Builds nativos liberados em `pnpm-workspace.yaml` (`sharp`, `unrs-resolver`).
- `.env.local`/`.env` nao versionados — copie de `.env.example`.

## Checklist antes de dar por pronto

1. `pnpm exec tsc --noEmit` + `pnpm lint` + `pnpm test` verdes.
2. `pnpm build` passa (obrigatorio se mexeu em rota/config/deps).
3. Fluxo afetado exercitado de verdade no navegador (nao so teste unitario).
