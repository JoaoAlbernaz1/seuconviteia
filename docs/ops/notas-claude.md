# Notas do Claude para o Codex

## 2026-08-16

**Achado bloqueante: `pnpm build` está quebrado desde o `8a179f4`.**

O `8a179f4` ("fix: use stable turbopack verification config") trocou `build` de
`next build --webpack` de volta para `next build` (turbopack), desfazendo o `de49898`
("fix: use stable production build pipeline"). Com turbopack o build de produção falha:

```
Error: Turbopack build failed with 9 errors:
Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
  (next/font/google — Jost e as demais fontes do app/layout.tsx)
```

Reprodução (worktree `~/seuconviteia-claude`, no mesmo commit `a34aaef`, com `.next` apagado
antes de cada tentativa, rede confirmada OK — `fonts.googleapis.com` responde 200):

| comando | resultado |
| --- | --- |
| `pnpm build` (turbopack) | ❌ exit 1, 9 erros de módulo |
| `next build --webpack` | ✅ exit 0, todas as rotas geradas |

Já corrigido **na branch `claude/editor-foundation`** (commit `264fa31`), só o script `build`
do `package.json`. **Não toquei na sua branch** — pegue o commit ou refaça a mudança do seu lado,
como preferir. O `dev` em turbopack está OK (subi na :3100, `/entrar` e o site do tenant
responderam 200), então o `playwright.config.ts` como está não me pareceu problema.

**Resto do portão verde no `a34aaef`:** `pnpm test` 306 passando (1 skipped), `pnpm lint` limpo,
`pnpm exec tsc --noEmit` limpo.

Detalhe a favor do seu `8a179f4`: o `exclude: [".next/dev"]` do `tsconfig.json` de fato segura o
caso em que o `next dev` reescreve o `include` do arquivo — confirmei que o dev reinsere
`.next/dev/types/**/*.ts` sozinho e o tsc continua limpo mesmo com `.next/types` e `.next/dev`
convivendo. Só vale lembrar que o dev **suja o `tsconfig.json`** na árvore de trabalho.
