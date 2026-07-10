# Remodelagem do dashboard "Meus eventos" — design

**Data:** 2026-07-10
**Repo:** `JoaoAlbernaz1/seuconviteia`
**Referência visual:** 4 telas geradas no Google Stitch (projeto `projects/358589699141357452`),
brief em `docs/brief-design-dashboard.md`
**Status:** aprovado pelo dono

---

## 1. O que existe hoje

`app/(dashboard)/painel/page.tsx` (Server Component, `force-dynamic`): saudação, uma frase
de resumo, e uma grade com o card "Criar novo evento" mais um card por evento. Layout em
coluna de 1080px sob uma topbar (`TopBar.tsx`) com três destinos: Meus eventos, Perfil, Plano.

Tokens em `app/globals.css`: fundo `#f3f5f9`, cards `#ffffff`, tinta `#0f172a`, acento
violeta `#6d28d9`, apoio teal `#0EA5A6`.

### Três defeitos, verificados no código

1. **Concordância quebrada.** `page.tsx:104` monta a frase assim:
   `` `${n} convidado${n === 1 ? "" : "s"} confirmaram` ``. O substantivo é condicional; o
   verbo não. Com um convidado, a tela diz **"1 convidado confirmaram"**.

2. **O estado `EXPIRED` não existe nesta tela.** O código só pergunta
   `status === "PUBLISHED"`. Qualquer outro valor cai no `else` e é renderizado como
   *"Em preparação"*, com o botão *"Continuar montando"*. Um evento vencido convida o dono
   a terminar de montá-lo.

3. **A marca briga com a landing.** O painel usa violeta `#6d28d9` e teal `#0EA5A6`; a
   landing aprovada usa amarelo `#F5FF63`, roxo `#7A40ED` e preto `#19171C`. **Nem o roxo
   é o mesmo roxo.** Quem se cadastra vê uma marca e entra em outra.

Além disso, com um evento só, dois terços da tela ficam vazios; e o limite de 3 eventos do
plano Básico (`lib/plans.ts:87`) não é comunicado em lugar nenhum.

## 2. Objetivo

Uma tela que se sustenta com **um** evento e com **doze**, que fala a mesma língua visual
da landing, e que representa honestamente os quatro estados de um evento.

## 3. Não-objetivos

- **Sidebar.** Uma das telas do Stitch trouxe uma, com itens que não existem no produto
  ("Convidados", "Mensagens", "Configurações"). Fica de fora: o painel migrou para topbar.
- **Gráficos, KPIs com seta de tendência, tabelas densas.** Isto não é um ERP.
- **Modo escuro.** Foi removido do produto de propósito.
- **Renomear os planos.** Ver §7.
- **Mexer nas telas internas do evento** (`/painel/[id]/*`). Só a home do painel.

## 4. A costura das quatro telas do Stitch

O Stitch devolveu quatro telas que **não formam um sistema**: cromos diferentes, e uma com
sidebar. O dono aprovou a seguinte costura:

| Peça | Origem | Motivo |
|---|---|---|
| Topbar | telas 1–3 (e o código atual) | A sidebar da tela 4 sai |
| Três blocos de resumo, coloridos | tela 2 | É o único lugar onde o amarelo da marca aparece com força; resolve o vazio |
| Busca + filtro por status + ordenação | tela 2 | Sem isso o cerimonialista (plano de R$69) não gerencia 12 eventos |
| Estado vazio | tela 3 | Zera os blocos em vez de escondê-los, e mostra os 4 passos |
| Quatro estados de card | tela 4 | Selos distinguíveis sem depender só de cor |

## 5. Componentes

A `page.tsx` de hoje faz tudo: query, derivação de estado, formatação e marcação. Ela cresce
com esta mudança, então é dividida. A regra: **a lógica pura sai do componente** — os 21
arquivos de teste do repo são todos de funções puras, nenhum toca o banco, e assim continua.

### 5.1 `lib/painelEstado.ts` (novo, puro)

```ts
export type EstadoEvento = "RASCUNHO" | "NO_AR" | "NO_AR_PENDENTE" | "EXPIRADO";

export function estadoDoEvento(
  ev: { status: StatusEvento; expiresAt: Date },
  pendencia: string | null,
  agora: Date,
): EstadoEvento;
```

Reaproveita a mesma verdade de `lib/event.ts:eventoPublico` — `EXPIRED` **ou** `expiresAt`
no passado significa expirado. Recebe `agora` por parâmetro (a página é `force-dynamic`;
nada de `Date.now()` escondido dentro da função).

### 5.2 `lib/frases.ts` (novo, puro)

```ts
export function frasePresencas(n: number): string;   // "1 convidado confirmou" | "3 convidados confirmaram"
export function fraseResumo(sites: number, presencas: number, recados: number): string;
```

Corrige o defeito §1.1. Verbo e substantivo concordam.

### 5.3 `app/(dashboard)/painel/_ui/ResumoBlocos.tsx`

Três blocos: **sites no ar** (amarelo `#F5FF63`, tinta preta), **presenças confirmadas**
(cinza `#F2F1F3`), **recados recebidos** (roxo `#7A40ED`, tinta branca).

Com zero eventos, os três aparecem zerados — não somem. É o que a tela 3 faz, e é o que
evita a página vazia parecer quebrada.

### 5.4 `app/(dashboard)/painel/_ui/CardEvento.tsx`

Um componente, quatro estados. Cada estado define selo, linha de contexto e botão:

| Estado | Selo | Linha | Botão |
|---|---|---|---|
| `RASCUNHO` | "Em preparação" | "Continue de onde parou — falta pouco" | "Continuar montando" (primário) |
| `NO_AR` | "No ar" | `frasePresencas(n)` | "Ver e editar" (secundário) |
| `NO_AR_PENDENTE` | "No ar" | `frasePresencas(n)` + " · " + pendência | "Ver e editar" (secundário) |
| `EXPIRADO` | "Expirado" | "Este site saiu do ar em 07 de out. de 2026" | "Ver e editar" (secundário) |

O selo não pode depender **só** de cor: cada um leva ícone ou forma própria. O card
expirado fica dessaturado.

### 5.5 `app/(dashboard)/painel/_ui/FiltroEventos.tsx` (client)

Busca por nome, chips de status (`Todos · No ar · Em preparação · Expirado`) e ordenação.

**Filtra no cliente, sobre a lista já carregada.** Não há query nova: a página é
`force-dynamic` e já traz todos os eventos do profissional. Um cerimonialista com centenas
de eventos justificaria paginação no servidor — mas ninguém tem isso hoje, e o produto tem
zero contas reais. YAGNI.

Com um evento só, os controles ficam discretos, mas presentes.

### 5.6 `app/(dashboard)/painel/_ui/EstadoVazio.tsx`

Conta nova. Frase: *"Seu primeiro site de evento está a 4 passos daqui."* Os quatro passos
numerados, e um botão "Criar meu primeiro evento".

### 5.7 Limite do plano

`limiteEventos(plan)` devolve `3` para `BASICO` e `null` para os demais. Quando o limite é
atingido, o card "Criar novo evento" comunica o limite e oferece o upgrade — sem bloquear a
tela, sem sermão.

## 6. Tokens

`app/globals.css` ganha a paleta da marca no painel. **O roxo mora em dois lugares** e os
dois precisam mudar juntos, senão a tela fica com dois roxos:

- `--color-violeta` (linha 15 — é o que gera os utilitários `bg-violeta`/`text-violeta` do
  Tailwind v4): `#6d28d9` → **`#7A40ED`**
- `--scv-violet` (linha 55 — usado como `text-scv-violet`): `#6d28d9` → **`#7A40ED`**
- `--scv-amarelo`: **`#F5FF63`** (novo)
- `--scv-preto`: **`#19171C`** (novo)
- `--scv-cinza`: **`#F2F1F3`** (novo)

O teal `#0EA5A6` deixa de ser cor de marca. Ele sobrevive apenas como sinal de status
"no ar" — e mesmo isso é revisado no card.

**Contraste.** O amarelo `#F5FF63` **não passa contraste com branco**. Ele só é usado como
fundo com tinta preta. Isso vale como regra, não como sugestão.

## 7. Questão em aberto — os planos não batem

O painel chama os planos de **Básico · Clássico · Premium** (`lib/plans.ts:116`). A landing
vende **Convite único (R$47) · Assinatura (R$27/mês) · Cerimonialista (R$69/mês)**.

Isto **não é um problema de rótulo**. "Básico" permite **3 eventos**; "Convite único", pelo
nome, permite **um**. São regras de negócio diferentes com nomes diferentes, e o cliente
compra na landing o que não encontra no painel.

Renomear sem decidir a regra seria mentir com mais elegância. **Fica fora deste spec**;
precisa de decisão do dono e de ciclo próprio.

## 8. Testes

Vitest, funções puras, nenhuma toca o banco — a convenção dos 21 arquivos existentes.

- `lib/frases.test.ts` — `frasePresencas(0|1|2)`, `fraseResumo` com singular e plural em
  cada uma das três posições.
- `lib/painelEstado.test.ts` — os quatro estados. Casos obrigatórios: `PUBLISHED` com
  `expiresAt` no futuro → `NO_AR`; `PUBLISHED` com `expiresAt` no passado → `EXPIRADO`
  (**não** `NO_AR`); `EXPIRED` explícito → `EXPIRADO`; `DRAFT` → `RASCUNHO`; `PUBLISHED`
  com pendência → `NO_AR_PENDENTE`.
- `FiltroEventos` tem a lógica de filtro/ordenação extraída para função pura, testada
  separadamente do componente.

## 9. Verificação

1. `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build` — verdes.
2. **Screenshot autenticado** do `/painel` (o driver CDP do scratchpad injeta o cookie do
   Auth.js), comparado lado a lado com as telas do Stitch. O dono decide vendo.
3. Semear um evento `EXPIRED` e um `DRAFT` no banco de dev, para os quatro estados
   aparecerem juntos na tela real.
4. `npx impeccable detect` na página e na URL local. A landing em produção acusa 6
   anti-padrões hoje; o painel novo não deve acrescentar nenhum.
5. Conferir o contraste do amarelo com um verificador — a regra da §6 tem que valer na tela,
   não só no spec.

## 10. Fora deste ciclo

- **Nomes e regras dos planos** (§7).
- **Contraste da landing**: `app/globals.css:275` pinta as iniciais dos depoimentos de
  branco sobre um gradiente que termina em `#d0bafe` — 1,7:1, reprovado em WCAG AA.
  Defeito real, mas é da landing. Commit separado.
- **Paginação no servidor** da lista de eventos, se algum dia alguém tiver centenas.
