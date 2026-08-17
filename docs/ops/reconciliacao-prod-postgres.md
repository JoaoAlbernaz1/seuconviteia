# Reconciliação do schema de produção (PostgreSQL/Supabase) — 2026-08-16

Executado por: Claude. Complementa o `editor-document-rollout.md`, que previa a expansão do
schema **antes** do deploy da aplicação. **A expansão foi feita.**

## O que produção realmente era (auditado, não presumido)

Projeto Supabase **`seuconviteia-prod`** (`lhmezkzdaspwltgmlwyk`, sa-east-1, Postgres 17).

- Schema congelado numa única migration Prisma **`20260709212202_init`**, de **10/07/2026** —
  corresponde ao commit **`0e3b1b3`** ("migra schema de MySQL/PlanetScale para Postgres/Supabase").
  Mais de um mês atrás da linha local.
- Faltava **muito mais** que as colunas da Fase 1: não existiam as tabelas `GiftContribution` e
  `Payout` (toda a carteira/split de Pix), nem os enums `GiftPricing`/`PayStatus`, nem
  `Event.payoutPixKey/payoutPixName`, nem `GiftItem.pricingMode/quotaCount/storeUrl`.
- Dados: **1 profissional** (a conta do próprio João), **2 eventos de teste** de 10/07
  (`sua-festa` DRAFT e `mariaclara` PUBLISHED, ambos já com `expiresAt` vencido), 1 foto,
  e zero convidados/presentes/recados/transações. **Nenhum dado de cliente.**
- Diferença estrutural relevante em relação ao local: **produção usa foreign keys reais**
  (7 constraints com `ON DELETE CASCADE`), enquanto o schema local usa `relationMode = "prisma"`
  (sem FK no banco). O alvo Postgres mantém as FKs reais.
- **RLS está ligada em todas as tabelas, com zero policies.** Funciona porque a aplicação conecta
  com o papel dono (que ignora RLS). ⚠️ Se um dia a conexão passar a usar `anon`/`authenticated`
  ou um papel não-dono, **toda query volta vazia, sem erro**. Ficar atento ao trocar a connection
  string. As duas tabelas novas foram criadas seguindo o mesmo padrão.

## O que foi aplicado

`docs/ops/sql/2026-08-16-fase1-expansao-postgres.sql` — gerado por
`prisma migrate diff --from-schema-datamodel <schema de 0e3b1b3> --to-schema-datamodel <schema atual em postgres>`,
**não escrito à mão**. É 100% aditivo: 2 enums, 8 colunas em `Event`, 3 em `GiftItem`,
2 tabelas novas com índices e FKs. **Zero `DROP`, zero alteração de coluna legada.**

Aplicado em produção como migration `fase1_expansao_editor_e_pagamentos`, acrescido de
`ENABLE ROW LEVEL SECURITY` nas duas tabelas novas.

## Ensaio antes de produção

1. Recriado o estado **exato** de produção num Postgres local (`espelho_prod`), conferido com
   `prisma migrate diff --exit-code` → sem diferença.
2. Populado com dados equivalentes aos de produção (profissional, 2 eventos, 1 presente).
3. Aplicada a expansão com `ON_ERROR_STOP=1` → sem erro.
4. `prisma migrate diff --exit-code` do espelho contra o datamodel alvo → **sem diferença**.
5. Linhas preservadas, com os defaults certos (`draftVersion=0`, `publishedVersion=0`,
   `schemaVersion=1`, `publishedAt` nulo, `customization` intacto, `pricingMode=FIXO`).

## Verificação depois de produção

| conferência | resultado |
| --- | --- |
| Tabelas | 9 → **11** |
| Colunas em `Event` | 13 → **21** |
| Eventos / profissionais / fotos | 2 / 1 / 1 — inalterados |
| `customization` de todos os eventos | preservado |
| Defaults nas linhas antigas | `draftVersion=0`, `publishedVersion=0`, `schemaVersion=1`, `publishedAt` nulo |
| Impressão digital das **colunas** (md5, 103 col.) | `a5b50925…` — **igual à do espelho** |
| Impressão digital dos **índices** (md5, 26 idx.) | `e99cb7d1…` — **igual à do espelho** |

Backup dos dados anteriores (JSON de todas as tabelas) capturado antes da expansão, guardado
fora do repo (contém hash de senha): `scratchpad/pg/backup-prod-2026-08-16.json`.

## Rollback

Não é necessário para a aplicação implantada hoje: ela é da linha de julho e simplesmente ignora
as colunas novas (Prisma seleciona só os escalares que conhece). Se ainda assim precisar, as
colunas e tabelas novas podem ser removidas com o inverso do SQL — mas remoção exige decisão
própria e auditoria, conforme o `editor-document-rollout.md`.

## O que ainda falta para o app funcionar em produção

1. **O repo ainda é MySQL.** `prisma/schema.prisma` tem `provider = "mysql"` e
   `relationMode = "prisma"`. Para a linha atual rodar contra o Supabase é preciso um schema
   Postgres (provider `postgresql`, `directUrl`, sem `relationMode`). Enquanto isso não for
   decidido, o banco está pronto mas o código não aponta para ele.
2. **Deploy na Vercel bloqueado** por proteção de autor de commit e SSO (assunto do João).
3. Reexecutar o `seed` de produção não é necessário — e não deve ser feito com os dados atuais
   sem decisão explícita.

---

# Aplicação da assinatura do SaaS em produção — 2026-08-17

Migration **`20260817040000_assinatura_saas`** aplicada em `seuconviteia-prod`
(`lhmezkzdaspwltgmlwyk`) e registrada em `_prisma_migrations` com o checksum real do arquivo
(`52a84809…`, sha256 do `migration.sql`), para `prisma migrate status` continuar limpo.

**Antes:** backup JSON de todas as tabelas fora do repo (contém hash de senha), em
`scratchpad/backup-prod-2026-08-17-antes-assinatura.json`, com md5 de `customization` e
`draftData` de cada evento — o SQL é aditivo e não toca neles, e o md5 prova isso depois.

**O que entrou:** 3 colunas nulas em `Professional` (`mpPreapprovalId` único,
`assinaturaStatus`, `assinaturaAte`) e a tabela `CobrancaAssinatura` (índice único em
`providerId`, índice em `professionalId`, FK com cascade, **RLS ligada** como as demais).
Zero `DROP`, zero alteração de coluna legada.

| conferência | resultado |
| --- | --- |
| Impressão digital das colunas (md5, 113 col., fora `_prisma_migrations`) | `8dbe9935…` — **igual à do banco local** |
| Contagens | Professional 2 · Event 3 · GiftItem 5 · Photo 1 · GiftContribution 1 — inalteradas |
| `customization` / `draftData` de todos os eventos | md5 idêntico ao de antes |
| RLS em `CobrancaAssinatura` | ligada |
| Contas existentes | `assinaturaStatus`/`assinaturaAte`/`mpPreapprovalId` nulos |

**Deploy:** branch `claude/editor-foundation` (commit `b3f0ce4`) pelo procedimento do diretório
sem `.git`. Verificado no ar (via `seuconviteia.vercel.app`, porque a rede local **bloqueia**
`orivya.com.br`): landing 200 com o CTA novo (`/cadastrar?plano=classico|premium`), `/painel`
307, e `POST /api/webhooks/mercadopago` sem assinatura válida → **401** (o segredo do webhook
está configurado; sem ele a rota devolveria 503).

⚠️ **Efeito esperado:** as duas contas de produção ficaram **sem assinatura**, então quem tinha
`plan = PREMIUM` na linha passa a valer como **Básico** no painel (`planoEfetivo`). Os sites
publicados não mudam — eles leem `Event.plan`, gravado no evento.
