# Cache do site público de evento — design

**Data:** 2026-07-10
**Repo:** `JoaoAlbernaz1/seuconviteia`
**Status:** aprovado pelo dono, aguardando implementação

---

## 1. O problema, medido

As 9 rotas de `app/%5Fsites/[sub]/` são `force-dynamic`. O carregador
`carregarEventoFesta` (`lib/eventoFesta.ts:168`) está embrulhado em `cache()` do
React, que memoiza **dentro de uma requisição** — para o layout e a page não
consultarem o banco duas vezes — e **não** entre requisições.

Consequência: cada convidado que abre um convite dispara uma query no Postgres e
acorda uma função serverless, para servir uma página que não muda desde a última
edição do profissional. Um convite que cai num grupo de WhatsApp com 50 mil pessoas
gera 50 mil queries.

Nada revalida o site público hoje. O `painel/acoes.ts` chama `revalidatePath("/painel")`
nove vezes; nenhuma linha revalida `app/%5Fsites`. O site só está correto porque é
`force-dynamic` — ele paga o preço da frescura em toda visita.

## 2. Por que `force-dynamic` existe

Não é descuido. Todas as páginas chamam `eventoPublico(event, new Date())`: a
visibilidade depende da **hora atual**, porque um evento vencido (`expiresAt` no
passado) precisa sumir. Uma página servida do CDN não sabe que o relógio virou.

## 3. Decisão do dono

**A expiração deve ser exata, no segundo.**

Isso elimina o cache de *página*: `revalidate` no Next é um valor estático, então não
há como dizer "cacheie até exatamente o `expiresAt` deste evento". As páginas seguem
`force-dynamic`.

O que este spec entrega é o cache de **dados**: o banco deixa de ser tocado.

| | Queries no Postgres | Invocações serverless | Latência |
|---|---|---|---|
| Hoje | 1+ por visita | 1 por visita | ~centenas de ms |
| **Este spec** | ~0 | 1 por visita | ~centenas de ms |
| Cache de página (recusado) | ~0 | ~0 | ~dezenas de ms |

A troca é consciente: precisão de segundos numa expiração que ocorre **30 dias depois
da festa**, em troca do ganho maior. Reverter é barato: remover `force-dynamic` e
adicionar `export const revalidate`.

## 4. Não-objetivos

- **Cache de página / CDN.** Excluído pela decisão da §3.
- **Validade por plano.** Descoberto durante o design: `lib/dates.ts:4` fixa
  `VALIDADE_MS = 30 dias` para **todos** os planos. O dono quer que a validade dependa
  do plano contratado. Isso é uma regra de negócio nova, não cache. **Ciclo próprio.**
- **`agenda/route.ts`.** Gera `.ics` com `DTSTAMP` da hora atual. Cachear não faz
  sentido.
- **`confirmar` e `obrigada`.** Formulário e pós-escrita. Seguem dinâmicas.

## 5. Arquitetura

### 5.1 `lib/cacheTags.ts` (novo)

Duas funções puras: `tagEvento(sub)` e `tagRecados(sub)`.

Existe para que o nome da tag nunca seja digitado à mão em dois lugares. Quem escreve
a tag e quem a invalida precisam concordar na string; uma divergência não dá erro de
compilação nem de runtime — apenas para de atualizar, silenciosamente.

### 5.2 `lib/eventoFesta.ts` — o carregador

Três camadas, de dentro para fora:

1. `unstable_cache` em torno da query do Prisma, com `tags: [tagEvento(sub)]` e
   `revalidate: 300`.
2. Uma fronteira de serialização que revive as datas (§5.4).
3. O `cache()` do React por fora, preservado: layout e page chamam o mesmo carregador
   na mesma requisição e não devem bater no cache de dados duas vezes.

### 5.3 `lib/recados.ts` — mural

`listarRecadosAprovados` ganha cache próprio sob `tagRecados(sub)`, com o mesmo
`revalidate: 300` de rede de segurança. Tag separada porque o mural muda por ação de
**convidado**, não do profissional. Tag única faria cada recado novo invalidar o
convite inteiro.

`deixarRecado` invalida `tagRecados(sub)` — e apenas ela.

### 5.4 A fronteira de serialização

`unstable_cache` serializa o que guarda. O `Event` carrega `Date` em `eventDate`,
`expiresAt`, `createdAt`, `updatedAt` — e as relações incluídas (`professional`,
`template`, `gifts`, `photos`) também têm `createdAt`.

**Verificado no código-fonte do Next 16.2.9**
(`next/dist/server/web/spec-extension/unstable-cache.js`):

- **Cache miss:** `cacheNewResult()` grava com `JSON.stringify(result)` (linha 23) e
  devolve `return result` — o objeto **original**, com `Date` intactos.
- **Cache hit:** devolve `JSON.parse(cacheEntry.value.data.body)` (linha 168) — os
  `Date` viraram **string ISO**.

Há um comentário do próprio Next no ponto da serialização: `// TODO: handle non-JSON
values?`

Portanto o tipo mente e **o bug é intermitente**: a primeira visita a um convite
funciona (miss), a segunda estoura em `ev.expiresAt.getTime()` (hit). O TypeScript não
avisa — ele acredita no tipo declarado pelo Prisma. Um teste manual de uma visita só
passaria, e a quebra apareceria em produção.

Consequência de design: a fronteira de revival fica **fora** do `unstable_cache`,
aceita `Date | string` e normaliza os dois caminhos para `Date`. Ela é pura e testada.

### 5.5 Invalidação

Uma única função, `revalidarSiteDoEvento(sub)`, chamada por todos os pontos de
escrita. Nenhuma action monta a tag à mão.

Pontos que alteram o que o convidado vê:

| Arquivo | Função |
|---|---|
| `app/(dashboard)/painel/acoes.ts` | `criarRascunho`, `atualizarDetalhes`, `salvarEstilo`, `salvarRecursos`, `salvarFotos`, `salvarPresentes`, `salvarProgramacao`, `publicarEComemorar`, `excluirEvento` |
| `app/(dashboard)/actions.ts` | `despublicarEvento` |
| `lib/recados.ts` | `deixarRecado` (tag de recados) |

`adicionarConvidado`, `removerConvidado` e a confirmação de presença do convidado
**não invalidam nada**. Verificado: nenhuma rota de `app/%5Fsites/` referencia `Guest`,
e o `include` do carregador (`lib/eventoFesta.ts:171`) traz apenas `professional`,
`template`, `gifts` e `photos`. A lista de RSVP é privada do painel.

### 5.6 Rede de segurança

O `revalidate: 300` do `unstable_cache` **não** é redundante com as tags.

Se um ponto de invalidação for esquecido — hoje são onze, amanhã podem ser doze — o
sintoma seria: o profissional edita, vê o painel correto, abre o site e nada muda.
Para sempre. Sem erro, sem log, sem teste vermelho.

Com o TTL, o custo de um esquecimento cai de "para sempre" para "até 5 minutos".

O TTL **não** compromete a exatidão da expiração (§3): a página continua dinâmica e
renderiza com `new Date()` fresco a cada visita. O que envelhece é a linha do banco, e
o `expiresAt` dela não muda com o tempo.

## 6. Testes

Vitest, 19 arquivos, todos de funções puras, nenhum toca o banco. Manter assim.

- `lib/cacheTags.test.ts` — formato e estabilidade das tags.
- `lib/eventoFesta.test.ts` — revival de datas. Casos obrigatórios:
  - entrada com strings ISO nas quatro datas do `Event` → saída com `Date` reais
    (simula o **cache hit**);
  - entrada já com `Date` → saída inalterada, ainda `Date` (simula o **cache miss**);
  - `null` (evento inexistente) → `null`, sem estourar;
  - relações (`photos`, `gifts`, `professional`, `template`) com `createdAt` string;
  - `template: null` (relação opcional).
- Não há teste do `unstable_cache` em si: o comportamento foi verificado lendo o
  código-fonte do Next (§5.4) e não é responsabilidade deste repo testar o framework.
  O que se testa é a nossa fronteira, que precisa tolerar **os dois** formatos.

## 7. Verificação

1. `pnpm test` — os 19 arquivos existentes continuam verdes; os novos passam.
2. `pnpm exec tsc --noEmit` limpo.
3. Localmente, com o dev server e o Postgres do Docker: abrir o convite demo
   (`maria-clara`), observar no log que a query roda **uma vez**; recarregar cinco
   vezes e observar que **não** roda de novo.
4. Editar o evento pelo painel, salvar, recarregar o site: a mudança aparece
   imediatamente (tag), não em 5 minutos (TTL).
5. Deixar um recado no mural: aparece imediatamente, e o convite (outra tag) não é
   invalidado.
6. Um evento com `expiresAt` no passado continua invisível na primeira visita após o
   vencimento — sem tolerância, como o dono pediu.

## 8. Fora deste ciclo

- Validade do site por plano contratado (§4). Regra de negócio; precisa de spec.
- Cache de página no CDN, caso o dono reconsidere a precisão da expiração.
