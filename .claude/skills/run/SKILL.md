---
name: run
description: Use para rodar, verificar ou depurar o app localmente (dev server, banco, build, lint, testes, testar subdominios). Tem os comandos reais e os gotchas do projeto.
---

# Rodar e verificar localmente

Gerenciador de pacotes: **pnpm**. Porta padrao: **3000**.

## Banco local (pre-requisito do dev)

MySQL 8 em Docker, container **`sc-mysql`** (`mysql://root:root@127.0.0.1:3306/seuconviteia`):

```bash
docker start sc-mysql   # container ja existe; so precisa estar de pe
pnpm db:push            # sincroniza o schema
pnpm db:seed            # seed idempotente (evento demo maria-clara + login demo)
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
