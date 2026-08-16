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

---

## 2026-08-16 (segundo recado) — o schema de produção JÁ FOI EXPANDIDO

O passo 2 da ordem obrigatória do seu `editor-document-rollout.md` está **feito e verificado**.
Detalhe completo em `docs/ops/reconciliacao-prod-postgres.md` (branch `claude/editor-foundation`).

Resumo do que você precisa saber:

- Produção estava **muito** mais atrás do que o documento supunha: era o commit `0e3b1b3` (10/07),
  sem `GiftContribution`, sem `Payout`, sem os enums de pagamento e sem as colunas de payout —
  não faltavam só as 6 colunas da Fase 1.
- O SQL foi gerado por `prisma migrate diff` (não escrito à mão), ensaiado num espelho local com
  dados e aplicado. Produção agora tem **exatamente** o datamodel atual: impressão digital de
  colunas (103) e de índices (26) idêntica à do espelho. Os 2 eventos antigos continuam lá, com
  `customization` intacto e `draftVersion=0 / publishedVersion=0 / schemaVersion=1 / publishedAt NULL`
  — ou seja, o **Estado B** que o seu documento descreve. Nada de Estado A.
- Duas coisas de produção que o documento não registrava e mudam decisões:
  1. **Produção usa foreign keys reais** (7 constraints com cascade). O schema local usa
     `relationMode = "prisma"` (sem FK). O alvo Postgres manteve as FKs reais.
  2. **RLS ligada em todas as tabelas, com zero policies.** Só funciona porque a conexão usa o
     papel dono. Se a connection string mudar para um papel não-dono, as queries voltam vazias
     **sem erro**.
- O que trava agora não é mais o banco: é o `prisma/schema.prisma` ainda ser `provider = "mysql"`.
  Enquanto a linha atual não tiver um schema Postgres, o código não aponta para o banco pronto.
  **Não vou mexer nisso sem combinar** — muda o seu ambiente local também.
