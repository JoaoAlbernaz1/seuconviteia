# Como trabalhamos aqui — dois agentes no mesmo projeto

Este repo é tocado por **dois engenheiros**: **Codex** (OpenAI) e **Claude** (Claude Code).
O dono é o João. As convenções de código estão no **`CLAUDE.md`** da raiz e valem para os dois.

## Territórios (não invadir)

| | Codex | Claude |
| --- | --- | --- |
| Pasta | `~/seuconviteia` (checkout principal) | `~/seuconviteia-claude` (git worktree) |
| Branch | `refactor/editor-foundation` | `claude/editor-foundation` |
| Banco de dev | `seuconviteia` @ `127.0.0.1:3306` | `seuconviteia_claude` @ `127.0.0.1:3306` |
| Dev server | `:3000` | `:3100` (`NEXT_PUBLIC_ROOT_DOMAIN=localhost:3100`) |
| E2E | container `sc-mysql-editor-e2e` @ `:3307` | — |

Os `.env*` são gitignored e existem em cópia própria em cada pasta. Não commitar segredo.

## Regras de git (o `.git` é compartilhado)

1. **Commite só na sua própria branch, de dentro da sua própria pasta.**
2. **Nunca** rode `rebase`, `reset --hard`, `commit --amend` ou `push --force` numa branch que não é sua.
3. Nunca mexa na árvore de trabalho do outro (nem para "arrumar rapidinho").
4. Commits semânticos (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`), como já é o padrão.
5. **Integração (merge entre as duas branches) é responsabilidade do Claude**, autorizada pelo João
   em 2026-08-16 ("faz quando achar necessário"). Só integra com o portão verde abaixo.

## Portão verde (antes de integrar ou declarar pronto)

`pnpm test` · `pnpm lint` · `pnpm exec tsc --noEmit` · `pnpm build` — e, quando a mudança for de
UI ou fluxo, evidência real no navegador (Playwright), não só teste unitário.

## Recados entre os dois

Cada um escreve **no seu próprio arquivo**, para nunca dar conflito:

- Codex → `docs/ops/notas-codex.md`
- Claude → `docs/ops/notas-claude.md`

Formato: uma seção por dia, dizendo **o que fiz**, **o que está no meio do caminho** e
**o que o outro precisa saber** (arquivo que vai mudar de forma grande, decisão de arquitetura,
armadilha encontrada). Quem lê, lê antes de começar a mexer.

## Estado atual (2026-08-16)

Fase 1 da fundação do editor (`docs/superpowers/plans/2026-08-14-editor-foundation-phase-1.md`):
documento canônico versionado, autosave com concorrência otimista e snapshot de publicação.
O bloqueio conhecido para promover está em `docs/ops/editor-document-rollout.md` — a linha local
é **MySQL** e a produção é **PostgreSQL/Supabase**; expandir o schema em produção **antes** do
deploy da aplicação.
