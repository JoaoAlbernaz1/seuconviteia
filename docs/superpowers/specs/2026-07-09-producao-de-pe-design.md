# Colocar a produção de pé — design

**Data:** 2026-07-09
**Repo:** `JoaoAlbernaz1/seuconviteia` · branch `reset-mvp-convites` · HEAD `d393a9e`
**Status:** aguardando revisão do dono

---

## 1. Por que este spec existe

O pedido original foi "migrar o banco pro Supabase, quero tudo num lugar só, sem
depender da minha máquina ligada". Ao investigar, o problema real mostrou-se maior
e diferente: **a produção já existe, está no ar e está quebrada.**

### Estado verificado (não suposto)

Banco, local:

- O container `sc-mysql` do PC antigo não veio junto (containers Docker não
  sincronizam entre máquinas). Recriado hoje neste PC: MySQL 8.0, `root:root`,
  base `seuconviteia`, batendo com o `.env` existente.
- O projeto **não tem `prisma/migrations`** — usa `pnpm db:push`.
- `pnpm db:push` criou 8 tabelas; `pnpm db:seed` populou. Login demo:
  `demo@seuconviteia.com` / `demo12345`. Rotas: `/entrar`, `/cadastrar`, `/painel`.
- Dev server sobe limpo, sem erro de Prisma.

Produção, na Vercel (time `team_mLR5jfDgyZ9mRs4n8nFV3VCq`, projeto
`prj_5yMUwkgAzF4JN44lwOFhNw7R8Xo8`):

- **Existem 18 deploys.** O projeto está publicado em `seuconviteia.vercel.app`,
  via integração com o GitHub. Não há `.vercel/` no repo porque nunca foi linkado
  pelo CLI — a ausência dessa pasta não significa ausência de deploy.
- **A produção lança exceção.** `AUTH_SECRET` não está definido nas variáveis de
  ambiente. Erro `[auth][error] MissingSecret` nas rotas `/entrar`, `/painel` e
  `/api/auth/[...nextauth]`. **8 ocorrências, 4 usuários distintos**, a última em
  `2026-07-04T00:16:31Z`.
- **A produção serve código velho.** O último deploy de produção saudável é de
  2026-07-03. O commit `d393a9e` (landing amarela `seuconvite.ia`, aprovada pelo
  dono) existe apenas como **deploy de preview** da branch `reset-mvp-convites`
  (PR #1). Quem abre a produção hoje não vê a landing aprovada.
- **Vários deploys estão em estado `BLOCKED`** e não possuem nenhum evento de
  build — foram barrados antes de compilar. Não é falha de código; é um gate de
  conta/projeto.
- Não há domínio próprio. Apenas os `*.vercel.app`.
- O dono tem Vercel Pro (US$20/mês), já contratado.

Consequência: **"colocar tráfego no site" hoje mandaria gente paga para uma landing
desatualizada cujo login estoura.** O gargalo nunca foi o banco.

---

## 2. Objetivo

Uma produção que funciona sozinha, sem a máquina do dono ligada:

1. Autenticação funcionando em produção.
2. Banco na nuvem, compartilhado entre as duas máquinas de desenvolvimento,
   e **separado** do banco de produção.
3. A landing aprovada no ar.

---

## 3. Não-objetivos

Cortes deliberados, para não gastar o MVP montando infraestrutura:

| Item | Decisão | Motivo |
|---|---|---|
| Clerk | **Cortado** | Auth.js v5 já funciona. Supabase já traz auth incluso. Seria um terceiro provedor de auth. |
| Firebase / Firestore | **Cortado** | NoSQL documental, sem `JOIN`, sem suporte do Prisma. Reescrita de 18 arquivos e ~52 queries para chegar no mesmo lugar. |
| Pinecone | **Cortado** | Banco vetorial. Nenhum caso de uso no produto. |
| PostHog, Sentry | **Adiado** | Não bloqueiam nada. ~30 min cada, depois que a produção estiver de pé. |
| Domínio próprio + Cloudflare DNS | **Adiado** | Fase seguinte. Exige wildcard `*.seuconviteia.com` para os subdomínios de evento. |
| Mercado Pago, Resend, Vercel Blob | **Adiado** | Declarados no `CLAUDE.md` como stack pretendida; **não estão instalados** no `package.json`. São fases futuras. |
| Cache do site de evento | **Adiado, mas registrado** | Ver §9. É o item que de fato determina escala. |

---

## 4. A regra que sustenta o objetivo

> **Supabase é usado como hospedagem de Postgres pura.**
> Apenas o Prisma fala com o banco. Sem `supabase-js` no código da aplicação,
> sem RLS como regra de negócio, sem Realtime, sem o Auth do Supabase.

Essa regra é o que compra a promessa de "não trocar de banco lá na frente". Com ela,
todo o caminho de crescimento não toca em uma linha de código:

- Free → Pro: nada muda.
- Pro → instância maior, réplica de leitura: nada muda.
- Supabase → Neon, RDS, Cockroach: muda o `DATABASE_URL`.

Sem ela, cada recurso proprietário adotado é um prego a mais no caixão da
portabilidade. A promessa não é "este banco aguenta tudo"; é "trocar de banco custa
uma variável de ambiente".

---

## 5. Componentes

### 5.1 Banco — dois projetos Supabase

Um projeto **dev**, compartilhado pelas duas máquinas. Um projeto **prod**, que só a
Vercel enxerga.

Não é preferência de estilo: já existem usuários reais tocando a produção. Se dev e
prod forem o mesmo banco, o primeiro `pnpm db:seed` num PC novo reescreve dados de
gente de verdade. O seed é a primeira coisa que se roda em qualquer máquina nova.

### 5.2 Schema — `prisma/schema.prisma`

```prisma
datasource db {
  provider  = "postgresql"        // era "mysql"
  url       = env("DATABASE_URL") // pooler (runtime)
  directUrl = env("DIRECT_URL")   // conexão direta (migrations)
  // relationMode = "prisma"      // REMOVIDO
}
```

Removendo `relationMode`, as 8 tabelas ganham foreign keys reais e o
`onDelete: Cascade` passa a ser aplicado pelo banco. Hoje ele é emulado pelo Prisma
na aplicação — um `DELETE` fora do Prisma (script, SQL editor) deixa órfãos
silenciosos. Deixa de ser possível.

Os `@@index` nas colunas de FK **permanecem**. Postgres não indexa colunas de FK
automaticamente — apenas a chave primária referenciada.

Tipos migram sem intervenção: `Json?` → `jsonb`, `@db.Text` → `text`, os 5 enums →
enums nativos, `cuid()` → `text`. Nenhum modelo muda.

### 5.3 Migrations — adotar `prisma migrate`

Hoje o projeto usa `db push`, que sincroniza por força bruta e não guarda histórico.
Aceitável num banco local descartável; perigoso num banco central compartilhado —
`db push` de duas máquinas com schemas diferentes sobrescreve sem registro.

Adotar `prisma migrate` com as migrations versionadas no git. O momento é agora, com
o banco dev vazio: a primeira migration nasce limpa.

Exige um script novo no `package.json` — hoje existem apenas `db:push`, `db:seed`,
`db:studio` e `db:generate`. Acrescentar `"db:migrate": "prisma migrate dev"` e
`"db:deploy": "prisma migrate deploy"` (este último para o build de produção).

### 5.4 Conexões — por que são duas

- **`DATABASE_URL` → pooler, modo transaction (porta 6543).** Usada em runtime. Cada
  função serverless pega uma conexão emprestada e devolve ao fim da transação, em vez
  de abrir conexão nova no Postgres. Sufixo obrigatório:
  `?pgbouncer=true&connection_limit=1`. O `pgbouncer=true` desliga *prepared
  statements* no Prisma, que o modo transaction não suporta; sem ele, surgem erros
  intermitentes de "prepared statement já existe" sob concorrência.
- **`DIRECT_URL` → conexão direta (porta 5432).** Usada apenas pelo `prisma migrate`,
  que precisa de sessão persistente. Nunca serve requisição.

**Este é o modo de falha real sob tráfego**, e não a CPU do banco: serverless abre
uma conexão por invocação; um Postgres aceita da ordem de dezenas a ~100 conexões
simultâneas. Sem pooler, algumas dezenas de visitantes simultâneos derrubam o banco
por esgotamento de conexão, muito antes de qualquer limite de processamento.

### 5.5 Variáveis de ambiente

| Variável | Dev (`.env.local`) | Prod (Vercel) |
|---|---|---|
| `DATABASE_URL` | pooler do projeto **dev** | pooler do projeto **prod** |
| `DIRECT_URL` | direta do projeto **dev** | direta do projeto **prod** |
| `AUTH_SECRET` | qualquer valor local | **ausente hoje — causa raiz da quebra** |
| `CRON_SECRET` | qualquer valor local | conferir |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `localhost:3000` | conferir |

### 5.6 Deploy

Depois de env vars e banco corretos, promover `reset-mvp-convites` para produção, para
que o que está no ar seja a landing aprovada (`d393a9e`).

### 5.7 Docker local

Deixa de ser necessário assim que o projeto dev do Supabase existir. Manter o
container parado, como recurso de trabalho offline e como plano B da questão em
aberto §8.2 (se o plano gratuito do Supabase não permitir dois projetos, o dev
volta para o Docker e só a produção sobe para a nuvem). Nenhuma dessas opções
afeta o código: muda apenas o `DATABASE_URL` do `.env.local`.

---

## 6. Risco bloqueante — dados de produção

**Antes de repontar o `DATABASE_URL` de produção, é obrigatório inspecionar o banco
de produção atual.**

A afirmação "só tem dado de seed" foi dada pelo dono a respeito do **Mac**. Ela não
vale para a produção: os logs mostram 4 usuários distintos tentando autenticar. Se
existirem contas `Professional` reais, repontar o `DATABASE_URL` as torna
inacessíveis silenciosamente — a aplicação sobe, o banco novo está vazio, e ninguém
consegue mais entrar.

Procedimento:

1. Ler o `DATABASE_URL` atual da produção no painel da Vercel (para onde ele aponta
   hoje é desconhecido).
2. Contar linhas em `Professional` e `Event`.
3. Se houver dado real: `mysqldump`, conversão MySQL → Postgres, e importação no
   projeto prod do Supabase antes do corte.
4. Só então trocar a variável.

Nada de irreversível acontece em produção antes deste passo.

---

## 7. Verificação

Como saberemos que funcionou, em ordem:

1. `pnpm db:migrate` (script novo, §5.3) aplica a primeira migration no projeto dev do
   Supabase; `pnpm db:seed` popula.
2. Com o dev server local apontando para o Supabase dev, é possível entrar no
   `/painel` com o login demo. O Docker fica desligado durante o teste — essa é a
   prova de que a máquina não é mais dependência.
3. A produção deixa de emitir `MissingSecret` (verificável via erros de runtime).
4. `seuconviteia.vercel.app` serve a landing amarela.
5. O login de produção funciona com um usuário de teste.
6. O cron `/api/cron/expirar` (`vercel.json`, diário às 06:00) executa sem erro.

---

## 8. Questões em aberto

1. **Os 4 usuários com erro de login são o dono testando, ou pessoas de fora?**
   Se forem pessoas de fora, o conserto das env vars precede a migração.
2. Quantos projetos ativos o plano gratuito do Supabase permite hoje. Se for apenas
   um, prod entra no plano pago (~US$25/mês) ou dev continua no Docker.
3. A conexão direta do Supabase é IPv6-only em algumas regiões, com *session pooler*
   IPv4 como alternativa. Confirmar qual funciona da máquina do dono — é onde
   migrações costumam travar.
4. Causa dos deploys `BLOCKED`. Exige acesso ao painel da Vercel.
5. Domínio wildcard `*.seuconviteia.com` para os subdomínios de evento: confirmar
   requisitos de plano quando o domínio entrar.

As ferramentas Vercel disponíveis ao agente são somente de leitura: listam projetos,
deploys, logs e erros, mas **não leem nem gravam variáveis de ambiente**. Itens 1, 2 e
4 exigem o dono, ou autorização para usar o CLI da Vercel com token.

---

## 9. Depois deste spec — o que de fato determina escala

As 9 rotas do site público de evento (`app/%5Fsites/[sub]/`) são `force-dynamic`. O
carregador `carregarEventoFesta` (`lib/eventoFesta.ts:168`) está embrulhado em
`cache()` do React, que memoiza **dentro de uma requisição só**, não entre
requisições. Cada convidado que abre um convite dispara uma query no banco e acorda
uma função serverless.

Um convite que cai num grupo de WhatsApp com 50 mil pessoas gera 50 mil queries e 50
mil invocações, para servir uma página que não muda desde a última edição do
profissional. Cachear com revalidação por tag — disparando `revalidateTag` no save do
painel (`app/(dashboard)/actions.ts`) — reduz isso a aproximadamente zero queries,
servidas do CDN.

**Este item importa mais para escala do que a escolha do banco.** Com ele no lugar, a
carga sobre o Postgres passa a ser apenas escrita (RSVP, recados) e uso do painel —
ordem de unidades de operações por segundo mesmo num cenário de grande sucesso. Sem
ele, nenhum banco do mercado resolve o problema, porque o problema não é o banco.

Rotas com escrita ou tempo real (`confirmar`, `recados`, `agenda`) precisam de
tratamento à parte e não devem ser cacheadas cegamente.

Ordem sugerida depois daqui: cache do site de evento → domínio + DNS → pagamento
(Mercado Pago) → e-mail (Resend) → observabilidade (Sentry, PostHog).
