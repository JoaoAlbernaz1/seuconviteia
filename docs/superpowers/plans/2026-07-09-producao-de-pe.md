# Colocar a Produção de Pé — Plano de Implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: usar `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar tarefa a tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Spec:** `docs/superpowers/specs/2026-07-09-producao-de-pe-design.md` (commit `3a71ece`) — **leia a §0 do spec: três premissas deste plano foram refutadas em execução.**

## Estado da execução (2026-07-09)

| Tarefa | Estado | Nota |
|---|---|---|
| 1 — Inspecionar banco de produção | **Resolvida sem trabalho** | `DATABASE_URL` de prod aponta para `127.0.0.1`. `TEM_DADO_REAL = não`. Nada a migrar. |
| 2 — `AUTH_SECRET` | **Provavelmente já feito** em 03/07. Os erros lidos eram históricos. Confirmar no painel. |
| 3 — Projetos Supabase | **Parcial** | Limite de 2 ativos confirmado. `Zinc` pausado (autorizado). Criado só `seuconviteia-prod` = `lhmezkzdaspwltgmlwyk`. Dev foi para Postgres local `sc-postgres` na porta **5433**. |
| 4 — Schema Postgres | **Feita** | `0e3b1b3`. 147 testes verdes, `tsc` limpo. |
| 5 — Primeira migration | **Feita** | `5b75efb`. 7 FKs reais, 8 tabelas. |
| 6 — Provar independência da máquina | **Não se aplica ao dev** | O dev agora roda contra Docker local. A independência vale para a **produção**, e se prova quando ela subir contra o Supabase. |
| 7 — Build aplica migrations | **Feita, com correção** | `1217a4f`. Virou `vercel-build`, não `build`: o CI roda `pnpm build` sem banco e quebraria. |
| 8 — Repontar produção | **Bloqueada** | Falta a senha do Postgres do Supabase (só o dono obtém) e as env vars na Vercel. |
| 9 — Promover a landing | **Bloqueada** | Deploys via git estão `BLOCKED` pela proteção de git author. Ver Tarefa 11. |
| 10 — Documentação | **Feita** | `1217a4f`. `CLAUDE.md` e skills `db`/`run`/`deploy` diziam PlanetScale/MySQL. Novo `.env.example`. |
| 11 — Deploys `BLOCKED` | **Causa encontrada** | Não é uma causa, são duas. Ver abaixo. |

### Correções factuais ao que este plano afirmava

- **`templateId` não vira `RESTRICT`.** A migration gerada traz `ON DELETE SET NULL`
  (`confdeltype = 'n'`), porque a relação é opcional (`Template?`) e o padrão do
  Prisma para relação opcional é `SetNull`. O passo 5 da Tarefa 5 esperava `r`.
  Comportamento continua seguro: apagar um template zera a referência, não deixa órfão.
- **O Prisma CLI não lê `.env.local`.** Só `.env`. As conexões de dev tiveram que
  migrar para o `.env`, senão `migrate` falha com `Environment variable not found:
  DIRECT_URL`.
- **A porta 5432 já está ocupada** nesta máquina por um PostgreSQL nativo do Windows
  (`postgresql-x64-17`). O container precisou ir para a **5433**; sem isso o Prisma
  conecta no serviço nativo e falha com `P1000`.
- **`prisma generate` falha com `EPERM`** no `query_engine-windows.dll.node` se o dev
  server estiver rodando. Matar o processo do Next antes.

### As duas travas da Tarefa 11 (só o dono resolve)

1. **Git author.** Conta Vercel = `joaovictoralbernaz77@gmail.com`; commits assinados
   como `joaovictoralbernaz95@gmail.com`. O time Pro exige que o autor tenha acesso →
   `seatBlock: TEAM_ACCESS_REQUIRED`, deploy barrado antes do build. Corrigir
   adicionando o e-mail `95` à conta Vercel, ou desligando a proteção de git author.
2. **Vercel Authentication.** `ssoProtection: all_except_custom_domains` põe
   `seuconviteia.vercel.app` atrás do login da Vercel. **O site não é público.**
   Desligar Deployment Protection, ou apontar um domínio próprio. Sem isso, tráfego
   pago é dinheiro jogado fora.

**Goal:** A produção do `seuconvite.ia` funciona sozinha — login operante, banco na nuvem, landing aprovada no ar — sem depender de nenhuma máquina do dono estar ligada.

**Architecture:** O banco sai do MySQL local (Docker) para dois projetos Supabase Postgres separados — um `dev`, compartilhado pelas máquinas de desenvolvimento, e um `prod`, exclusivo da Vercel. O Supabase é usado como hospedagem de Postgres pura, falando apenas via Prisma, o que mantém a troca de provedor no custo de uma variável de ambiente. O `relationMode = "prisma"` é removido, trocando integridade referencial emulada por foreign keys reais. O `db push` dá lugar a `prisma migrate` versionado.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, Prisma 6, Postgres (Supabase), Auth.js v5, Vitest, pnpm, Vercel.

## Global Constraints

- **Supabase como Postgres puro.** Proibido: `supabase-js` no código da aplicação, RLS como regra de negócio, Realtime, Supabase Auth. Apenas o Prisma fala com o banco.
- **`DATABASE_URL` sempre aponta para o pooler** (porta `6543`) com o sufixo `?pgbouncer=true&connection_limit=1`. **`DIRECT_URL` sempre aponta para a conexão direta** (porta `5432`) e é usada somente por migrations.
- **Nada irreversível toca a produção antes da Tarefa 1 estar concluída.** Repontar o `DATABASE_URL` de produção com contas reais no banco antigo é falha silenciosa.
- **Nenhuma mudança visual é commitada sem aprovação do dono** ("pode subir").
- Gerenciador de pacotes: **pnpm**. Commits semânticos (`feat:`, `fix:`, `chore:`, `docs:`).
- TypeScript strict; Zod para toda entrada externa.
- **Sobre testes:** as tarefas 4 e 5 alteram schema e configuração, não lógica. Não existe teste unitário honesto para "o Postgres criou a foreign key" — a verificação é comando com saída esperada. Os 19 arquivos `*.test.ts` (Vitest, funções puras, nenhum toca o banco) são a rede de regressão e devem permanecer verdes em toda tarefa.

## Estrutura de arquivos

| Arquivo | Responsabilidade | Tarefa |
|---|---|---|
| `prisma/schema.prisma` | Trocar provider para `postgresql`, adicionar `directUrl`, remover `relationMode` | 4 |
| `prisma/migrations/<ts>_init/migration.sql` | Primeira migration versionada (gerada) | 5 |
| `package.json` | Scripts `db:migrate`, `db:deploy`; `build` aplica migrations | 5, 7 |
| `.env.local` | Conexões do Supabase **dev** (não versionado) | 3 |
| `.env.example` | Documenta as variáveis exigidas — é como a segunda máquina se configura | 10 |
| `docs/ops/banco-producao.md` | Registro da inspeção do banco de produção | 1 |
| `CLAUDE.md` | Corrigir "PlanetScale" → Supabase | 10 |
| `.claude/skills/db/SKILL.md`, `.claude/skills/run/SKILL.md` | Corrigir Docker/MySQL → Supabase | 10 |

**Não serão tocados:** `lib/db.ts` (o singleton já está correto para pooler), os 18 arquivos que consomem `prisma.*`, `middleware.ts`, `auth.ts`. A migração MySQL→Postgres não altera nenhuma query — esse é o ponto da escolha.

---

## Tarefa 1: Inspecionar o banco de produção — BLOQUEANTE

> **Exige o dono.** As ferramentas Vercel do agente são somente leitura e não acessam variáveis de ambiente. Nenhuma tarefa posterior que toque produção pode começar antes desta.

**Files:**
- Create: `docs/ops/banco-producao.md`

**Interfaces:**
- Produz: a decisão `TEM_DADO_REAL` (sim/não), consumida pela Tarefa 8.

- [ ] **Passo 1: Descobrir para onde o `DATABASE_URL` de produção aponta hoje**

No painel: Vercel → projeto `seuconviteia` → Settings → Environment Variables → `DATABASE_URL` (escopo Production).

Alternativa por CLI, se o dono autorizar:

```bash
pnpm dlx vercel login
pnpm dlx vercel link --project seuconviteia
pnpm dlx vercel env pull .env.production.local --environment=production
```

Confirme que `.vercel/` e `.env.production.local` estão ignorados pelo git antes de continuar:

```bash
git check-ignore -v .vercel .env.production.local
```
Esperado: as duas linhas aparecem (estão ignoradas). Se alguma não aparecer, **pare** e adicione ao `.gitignore`.

- [ ] **Passo 2: Contar as linhas que importam**

Conecte no banco apontado pelo `DATABASE_URL` de produção e rode:

```sql
SELECT COUNT(*) AS profissionais FROM Professional;
SELECT COUNT(*) AS eventos       FROM Event;
SELECT COUNT(*) AS convidados    FROM Guest;
```

(Se o banco de produção for MySQL, os mesmos `COUNT(*)` valem.)

- [ ] **Passo 3: Registrar o achado**

Crie `docs/ops/banco-producao.md` com: para onde o `DATABASE_URL` apontava, as três contagens, a data, e a decisão.

Regra de decisão:

- **Zero profissionais** → `TEM_DADO_REAL = não`. A Tarefa 8 pode repontar direto.
- **Um ou mais profissionais que não sejam o `demo@seuconviteia.com`** → `TEM_DADO_REAL = sim`. A Tarefa 8 ganha um passo de dump/importação, e os 4 usuários dos logs de erro têm conta de verdade.

- [ ] **Passo 4: Commit**

```bash
git add docs/ops/banco-producao.md
git commit -m "docs(ops): inventário do banco de produção antes da migração"
```

---

## Tarefa 2: Consertar o `AUTH_SECRET` da produção

> Independente da Tarefa 1 e do banco. É o conserto do erro que 4 usuários já encontraram. Faça primeiro se houver qualquer chance de serem pessoas de fora.

**Files:** nenhum no repo. Alteração é na Vercel.

- [ ] **Passo 1: Gerar um segredo**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Esperado: uma string base64 de 44 caracteres. Não reutilize o valor do `.env.local` de desenvolvimento.

- [ ] **Passo 2: Definir na Vercel**

Settings → Environment Variables → Add:
- Nome: `AUTH_SECRET` · Valor: a string do Passo 1 · Ambientes: **Production, Preview, Development**

Confira, na mesma tela, se `CRON_SECRET` e `NEXT_PUBLIC_ROOT_DOMAIN` existem em Production. `NEXT_PUBLIC_ROOT_DOMAIN` deve ser o domínio público (hoje `seuconviteia.vercel.app`), nunca `localhost:3000`.

- [ ] **Passo 3: Redeploy**

Variável de ambiente nova só vale em deploy novo. Vercel → Deployments → o último deploy de produção → Redeploy.

- [ ] **Passo 4: Verificar que o erro parou**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://seuconviteia.vercel.app/entrar
```
Esperado: `200`.

Depois, confirme que não há **novas** ocorrências de `MissingSecret` (as antigas permanecem no histórico):
Vercel → Observability → Runtime Errors, filtrando a partir do horário do redeploy.
Esperado: nenhuma ocorrência nova de `MissingSecret` em `/entrar`, `/painel` ou `/api/auth/[...nextauth]`.

---

## Tarefa 3: Criar os projetos Supabase e capturar as conexões

> **Exige o dono** (criação de conta/projeto).

**Files:**
- Modify: `.env.local` (não versionado)

**Interfaces:**
- Produz: `DATABASE_URL` e `DIRECT_URL` dos projetos `dev` e `prod`, consumidos pelas Tarefas 5 e 8.

- [ ] **Passo 1: Criar dois projetos**

Nomes sugeridos: `seuconviteia-dev` e `seuconviteia-prod`. Região: a mais próxima do Brasil disponível.

Se o plano gratuito permitir apenas **um** projeto ativo (questão em aberto §8.2 do spec), crie só o `prod` e mantenha o desenvolvimento no Docker local — o `sc-mysql` continua de pé. Nesse caso, **pule para a Tarefa 4 usando o Docker**, e aplique a Tarefa 5 contra o `prod` apenas na Tarefa 8. Registre a escolha em `docs/ops/banco-producao.md`.

- [ ] **Passo 2: Copiar as duas strings de cada projeto**

Em Project Settings → Database → Connection string, pegue:
- **Transaction pooler** (porta `6543`) → vira `DATABASE_URL`
- **Direct connection** (porta `5432`) → vira `DIRECT_URL`

- [ ] **Passo 3: Escrever o `.env.local` apontando para o projeto dev**

```bash
DATABASE_URL="postgresql://postgres.<ref>:<senha>@<host>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:<senha>@db.<ref>.supabase.co:5432/postgres"
```

O sufixo `?pgbouncer=true&connection_limit=1` **não é opcional**: sem ele, o Prisma emite prepared statements que o pooler em modo transaction não suporta, e o erro aparece de forma intermitente só sob concorrência — o pior tipo de bug para diagnosticar depois.

`.env.local` tem precedência sobre `.env` no Next.js, então o `DATABASE_URL` do MySQL local que está no `.env` deixa de valer sem precisar ser apagado.

- [ ] **Passo 4: Provar que a conexão direta funciona da sua rede**

```bash
pnpm exec prisma db execute --url "$DIRECT_URL" --stdin <<< "SELECT 1;"
```
Esperado: sem erro.

Se falhar com erro de rede/DNS: a conexão direta do Supabase é IPv6-only em algumas regiões (questão em aberto §8.3). Use a string do **Session pooler** (porta `5432`, host `.pooler.supabase.com`) como `DIRECT_URL`. Registre qual funcionou.

---

## Tarefa 4: Migrar o `schema.prisma` para Postgres

**Files:**
- Modify: `prisma/schema.prisma:11-15`

**Interfaces:**
- Consome: `DATABASE_URL`/`DIRECT_URL` da Tarefa 3.
- Produz: schema válido em Postgres, consumido pela Tarefa 5.

- [ ] **Passo 1: Garantir que a rede de regressão está verde ANTES de mexer**

```bash
pnpm test
```
Esperado: 19 arquivos, todos passando. Se algo já estiver vermelho, pare e conserte antes — não misture.

- [ ] **Passo 2: Trocar o bloco `datasource`**

Substitua as linhas 11-15 de `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL") // pooler (runtime)
  directUrl = env("DIRECT_URL")   // conexao direta (migrations)
}
```

Apague também o comentário de cabeçalho do arquivo (linhas 1-9) que explica o `relationMode` do PlanetScale, e ponha no lugar:

```prisma
// SeuConvite IA — schema Prisma (Supabase / Postgres).
//
// Foreign keys e `onDelete: Cascade` sao REAIS, aplicados pelo banco.
// Os `@@index` nas colunas de FK sao obrigatorios: Postgres nao indexa
// coluna de FK automaticamente, apenas a chave primaria referenciada.
```

**Não toque em nenhum `model`.** Os `@@index`, os enums, `Json?`, `@db.Text` e `cuid()` migram sem alteração.

- [ ] **Passo 3: Validar o schema**

```bash
pnpm exec prisma validate
```
Esperado: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Passo 4: Regerar o client e checar tipos**

```bash
pnpm exec prisma generate && pnpm exec tsc --noEmit
```
Esperado: sem erros. Nenhuma das 52 chamadas `prisma.*` muda — se `tsc` reclamar, algo saiu do lugar.

- [ ] **Passo 5: Rede de regressão ainda verde**

```bash
pnpm test
```
Esperado: 19 arquivos passando.

- [ ] **Passo 6: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db)!: migra schema de MySQL/PlanetScale para Postgres/Supabase

Remove relationMode=\"prisma\": foreign keys e onDelete: Cascade passam a ser
aplicados pelo banco, nao emulados na aplicacao. Adiciona directUrl para as
migrations rodarem fora do pooler. Nenhum model alterado; nenhuma query muda."
```

---

## Tarefa 5: Primeira migration versionada

**Files:**
- Modify: `package.json` (bloco `scripts`)
- Create: `prisma/migrations/<timestamp>_init/migration.sql` (gerado)

**Interfaces:**
- Consome: schema da Tarefa 4.
- Produz: os scripts `db:migrate` e `db:deploy`, consumidos pela Tarefa 7.

- [ ] **Passo 1: Adicionar os scripts**

Em `package.json`, dentro de `"scripts"`, ao lado de `"db:push"`:

```json
"db:migrate": "prisma migrate dev",
"db:deploy": "prisma migrate deploy",
```

Mantenha `db:push` — ele ainda serve para prototipagem descartável.

- [ ] **Passo 2: Gerar a primeira migration contra o banco dev**

```bash
pnpm exec prisma migrate dev --name init
```
Esperado: cria `prisma/migrations/<timestamp>_init/migration.sql`, aplica no banco dev e imprime `Your database is now in sync with your schema.`

O banco dev do Supabase está vazio, então a migration nasce limpa. Se ele **não** estiver vazio, pare: você está apontando para o lugar errado.

- [ ] **Passo 3: Popular**

```bash
pnpm db:seed
```
Esperado:
```
Seed concluido:
  Professionals: 1
  Templates:     5
  Events:        1
  Guests:        2
  GiftItems:     4
  Recados:       4
  Evento demo:   maria-clara (Maria Clara)
```

- [ ] **Passo 4: Provar que as foreign keys agora são reais**

Esta é a verificação que justifica a tarefa inteira. As FKs não existiam no MySQL/PlanetScale.

```bash
pnpm exec prisma db execute --url "$DIRECT_URL" --stdin <<< "SELECT COUNT(*) AS fks FROM pg_constraint WHERE contype = 'f';"
```
Esperado: **7**. São elas: `Event→Professional`, `Event→Template`, e `Guest`, `GiftItem`, `Photo`, `Recado`, `Transaction`, todas → `Event`.

Se vier `0`, o `relationMode` não foi removido de fato.

- [ ] **Passo 5: Conferir uma mudança de comportamento que as FKs reais introduzem**

`Event.templateId` é uma relação opcional sem `onDelete` declarado. Com FK real, o padrão do Prisma passa a impedir a exclusão de um `Template` que ainda tenha eventos — antes, isso passava batido e deixava órfão.

```bash
pnpm exec prisma db execute --url "$DIRECT_URL" --stdin <<< "SELECT confdeltype FROM pg_constraint WHERE conname LIKE '%templateId%';"
```
Esperado: `r` (RESTRICT). Isso é o comportamento desejado. Nenhum código do painel exclui `Template`, então nada quebra — mas fica registrado.

- [ ] **Passo 6: Commit**

```bash
git add package.json prisma/migrations
git commit -m "feat(db): adota prisma migrate versionado + primeira migration

Substitui o db push por migrations com historico no git. Banco central
compartilhado entre maquinas nao tolera db push concorrente: dois schemas
divergentes se sobrescrevem sem registro."
```

---

## Tarefa 6: Provar que a máquina não é mais dependência

> Esta tarefa não escreve código. Ela existe porque é a única prova direta do pedido original do dono: "sem precisar ficar com minha máquina ligada".

**Files:** nenhum.

- [ ] **Passo 1: Desligar o MySQL local**

```bash
docker stop sc-mysql
docker ps --filter name=sc-mysql --format "{{.Names}} {{.Status}}"
```
Esperado: nenhuma linha (o container não está rodando).

- [ ] **Passo 2: Subir o dev server**

```bash
rm -f dev.log && (pnpm dev > dev.log 2>&1 &) && until grep -qE "Ready in|Error" dev.log; do sleep 1; done && tail -3 dev.log
```
Esperado: `✓ Ready in ...`

- [ ] **Passo 3: Exercitar o caminho que depende do banco**

```bash
for p in / /entrar /painel; do
  echo "$p -> $(curl -s -o /dev/null -w '%{http_code}' -L --max-time 25 http://localhost:3000$p)"
done
grep -iE "ECONNREFUSED|PrismaClientInitializationError|Can't reach database" dev.log || echo "sem erro de banco"
```
Esperado: `200` nas três rotas e `sem erro de banco`.

- [ ] **Passo 4: Login de verdade, no navegador**

Abra `http://localhost:3000/entrar`, entre com `demo@seuconviteia.com` / `demo12345` e confirme que `/painel` lista o evento `maria-clara`.

Com o Docker parado, isso só é possível se o app estiver lendo o Supabase. **É a prova.**

---

## Tarefa 7: Fazer o build de produção aplicar as migrations

**Files:**
- Modify: `package.json` (script `build`)

**Interfaces:**
- Consome: `db:deploy` da Tarefa 5.

- [ ] **Passo 1: Alterar o script de build**

```json
"build": "prisma migrate deploy && next build",
```

`migrate deploy` só aplica migrations já existentes — nunca gera nova nem pede confirmação, e por isso é seguro em CI. Ele usa a `DIRECT_URL`, que precisa existir nas variáveis da Vercel (Tarefa 8).

- [ ] **Passo 2: Verificar localmente que o build não quebrou**

```bash
pnpm build
```
Esperado: `migrate deploy` reporta `No pending migrations to apply.` (elas já foram aplicadas na Tarefa 5) e o `next build` conclui.

- [ ] **Passo 3: Commit**

```bash
git add package.json
git commit -m "chore(build): aplica migrations pendentes no build da Vercel"
```

---

## Tarefa 8: Repontar a produção para o Supabase

> **Bloqueada pela Tarefa 1.** Não comece sem `docs/ops/banco-producao.md` preenchido.

**Files:** nenhum no repo.

**Interfaces:**
- Consome: `TEM_DADO_REAL` (Tarefa 1), conexões do projeto `prod` (Tarefa 3).

- [ ] **Passo 1: Se `TEM_DADO_REAL = sim`, migrar os dados primeiro**

Exporte do banco antigo, converta e importe no `prod` do Supabase **antes** de trocar qualquer variável. Como o banco antigo é MySQL e o novo é Postgres, um `mysqldump` não importa direto: os tipos e o dialeto divergem. Use `pgloader`, ou exporte tabela a tabela em CSV e importe com `\copy`, na ordem `Professional → Template → Event → (Guest, GiftItem, Photo, Recado, Transaction)`, que respeita as FKs novas.

Valide comparando as três contagens do Passo 2 da Tarefa 1 nos dois bancos. Só siga quando baterem.

Se `TEM_DADO_REAL = não`, pule para o Passo 2.

- [ ] **Passo 2: Definir as variáveis de produção na Vercel**

Settings → Environment Variables, escopo **Production**:
- `DATABASE_URL` → pooler do projeto **prod** (`:6543`, com `?pgbouncer=true&connection_limit=1`)
- `DIRECT_URL` → conexão direta do projeto **prod** (`:5432`)

Confira que o `DATABASE_URL` de produção **não** é o do projeto dev. É o erro que apaga dado real com o próximo `db:seed`.

- [ ] **Passo 3: Redeploy e observar o build**

O build agora roda `prisma migrate deploy` contra o `prod` vazio, o que cria as 8 tabelas.

Vercel → Deployments → Redeploy. Acompanhe o log do build.
Esperado: `Applying migration '<timestamp>_init'` seguido de build concluído.

- [ ] **Passo 4: Verificar produção**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://seuconviteia.vercel.app/entrar
```
Esperado: `200`.

Runtime Errors da Vercel, a partir do horário do redeploy: nenhum `PrismaClientInitializationError`, nenhum `MissingSecret`.

- [ ] **Passo 5: Criar uma conta real pelo `/cadastrar` em produção**

É o teste ponta a ponta: escreve no banco novo, passa pelo Auth.js, e cai no `/painel`. Se `TEM_DADO_REAL = não`, esta é a primeira conta legítima do sistema.

- [ ] **Passo 6: Exercitar o cron, que nunca foi verificado**

`vercel.json` agenda `/api/cron/expirar` diariamente às 06:00 UTC, protegido por `CRON_SECRET`. Ele marca eventos vencidos como `EXPIRED`. Como a produção estava quebrada, ele nunca rodou com sucesso contra um banco são.

Não espere até amanhã de manhã — dispare à mão:

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://seuconviteia.vercel.app/api/cron/expirar
```
Esperado: `200`. Um `401` significa que o `CRON_SECRET` da Vercel diverge do que você mandou; um `500` aparece nos Runtime Errors com a causa.

---

## Tarefa 9: Promover a landing aprovada para produção

> Muda o que o público vê. **Exige "pode subir" do dono antes do merge.**

**Files:** nenhum. Operação de git/Vercel.

- [ ] **Passo 1: Mostrar ao dono o que está no ar hoje versus o que vai subir**

Produção atual: `https://seuconviteia.vercel.app` (código de 2026-07-03, anterior ao rebrand).
Preview aprovado: o deploy da branch `reset-mvp-convites` (commit `d393a9e`).

Abra os dois lado a lado. Só siga com o "pode subir" explícito.

- [ ] **Passo 2: Merge do PR #1**

```bash
gh pr merge 1 --squash
```

- [ ] **Passo 3: Confirmar que a produção serve a landing amarela**

```bash
curl -s https://seuconviteia.vercel.app | grep -oE "#F5FF63|seuconvite" | sort -u | head
```
Esperado: aparece `#F5FF63` (o acento amarelo do rebrand). Se não aparecer, o deploy de produção não pegou o commit novo.

Confirme visualmente no navegador — o dono decide vendo.

---

## Tarefa 10: Alinhar a documentação ao que passou a ser verdade

> O `CLAUDE.md` e duas skills descrevem uma stack que deixou de existir. Documentação errada é pior que documentação ausente: ela mente com autoridade para o próximo agente.

**Files:**
- Create: `.env.example`
- Modify: `CLAUDE.md`
- Modify: `.claude/skills/db/SKILL.md`, `.claude/skills/run/SKILL.md`

- [ ] **Passo 1: Criar o `.env.example`**

É assim que a segunda máquina do dono se configura sem adivinhar.

```bash
# Banco — Supabase Postgres. Ver docs/superpowers/specs/2026-07-09-producao-de-pe-design.md
# DATABASE_URL: pooler (porta 6543). O sufixo pgbouncer=true NAO e opcional.
DATABASE_URL="postgresql://postgres.<ref>:<senha>@<host>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
# DIRECT_URL: conexao direta (porta 5432). Usada so por prisma migrate.
DIRECT_URL="postgresql://postgres:<senha>@db.<ref>.supabase.co:5432/postgres"

# Auth.js — gere com: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
AUTH_SECRET=""

# Protege /api/cron/expirar
CRON_SECRET=""

# localhost:3000 em dev; o dominio publico em producao
NEXT_PUBLIC_ROOT_DOMAIN="localhost:3000"
```

- [ ] **Passo 2: Corrigir o `CLAUDE.md`**

Localize a linha da stack, que hoje diz:

```
Tailwind v4, Prisma + PlanetScale (MySQL, `relationMode="prisma"`), Auth.js,
```

Substitua por:

```
Tailwind v4, Prisma + Supabase (Postgres, FKs reais), Auth.js,
```

Na lista de skills, a descrição da skill **db** menciona "MySQL/PlanetScale" e a da skill **run** menciona "banco Docker `sc-mysql`". Atualize ambas para Supabase.

- [ ] **Passo 3: Corrigir as duas skills**

Em `.claude/skills/db/SKILL.md`: trocar toda referência a PlanetScale/MySQL/`relationMode` por Supabase/Postgres/FKs reais. Documentar `db:migrate` e `db:deploy`, e que `db push` deixou de ser o caminho padrão.

Em `.claude/skills/run/SKILL.md`: o banco não é mais o container `sc-mysql`. Documentar que o `.env.local` aponta para o Supabase dev e que **não é preciso Docker para rodar o projeto**.

- [ ] **Passo 4: Verificar que nenhuma referência órfã sobrou**

```bash
grep -rniE "planetscale|relationMode|sc-mysql" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=docs/superpowers .
```
Esperado: nenhuma saída. (Os specs e planos em `docs/superpowers/` são registro histórico e devem manter as menções.)

- [ ] **Passo 5: Commit**

```bash
git add .env.example CLAUDE.md .claude/skills/db/SKILL.md .claude/skills/run/SKILL.md
git commit -m "docs: alinha stack documentada ao Supabase/Postgres + .env.example"
```

---

## Tarefa 11: Investigar os deploys `BLOCKED`

> **Exige o dono.** Fica por último porque não bloqueia nada — mas deploys barrados silenciosamente vão morder na próxima entrega.

- [ ] **Passo 1: Constatar o sintoma**

Vários deploys do projeto estão em estado `BLOCKED` e **não possuem nenhum evento de build** — foram barrados antes de compilar. Não é falha de código.

- [ ] **Passo 2: Checar as causas prováveis, nesta ordem**

1. Settings → Deployment Protection
2. Settings → Spend Management / limites de uso da conta
3. Settings → Git → se a branch está autorizada a deployar

- [ ] **Passo 3: Registrar a causa em `docs/ops/banco-producao.md`** (ou em um `docs/ops/vercel.md` novo, se preferir separar), para o próximo agente não reinvestigar.

---

## Fora deste plano

Na ordem sugerida, cada um com seu próprio ciclo de spec → plano:

1. **Cache do site de evento** (`revalidateTag`) — as 9 rotas de `app/%5Fsites/[sub]/` são `force-dynamic` e `carregarEventoFesta` (`lib/eventoFesta.ts:168`) usa `cache()` do React, que só memoiza por requisição. É o item que de fato determina escala, muito mais que a escolha do banco.
2. Domínio próprio + Cloudflare DNS + wildcard `*.seuconviteia.com`.
3. Pagamento (Mercado Pago) — **não está instalado** no `package.json`, apesar de citado no `CLAUDE.md`.
4. E-mail (Resend) — idem.
5. Observabilidade (Sentry, PostHog).

Cortados por decisão registrada no spec: Clerk, Firebase/Firestore, Pinecone.
