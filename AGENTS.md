# Como trabalhamos aqui — dois agentes no mesmo projeto

Este repo é tocado por **dois engenheiros**: **Claude** (Claude Code) e **Codex** (OpenAI).
O dono é o João. As convenções de código estão no **`CLAUDE.md`** da raiz e valem para os dois.

## Papéis (definidos pelo João em 2026-08-16)

| | **Claude — implementa** | **Codex — revisa** |
| --- | --- | --- |
| Faz | escreve o código, os testes e as migrations; mantém o portão verde | lê o que foi implementado e aponta o que está errado ou frágil |
| Commita | sim, na branch de implementação | só em `docs/ops/notas-codex.md` (o parecer) |
| Pasta | `~/seuconviteia-claude` (worktree) | `~/seuconviteia` (checkout principal) |
| Branch | `claude/editor-foundation` — **a linha de implementação** | `refactor/editor-foundation` — **linha-base da revisão**, congelada |

A troca de papéis aconteceu depois da primeira rodada, em que o Codex implementou a fundação do
editor e o Claude revisou. Todo o trabalho dele foi incorporado na linha de implementação.

### Como a revisão é pedida

O Claude chama o Codex ao fechar cada pedaço de trabalho, de dentro do worktree de implementação:

```bash
/Applications/ChatGPT.app/Contents/Resources/codex review \
  --base refactor/editor-foundation \
  -c model="gpt-5.6-luna" -c model_reasoning_effort="max" < /dev/null
```

(`codex review` **não** aceita o `-m` do `codex exec`; o modelo vai por `-c model=...`.
Sem o `< /dev/null` o comando fica esperando stdin.)

Regra do João: **o Codex roda sempre em `gpt-5.6-luna` com reasoning `max`.**

O parecer volta para `docs/ops/notas-codex.md`. O Claude responde item a item: corrige o que
procede, e **explica por escrito** o que não procede em vez de ignorar em silêncio.

## Ambiente

| | Implementação (Claude) | Revisão (Codex) |
| --- | --- | --- |
| Banco de dev | `sc-postgres` :5433 (`postgresql://postgres:seuconvite@127.0.0.1:5433/seuconviteia`) | idem, se precisar rodar algo |
| Dev server | `:3100` (`NEXT_PUBLIC_ROOT_DOMAIN=localhost:3100`) | `:3000` |
| E2E | `E2E_DATABASE_READY=1 E2E_BASE_URL=http://127.0.0.1:3100 pnpm test:e2e` | — |

O banco é **PostgreSQL** desde 16/08/2026, local e produção (Supabase), com FKs reais.
Existe histórico em `prisma/migrations/`: use `pnpm db:migrate --name <descricao>` no dev e
`pnpm db:deploy` em produção. **`pnpm db:push` está proibido** — dessincroniza o histórico.
Os `.env*` são gitignored e existem em cópia própria em cada pasta. Não commitar segredo.

## Regras de git (o `.git` é compartilhado)

1. **Commite só na sua própria branch, de dentro da sua própria pasta.**
2. **Nunca** rode `rebase`, `reset --hard`, `commit --amend` ou `push --force` numa branch que não é sua.
3. Nunca mexa na árvore de trabalho do outro (nem para "arrumar rapidinho").
4. Commits semânticos (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
5. Quem integra as duas branches é o **Claude**, autorizado pelo João em 2026-08-16.

## Portão verde (antes de pedir revisão ou declarar pronto)

`pnpm test` · `pnpm lint` · `pnpm exec tsc --noEmit` · `pnpm build` — e, quando a mudança for de
UI ou fluxo, evidência real no navegador (Playwright), não só teste unitário.

⚠️ Rode `tsc` com o `.next` limpo: se um build bem-sucedido (`.next/types`) e um dev
(`.next/dev/types`) coexistirem, o `validator.ts` gerado acusa erro de rota que não existe.

## Recados entre os dois

Cada um escreve **no seu próprio arquivo**, para nunca dar conflito:

- Claude → `docs/ops/notas-claude.md`
- Codex → `docs/ops/notas-codex.md`

Formato: uma seção por dia, dizendo **o que fiz**, **o que está no meio do caminho** e
**o que o outro precisa saber**. Quem lê, lê antes de começar a mexer.

## Estado atual (2026-08-16)

Fase 1 da fundação do editor (`docs/superpowers/plans/2026-08-14-editor-foundation-phase-1.md`)
está com o portão verde e o e2e completo passando contra Postgres. O schema de produção já foi
expandido e verificado (`docs/ops/reconciliacao-prod-postgres.md`), e o histórico de migrations
de produção está alinhado com o repo. O que falta para subir é o **deploy na Vercel**, bloqueado
por proteção de autor de commit e SSO — assunto do João, não do código.
