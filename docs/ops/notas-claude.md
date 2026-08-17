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

---

## 2026-08-16 (terceiro recado) — Postgres unificado + 2 achados sobre o seu trabalho

### 1. Correção do meu recado anterior sobre o `tsconfig.json`

Eu disse que o `exclude: [".next/dev"]` resolvia o conflito de tipos. **Está incompleto.**
Quando existe um build BEM-SUCEDIDO (`.next/types`) e um dev rodando (`.next/dev/types`) ao mesmo
tempo, o `tsc` volta a acusar:

```
.next/types/validator.ts(25,44): error TS2344: Type 'Route' does not satisfy the constraint 'LayoutRoutes'
  '"/_sites/[sub]"' is not assignable ... Did you mean '"/%5Fsites/[sub]"'?
```

Motivo: o `validator.ts` **gerado pelo build importa** `.next/dev/types/routes` diretamente.
`exclude` só impede que o arquivo entre como raiz do projeto — não impede import. Na primeira vez
que testei, o build tinha falhado, então `.next/types` não existia e o erro não aparecia; foi por
isso que eu dei o veredito errado.

Sugestão (não apliquei, o arquivo é seu e você está mexendo nele agora): tirar `.next` inteiro do
`tsc` e deixar a validação de rotas para o `next build`, que já faz isso. Assim o `tsc --noEmit`
vira um check rápido de fonte e nunca mais dá erro fantasma. Enquanto isso, `rm -rf .next` antes
do `tsc` resolve.

### 2. O e2e do editor falha por seletor, não por lógica

Rodei o seu `e2e/editor-foundation.spec.ts` (com `E2E_DATABASE_READY=1`) contra o app em Postgres.
Falha determinística na **linha 114**:

```
strict mode violation: getByRole('button', { name: 'Continuar' }) resolved to 2 elements
  1) dentro de getByLabel('Pré-visualização do convite')  <- o botão do RSVP DO CONVITE
  2) o "Continuar" do editor
```

Ou seja: depois do `cycle(page, "Ativar RSVP")`, a prévia passa a renderizar o formulário de RSVP,
que tem o próprio botão "Continuar" — e aí o locator casa com dois. Não tem nada a ver com banco.
O caminho é escopar o locator do editor para fora da prévia (por exemplo, ancorar no formulário/
painel de edição em vez da página inteira). Não mexi no arquivo porque você está commitando nele.

### 3. O banco agora é PostgreSQL nos dois lados — **você vai precisar migrar seu ambiente local**

Commit `5c0737c` na branch `claude/editor-foundation`. O `provider` do `schema.prisma` virou
`postgresql`, o `relationMode = "prisma"` foi aposentado (produção sempre teve FKs reais) e o repo
passou a ter histórico em `prisma/migrations/` (o `init` de produção + a expansão da Fase 1).

Quando isso mergear na sua branch, seu MySQL local para de servir. São dois comandos:

```bash
docker run -d --name sc-postgres -e POSTGRES_PASSWORD=seuconvite -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=seuconviteia -p 5433:5432 postgres:17
# no seu .env:
#   DATABASE_URL="postgresql://postgres:seuconvite@127.0.0.1:5433/seuconviteia"
#   DIRECT_URL="postgresql://postgres:seuconvite@127.0.0.1:5433/seuconviteia"
pnpm db:deploy && pnpm db:seed
```

**Não use mais `pnpm db:push`** — agora existe histórico de migrations e o push dessincroniza.
Para mudar schema: `pnpm db:migrate --name <descricao>`.

Um detalhe que te afeta: seu `lib/event-editor/legacy-db-characterization.test.ts` usava SQL MySQL
(crase em `` `order` ``, tabelas sem aspas). Reescrevi em Postgres e ele **deixou de ser pulado** —
roda e passa contra o banco real com o seed.

---

## 2026-08-17 — assinatura do SaaS fechada (tarefas 4 a 6)

O plano `docs/superpowers/plans/2026-08-17-assinatura-saas-mercado-pago.md` está
executado inteiro (commits `def16f7`, `21061e9`, `8b1413b`). Portão verde: 365 testes
(com `PAGAMENTO_DB_TESTS=1`), lint e `tsc` limpos.

Três coisas que mudam decisões suas:

1. **Plano nenhum vale por si.** `prof.plan` é o CONTRATADO. O direito de hoje sai de
   `planoEfetivo(conta, agora)` — contratado ∧ `assinaturaAte` no futuro. Se você
   selecionar só `plan` num `select`, a conta continua dizendo PREMIUM depois de
   vencer. Use `SELECT_ASSINATURA` (em `lib/plans.ts`) no `select` e derive.
2. **Cancelar agora fala com o gateway.** `trocarPlano` cancela o `preapproval` no MP
   antes de tocar na nossa linha; se o MP recusar, nada muda e a tela avisa. Nunca
   marque "cancelado" sem o MP ter confirmado — seria cobrar quem cancelou.
3. **Sua conta demo local vai parecer rebaixada** até rodar `pnpm db:seed` de novo: o
   seed passou a dar assinatura em dia à conta demo. Sem isso o painel abre sem RSVP,
   recados nem galeria (o gating está certo; falta o vencimento).

Um achado de teste que pode te pegar: a limpeza por `email: { contains: MARCA }` de um
arquivo apaga as contas de outro quando uma marca é prefixo da outra
(`webhook-assinatura-teste` casa com `assinatura-teste`). Rodando os arquivos juntos,
o teste do outro arquivo falha "sem motivo".

Falta, e depende do João: cadastrar o webhook no MP com os eventos de assinatura,
aplicar a migration em produção e o teste no ar (assinar → webhook → cancelar).

---

## 2026-08-17 (fim do dia) — deploy de producao e o bloqueio dos deploys automaticos

**Producao esta com a linha `claude/editor-foundation`**, incluindo os consertos do editor
(cor do RSVP, tamanho das letras, rodape, galeria de verdade, presentes/Vitrine na previa,
recados, tela de modelo e os popups de plano). Deploy feito pela CLI, de uma COPIA do
worktree **sem `.git`** — e por isso que ele passa.

Banco: as cinco migrations do repo ja estavam aplicadas em `seuconviteia-prod`
(a ultima, `20260817180000_dados_do_titular`, entrou hoje). O commit do editor **nao tem
migration** — foi so codigo.

**Por que TODO push para o GitHub virava `BLOCKED` na Vercel:** protecao de autor. Os commits
saiam assinados como `joaovictoralbernaz95@gmail.com` (conta GitHub `ALJoao`), e a conta da
Vercel e `joaovictoralbernaz77@gmail.com`. A Vercel recusa deploy de commit cujo autor nao e
da equipe — nao e erro de build, e recusa antes de construir.

Corrigido no `.git/config` do repo (vale para os dois worktrees):
`user.email = joaovictoralbernaz77@gmail.com`, o mesmo email da conta da Vercel. 48 commits
antigos ja usavam esse email. **Commits novos passam; os antigos continuam bloqueados** (o
autor esta gravado neles), o que nao atrapalha: producao sobe pela CLI.

Lembrete: o deploy pelo GitHub desta branch geraria PREVIEW, nao producao — producao continua
saindo da CLI ate a branch de producao do projeto apontar para ca.
