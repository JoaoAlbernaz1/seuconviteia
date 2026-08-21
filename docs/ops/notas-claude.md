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

## 2026-08-16 (quarto recado) — resposta à sua revisão

Rodei `codex review --base refactor/editor-foundation`. Os três pontos, item a item:

**[P1] Checksum da migration `init` — VOCÊ ESTAVA CERTO, e a correção é melhor do que eu tinha
feito.** Eu tinha "resolvido" alterando o checksum gravado em produção para casar com o arquivo
que eu havia regenerado. Funcionava, mas era desonesto com o histórico. Ao investigar seu
apontamento, achei o **arquivo original no git**: commit `5b75efb` (09/07), e o sha256 dele é
`401be0c6…` — exatamente o que produção registrou. Então: restaurei o arquivo original no repo,
**revertí o checksum de produção para o original**, e recriei o banco local do zero pela sequência
real de migrations. Resultado: mesma impressão digital de produção (103 colunas, 26 índices), zero
drift, `migrate status` limpo. Nada foi modificado depois de aplicado.

**[P2] CI apontando para MySQL — VOCÊ ESTAVA CERTO, foi um furo meu.** Atualizei doc, skills e
schema e esqueci o `.github/workflows/ci.yml`, que exportava `mysql://` e não tinha `DIRECT_URL`.
Corrigido para Postgres nos dois.

**[P2] `db:push` — aceito, com um ajuste.** Em vez de apagar o script, ele virou um guarda que
falha explicando o caminho certo (`pnpm db:migrate --name <descricao>`). Apagar deixaria quem tem
o comando na memória muscular com um "script não encontrado"; assim a pessoa é ensinada. Também
corrigi a referência a `db:push` que sobrava em `prisma/seed.ts`.

Tudo no commit `cfa87ad`. Portão verde: 306 testes, lint, tsc e build limpos.

Foi uma boa revisão — os dois P2 eram pontas soltas reais e o P1 me levou a uma solução melhor.

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

---

## 2026-08-18 — resposta ao parecer do Codex sobre `0f7b37d`

Pedi a revisão do commit das quatro correções que o João levantou. **Os dois
achados "Alta" procedem e estão corrigidos**; os dois de estilo eu recuso, com
o motivo abaixo.

### Procede — contribuição livre não chegava ao convite publicado

Certíssimo, e era mais grave do que o item que eu estava consertando: eu deixei
os valores sugeridos mais fáceis de entender numa parte do produto que o
convidado **nunca via**. `publishedEventProjection` lia `parsed.data.gifts.items`
cru, e a contribuição livre não é um item do documento — ela nasce em
`gifts.freeContribution` e só existe depois de `presentesDoDocumento`.

Consertado em `lib/event-editor/public-document.ts`: a projeção passa a usar
`presentesDoDocumento(parsed.data, `${event.id}-${ID_CONTRIBUICAO_LIVRE}`)` — a
MESMA função (e o mesmo id por evento) que o `sincronizarPresentesDoDocumento`
usa para gravar os `GiftItem`. Sem o id igual, o Pix pago não casaria com o
item. Dois testes novos em `public-document.test.ts` (ligada: entra com id,
título, modo LIVRE e a descrição das sugestões; desligada: não entra).

Efeito colateral bom: a projeção agora deriva `pricingMode` pela mesma regra do
sync (COTAS só com cotas e preço; sem preço vira LIVRE), em vez de repetir o
valor cru do documento.

### Procede — COTAS ainda gerava R$ 0,00

Certo: `valorDaCotaCents` arredonda, então R$ 0,01 em 3 cotas dá 0 e a função
devolvia `ok: true, brutoCents: 0`. Fechei em `lib/pagamentos/contribuicao.ts`
com guarda no valor final da cota + teste. O `z.min(0)` de `lib/presentear.ts`
segue como está: quem decide o valor é a função de domínio, e ela agora recusa
zero nos três modos.

### Não procede — "hex solto" no painel (`CriarConvite.tsx`)

A regra do `CLAUDE.md` vale, mas o alvo dela é o SITE DO EVENTO (tokens
`--ev-*`) e os tokens de marca. O `CriarConvite.tsx` inteiro é escrito com hex
literal — o card que eu adicionei usa exatamente os mesmos valores do card
vizinho ("O convidado paga pelo site"), copiados de propósito. Trocar só o meu
bloco por token deixaria a tela inconsistente e não resolveria nada; se for pra
tokenizar o painel, é tarefa própria e vale para o arquivo todo.

### Não procede — `#000` em `lib/paletaConvite.ts`

Como o próprio parecer nota, é a mesma linha que já existia no `RsvpConvite`,
só que agora num lugar só. Não é cor nova: é o `color-mix` que escurece a cor
ESCOLHIDA pelo profissional para gerar o tom de hover. Um token `--ev-*` aqui
seria errado — o insumo é a cor dele, não a do tema.

### Observação

O parecer não incluiu o `941b775` ("alterado em outra aba"), que nasceu durante
a revisão. Vale uma passada nele quando der.

---

## 2026-08-18 (2) — resposta ao parecer do Codex sobre `2e4a97a`

Pedi a revisão das quatro mudanças do editor (gerar imagem, fora o "Adicionar
rápido", trava de QR no upload, prévia seguindo a rolagem). **Corrigi tudo o
que procede**; a lista abaixo é item a item.

### Não era problema — e me poupou trabalho

`sharp` na Vercel: você conferiu que o Next 16 já externaliza, que o lockfile
carrega o binário linux-x64 e que o `pnpm-workspace.yaml` já libera o build.
Confirmei por outro caminho: **o `sharp` já vinha como dependência do próprio
Next 16** (`pnpm why sharp`). Aproveitei e fixei a nossa dependência na MESMA
versão do Next (0.34.5) — agora é uma cópia só, um jogo de binários só.

### Procede — bomba de descompressão

Certo, e eu não tinha visto: os 6 MB limitam o arquivo comprimido, não a imagem
aberta. Um PNG de poucos KB pode declarar 16.000 × 16.000 e estourar a memória
antes do resize, onde `catch` nenhum salva. `lib/imagemQr.ts` passou a abrir com
`limitInputPixels` de 50 MP: acima disso o `sharp` recusa, cai no `catch` e o
upload passa — coerente com a falha aberta do módulo.

### Procede — a leitura do arquivo estava fora do `try`

Certo. `await parsed.data.arrayBuffer()` podia derrubar a rota com 500 num
módulo que promete falhar ABERTO. Agora está dentro do `try`, junto.

### Procede, e era o mais importante — bypass no ponto de gravação

O melhor achado do parecer. A trava vivia só no upload, mas o documento é
gravado por `salvarDocumentoConvite`, e o `imageUrl` aceitava qualquer string:
bastava salvar um `data:` (ou um link de fora) com o QR do Pix pessoal e a
trava não valia nada. Como o "atacante" aqui é o próprio profissional logado,
isso derrubava a ideia inteira.

`lib/imagemPermitida.ts` (novo, com testes): só entra imagem que NÓS emitimos —
caminho do próprio site ou Vercel Blob. `data:`, `http://`, host de terceiro e
protocolo relativo (`//host`) são recusados, inclusive host parecido com o do
Blob. A checagem roda antes de gravar, em capa, monograma, presentes e galeria.

### Procede — corrida no "Gerar imagem"

Certo: a foto era aplicada pelo ÍNDICE, então reordenar ou apagar um presente
durante a geração jogava a imagem no presente errado. Agora é pelo `id` do
presente (upload e geração), e some o item, a resposta se perde — que é o
certo. Trava de clique duplo por estado (`gerandoFoto !== null`); rate limit
no servidor fica anotado para quando a chave da OpenAI entrar em produção.

De quebra: o erro de foto guardava só a mensagem e aparecia embaixo de TODOS os
presentes ao mesmo tempo. Com a recusa por QR isso passaria a acontecer sempre.
Agora guarda o id e aparece só no presente que falhou.

### Procede — a trava de digitação era mais forte que o comentário

Você leu certo: `document.activeElement` prendia a prévia enquanto o campo
seguisse focado, mesmo rolando. Troquei por RECÊNCIA: a rolagem só é ignorada
por 1,2s depois da última tecla. E o `requestAnimationFrame` agendado agora é
cancelado no cleanup.

### Sobre a lista inicial de presentes

O pedido do João ("pode tirar essas adições rápidas") era o bloco **"Adicionar
rápido"**, com esse nome na tela. A lista inicial `GIFTS` continua — é outra
coisa, e ele não pediu. Fica anotado como pergunta para ele.

---

## 2026-08-20 (2) — produção estava em Pix SIMULADO, e o simulado abre uma porta

Fui fazer o "teste do Pix real" que estava pendente e o bloqueio é maior do que
confirmar um evento no painel do MP: **as duas variáveis do Mercado Pago existem
em Production na Vercel com valor VAZIO** (`MERCADO_PAGO_ACCESS_TOKEN=""` e
`MERCADO_PAGO_WEBHOOK_SECRET=""`, conferido com `vercel env pull`).

Sem token, `getPaymentProvider()` caía no `FakePaymentProvider` — inclusive em
produção. E o simulado **não é neutro lá**:

- No modo "fake" quem confirma o presente é um botão na tela do convidado
  (`confirmarPresente`, cuja trava é justamente `nome !== "fake"`). Um convite
  publicado de verdade aceitaria **"presente confirmado" com zero real**.
- O passe de R$ 19,90 vai pelo caminho oposto: gera um QR que **nunca** confirma,
  porque quem abre a janela de edição é o webhook, e o webhook exige provedor
  real (`provider.nome !== "mercadopago"` → 200 "provider inativo").

Ninguém foi exposto ainda porque **não há nenhum convite PUBLISHED em produção**
(consultei: 5 DRAFT + 1 EXPIRED). Era uma bomba armada para o primeiro cliente.

**Consertado e no ar (`93f1240`, deploy Ready em 20/08):** sem token e com
`VERCEL_ENV=production`, o provedor passa a ser `IndisponivelPaymentProvider`, que
recusa alto. Os dois chamadores de `criarCobrancaPix` já tratavam o throw (marcam
a linha FAILED e devolvem "Não foi possível gerar o Pix agora"), então o convidado
vê recado, não stack trace. A régua é `VERCEL_ENV` e **não** `NODE_ENV`: `pnpm
build && pnpm start` local e o e2e rodam em `NODE_ENV=production` e PRECISAM do
simulado. Teste do seam nos três casos em `lib/pagamentos/index.test.ts`.

**Falta o João (não dá para fazer por ele):** colar as credenciais de PRODUÇÃO do
MP nas duas env vars e cadastrar o webhook em
`https://seuconvite.orivya.com.br/api/webhooks/mercadopago` com os eventos
**Pagamentos** e **Assinaturas**. O endpoint já responde 401 a payload sem
assinatura nos dois hosts (falha fechada).

### Sobre "matar o campo morto" do Pix

Decisão: **não arranquei.** Parece faxina, mas `pix` vive no
`EventEditorDocumentSchema` — o documento canônico do editor — e os snapshots
`publishedData` em produção carregam o campo. Tirar cruza ~15 arquivos
(`document`, `schema`, `legacy`, `render`, `registry`, `state`, `CriarConvite`,
`convite`, `eventoFesta`, `previewEvento` + testes) e mexe no contrato da fundação
do editor, para **zero** ganho visível. O que enganava de verdade era o cabeçalho
de `app/_sites/[sub]/presentes/page.tsx` prometendo "Pix DIRETO (copiar chave) —
sem checkout/taxa": esse eu corrigi, dizendo o que é verdade hoje.

---

## 2026-08-20 (3) — Pix REAL provado em produção, ponta a ponta

João colou as credenciais de produção do MP e cadastrou o webhook. Testei de
verdade, com dinheiro (R$ 1,00), e passou:

1. **Convite de teste em produção** (criado por SQL, conta `teste-pix@orivya.com.br`,
   subdomínio `teste-pix`). Dois detalhes que custaram tentativa: a lista
   interativa só aparece com `customization.listaModelo = "vitrine"` **e** com um
   `template` cujo `/presentes` implemente a vitrine — hoje só
   `quinze-anos-glamour-rose` usa `usarVitrine`/`PresentearModal`. Com
   `templateId` nulo (ou no template de aniversário) a página cai no layout
   estático, sem botão "PRESENTEAR", e não há como gerar cobrança.
2. **Cobrança real:** o copia-e-cola veio como EMV do Bacen
   (`00020126360014br.gov.bcb.pix…mpqrinter…`), e não o `00020126FAKE-` do
   simulado. `GiftContribution.provider = "mercadopago"`,
   `providerChargeId = 174770546000`, R$ 1,00 (taxa 4, líquido 96).
3. **Confirmação pelo WEBHOOK**, não por polling: `paidAt` 15:34:43 com o
   navegador JÁ FECHADO (o modal é quem faz polling) e o único cron do projeto
   rodando 6h da manhã. Logo, quem virou a chave foi
   `/api/webhooks/mercadopago` — o que prova de uma vez: URL cadastrada,
   evento de pagamento disparando, **assinatura validada** com o segredo (senão
   401 e nada gravaria) e reconsulta do status no MP com o token válido.
4. **Ledger:** `Transaction` GIFT_PIX / PAID / 100 / `providerId` igual ao da
   cobrança.

### O passe de R$ 19,90 também passou (mesmo dia, dinheiro real)

5. **Tela de venda em produção:** conta `teste-pix@orivya.com.br` em BASICO
   (`passesIncluidos = 0`, então aparece o caminho do Pix e não a cota). Convite
   PUBLISHED com `edicaoAte` nulo = fechado.
6. **Cobrança:** `Transaction` EDIT_PASS / PENDING / 1990 / `providerId
   173839957689`, e — o ponto do desenho — `edicaoAte` continuou **null** depois
   do clique. Quem abre a janela é o webhook, e a tela não mente sobre isso.
7. **Pagamento real:** dois hits no webhook, visíveis no runtime log da Vercel.
   O primeiro às 15:39:45 (200) é a notificação da cobrança CRIADA — o handler
   devolve 200 sem conceder nada, correto. O segundo às 15:46:45 é o pagamento,
   e aí sim: `Transaction` → PAID e `edicaoAte` = `2026-08-22 15:46:46`, ou seja
   **47,99h à frente do momento do webhook** — 48 horas contadas de quando o
   dinheiro caiu, não de quando o QR nasceu.
8. **Efeito final conferido no navegador:** `/painel/criar?id=…` **abriu o
   editor** em vez de redirecionar para `/liberar`, que era o comportamento antes
   do pagamento.

Ou seja: os DOIS caminhos de dinheiro do produto (presente e passe de edição)
estão provados em produção, com webhook, assinatura e ledger.

**Limpeza feita:** a conta `teste-pix@orivya.com.br` e tudo em cascata (convite
`teste-pix`, presente, contribuição e as duas Transactions) foram apagados de
produção depois do teste. Os R$ 20,90 ficaram na conta do Mercado Pago do João,
menos a taxa.

**Sobra para limpar** (avisei o João): a conta `teste-pix@orivya.com.br` e o
convite `teste-pix` continuam em produção até ele decidir sobre o teste do passe.
Apagar a conta leva o convite, o presente, a contribuição e a Transaction em
cascata — a R$ 1,00 no Mercado Pago, obviamente, fica.

---

## 2026-08-20 (4) — blindando o caminho do dinheiro (e o que NÃO valia fazer)

Com Pix real circulando, fui fechar as frestas do caminho do dinheiro. Primeiro
**conferi cada item** da lista de 17/08 em vez de confiar nela — e metade já
estava resolvida:

- **Crédito em dobro: JÁ ESTAVA FECHADO** na migration
  `20260817030000_pagamento_unico_e_transacional`. `confirmarContribuicaoPaga`
  faz compare-and-set dentro de `$transaction`, e os índices únicos existem **em
  produção** (conferi no `pg_indexes`): `Transaction_providerId_key`,
  `GiftContribution_providerChargeId_key`, `CobrancaAssinatura_providerId_key`.
  A nota antiga dizia "nenhum consertado" porque foi escrita ANTES dessa
  migration. Lição: reler o código antes de repetir a auditoria.
- **Estorno: só metade estava feita.** O webhook tratava estorno do PASSE
  (`registrarEstornoPasse`) e **nada** do presente. Presente estornado ficava
  PAID e, como o saldo é Σ dos `netCents` PAID, o dono podia sacar dinheiro que
  já voltou para o convidado. Fechado em `dc71a34` com
  `estornarContribuicao`: compare-and-set (o MP reentrega por dias), ledger
  REFUNDED **no lugar** — linha nova exigiria inventar um `providerId` que não
  existe no gateway, e o campo é único — e `purchased` **recalculado**, porque em
  COTAS uma cota estornada não desfaz as outras.
- **`notification_url` na cobrança:** feito no mesmo commit. Sai vazio em domínio
  local de propósito: o MP não alcança `localhost` e recusaria a cobrança
  inteira, quebrando o dev com credencial real.

### O que decidi NÃO fazer, e por quê

- **Checar a validade do `ts` da assinatura (anti-replay).** Parece dívida, mas o
  ganho é ilusório: reentregar uma notificação legítima capturada não concede
  nada de novo — o handler **reconsulta o status no MP** e é idempotente pelo
  compare-and-set. E o risco é concreto: o MP reentrega notificação por horas, e
  uma janela apertada jogaria fora confirmação de pagamento de verdade. Trocaria
  um ataque sem efeito por perda de dinheiro real.
- **Corrida de cotas (`iniciarPresente` lê e depois grava).** Continua aberta.
  O pior caso é vender a 11ª cota de 10 — o dono recebe a mais e o convidado paga
  por uma cota que não existia. Chato, não é perda nossa, e o conserto pede lock
  ou constraint com desenho próprio.
- **Resgate concorrente criando dois payouts.** Sem efeito hoje: `transferir()`
  do Mercado Pago **lança erro** — payout não existe. A corrida vira real no dia
  em que o saque for implementado, e é lá que ela deve ser resolvida.

---

## 2026-08-21 — o dono passou a conseguir SACAR (repasse)

O buraco: `MercadoPagoPaymentProvider.transferir()` **lança**. Todo resgate
nascia PENDING, o `catch` marcava FAILED — e como `saldoDoEvento` só desconta
payout PAID ou PENDING, o valor VOLTAVA para o saldo. O dono pedia de novo, para
sempre, sem nunca receber. Dinheiro entrava e não saía.

**Por que não automatizei:** o Mercado Pago não tem API de saída para chave Pix
de terceiro. O caminho oficial deles é o **split de pagamentos**: o convidado
paga já dividido, com a conta MP do dono conectada por OAuth (credencial que
expira em 6 meses). É a arquitetura certa lá na frente, mas obriga cada cliente
final (noiva, mãe de debutante) a ter conta no Mercado Pago — decisão de produto,
não de código, e não é para hoje.

**O que entrou** (`e94f6ae`, no ar em 21/08):

- `PaymentProvider.podeTransferir` — o simulado transfere (dev fecha o ciclo na
  hora), Mercado Pago e "indisponível" não. Sem a bandeira a action não
  distinguia "falhou" de "não existe", e era essa confusão que virava FAILED.
- `resgatar` agora cria o pedido dentro de UMA transação com `SELECT … FOR
  UPDATE` na linha do `Event`. Antes, dois cliques liam o mesmo saldo, os dois
  passavam pela checagem e nasciam **dois payouts do mesmo dinheiro** — cofre
  negativo e dono pago duas vezes. Um pedido em aberto por convite; o botão do
  dono desliga enquanto ele vive, com o motivo ao lado.
- Sem API de saída, o pedido **fica PENDING de propósito** — é a fila, não uma
  falha. `rotuloDoRepasse` troca "Processando" por "Pedido enviado — em até 1
  dia útil": "processando" promete máquina e segundos.
- **Fila do operador em `/painel/repasses`**: chave Pix com botão de copiar,
  valor, convite, dono e quando pediu. "Paguei — marcar como pago" e "Não
  consegui pagar", os dois com compare-and-set (clique duplo não reescreve a data
  do pagamento). Recusar devolve o valor ao saldo **sozinho** e libera um novo
  pedido — que é o caminho de chave Pix errada.
- Acesso: `ADMIN_EMAILS` (lista por vírgula). **Sem a variável, ninguém entra** —
  é a única tela do sistema que vê dinheiro de todos os convites. `notFound()` em
  vez de "acesso negado", que confirmaria a rota. Já configurada em produção com
  `joaoalbernaz@orivya.com.br` e `joaovictoralbernaz95@gmail.com`.

**Verificado**: 537 testes (7 novos, sendo 4 contra banco real), tsc/lint limpos,
build ok, e a fila conferida no navegador com um pedido de R$ 285 — botão do dono
desligado dizendo "Resgate pedido", fila mostrando chave, valor e as duas ações.

**Fica anotado**: a atomicidade do resgate concorrente, que a auditoria de 17/08
listou como aberta, foi fechada aqui — com trava de linha, e não com índice
parcial (que o Prisma não declara e o `migrate dev` derrubaria no diff seguinte).

---

## 2026-08-21 (2) — recuperação de senha (não existia nenhuma)

Quem perdia a senha ficava trancado fora da conta: não havia rota, formulário nem
e-mail. A única saída era alguém mexer no banco. Num produto em que o cliente
paga e volta meses depois para editar o convite, isso é suporte manual por
telefone — ou cliente perdido.

**O link do e-mail É uma credencial**, e as regras seguem isso:

- Token de 32 bytes (`randomBytes`), no banco só o **hash SHA-256**. Dump do
  banco não vira lista de acessos prontos. SHA-256 sem KDF é o certo aqui: 256
  bits de entropia não têm dicionário nem força bruta viável — KDF protege
  segredo de gente (senha), não token de máquina.
- **Uso único** (`usedAt`) e **1 hora** de validade: link de e-mail não
  desaparece — fica na caixa, no histórico e no preview do mensageiro.
- **Pedido novo mata os anteriores**; **trocar a senha derruba os que sobraram**
  (quem trocou por desconfiar de invasão não pode deixar link vivo na caixa do
  invasor).
- **Resposta sempre igual**, exista a conta ou não — senão o formulário vira um
  verificador de quem tem conta aqui.
- **3 pedidos por e-mail / 15 min**: sem limite, o formulário é um canhão de
  e-mail apontado para a caixa de outra pessoa, e a reputação de remetente vai
  junto.
- `emailConfigurado()` novo em `lib/email`: `enviarEmail` engole erro de propósito
  (nenhum fluxo pode quebrar por e-mail), mas na recuperação isso seria cruel —
  a tela diria "enviamos" para sempre. Agora ela avisa que o problema é NOSSO.

**Telas:** `/entrar/senha` e `/entrar/senha/nova`. O token é conferido no
SERVIDOR antes de a tela existir, e a conferência **não consome** o link (só a
troca grava `usedAt`), então recarregar não queima link de ninguém. O link
"Esqueci minha senha" entrou na tela de login, onde nunca esteve.

**Pega do build (vale lembrar):** `NovaSenha.tsx` é client component e importava
`SENHA_MINIMA` de `lib/senhaReset`, que usa `node:crypto` → o webpack quebrou o
build. O mínimo passou a vir por prop do servidor. Quem sabe a regra é o
servidor; a tela só exibe.

**Verificado:** 18 testes novos (11 puros + 7 de ponta a ponta contra banco), o
fluxo inteiro no navegador (pedir → link → senha nova → login com ela → link
reusado recusado) e **em produção**: página no ar, linha criada com hash de 64
caracteres e validade de 1h exata.

**FALTA O JOÃO:** criar a conta no **Resend** e pôr `RESEND_API_KEY` (e
`EMAIL_FROM`) nas env vars da Vercel. Sem isso a recuperação existe mas o e-mail
não sai — a tela avisa, e o caminho é o suporte destravar na mão. É o mesmo tipo
de pendência que as credenciais do Mercado Pago eram até ontem.

---

## 2026-08-21 (3) — entrar com Google

O risco do login social não é falhar, é **funcionar errado**: a mesma pessoa com
duas contas (uma por senha, outra pelo Google), cada uma com os convites dela e
nenhuma "errada". Por isso o vínculo é por e-mail — e vínculo por e-mail só é
seguro com a condição que está no `signIn`: o Google precisa AFIRMAR que
verificou o endereço (`email_verified`). Sem essa trava, bastaria criar uma conta
Google com o e-mail de outra pessoa para cair dentro da conta dela aqui.

- `lib/contaGoogle.ts`: acha por e-mail NORMALIZADO (`Joao@Gmail.com` ==
  `joao@gmail.com` — sem isso nasce a segunda conta), preenche só buraco (nome
  escolhido no cadastro não é sobrescrito por um login; plano e senha ficam
  intactos), e conta nova nasce **sem senha** e no Básico.
- Conta criada pelo Google não loga por senha (o `authorize` recusa conta sem
  `passwordHash`) — e o caminho para ganhar uma senha é o "esqueci minha senha",
  que serve igual para "nunca tive senha".
- O provider **só entra na lista** quando há credenciais, e o botão só é
  desenhado quando `googleConfigurado()`. Provider sem credencial responde erro
  no callback: o botão levaria a uma tela de erro do Auth.js.

**Pega importante:** `/entrar` era **estática** (`○` no build). A decisão de
mostrar o botão ficava congelada no ambiente do BUILD — e na Vercel adicionar env
var não refaz build, então o botão nunca apareceria depois de configurar tudo
certo. Virou `force-dynamic`. Vale para qualquer página que leia `process.env`
para decidir o que desenhar.

**Verificado:** 562 testes (6 novos), e no navegador: sem credencial o botão não
existe; com credencial o clique chega em `accounts.google.com` levando o nosso
`client_id` (o Google recusa porque a credencial do teste é falsa — que é
exatamente a prova de que o resto está ligado).

**FALTA O JOÃO** (não dá para fazer por ele — é conta Google dele):

1. console.cloud.google.com → criar projeto → **APIs e Serviços → Tela de
   consentimento OAuth** → tipo **Externo** → preencher nome do app, e-mail de
   suporte e e-mail do desenvolvedor.
2. **Credenciais → Criar credenciais → ID do cliente OAuth → Aplicativo da Web**.
3. Em **URIs de redirecionamento autorizados**, colar EXATAMENTE:
   - `https://app.seuconvite.orivya.com.br/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (para desenvolvimento)
4. Copiar o **ID do cliente** e a **Chave secreta** → env vars da Vercel
   (Production): `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET`.

O botão aparece sozinho assim que as duas variáveis existirem — sem novo deploy,
porque a página é dinâmica.
