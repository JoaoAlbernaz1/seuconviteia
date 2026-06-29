---
name: run
description: Use para rodar, verificar ou depurar o app localmente (dev server, build, lint, testar subdominios). Tem os comandos reais e os gotchas do projeto.
---

# Rodar e verificar localmente

Gerenciador de pacotes: **pnpm**. Porta padrao: **3000**.

## Comandos

```bash
pnpm install      # instala dependencias
pnpm dev          # dev server -> http://localhost:3000 (Turbopack/HMR)
pnpm build        # build de producao (DEVE passar antes de subir)
pnpm start        # serve o build de producao
pnpm lint         # ESLint (eslint-config-next, flat config)
pnpm test         # testes — NAO existe ainda; adicionado em fase posterior
```

## Testar subdominios (multi-tenant)

Chrome resolve `*.localhost` sem configurar `/etc/hosts`. Com
`NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000` no `.env.local`:

- `http://localhost:3000` — marketing.
- `http://cliente.localhost:3000` — site do evento "cliente" (rewrite p/ `/_sites/cliente`).
- `http://app.localhost:3000` — painel (label reservado).

## Gotchas

- **Builds nativos liberados** em `pnpm-workspace.yaml` (`allowBuilds` /
  `onlyBuiltDependencies`): `sharp` e `unrs-resolver`. Se `pnpm install` reclamar de
  scripts de build ignorados, e ai que se autoriza.
- `.env.local` nao e versionado — copie de `.env.example`.
- Sempre rode `pnpm build` **e** `pnpm lint` antes de considerar uma tarefa pronta.
