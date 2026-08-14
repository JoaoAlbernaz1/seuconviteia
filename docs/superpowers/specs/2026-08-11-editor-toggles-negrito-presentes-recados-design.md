# Editor: programação liga/desliga, negrito, presentes organizados e textos do mural — Design

**Data:** 2026-08-11 · **Aprovado por:** João (conversa de 11/08)

## Problema

Quatro lacunas no editor guiado (`app/(dashboard)/painel/criar/CriarConvite.tsx`, 6 passos com prévia ao vivo):

1. A **programação** não tem liga/desliga. Galeria, mural de recados, confirmação e presentes têm; a programação só some se o cliente apagar item por item.
2. Não há controle de **peso da letra**. O cliente escolhe a dupla de fontes, mas não consegue deixar o convite mais encorpado.
3. O passo **Presentes e Pix** é uma caixa única e longa (modelo, texto, sugestões, lista, valor livre, recebimento), sem hierarquia e **sem reordenar os presentes**. Dois campos do bloco "Contribuição com valor livre" (`Título` e `Valores sugeridos`) são `defaultValue` sem estado — aceitam digitação e não salvam nada.
4. Os textos da página `/recados` estão **chumbados** em `components/evt/paginas/PaginaRecados.tsx`. O cliente não vê nem edita.

## Não-objetivos

- Não mexer no gate por plano (`lib/plans.ts`) nem na tela separada "Recursos do site" (`painel/[id]/recursos`).
- Não mudar o visual do site publicado além do que os novos controles produzem.
- Não tocar em pagamento, carteira ou upload.

---

## 1. Programação liga/desliga

**Estado:** novo campo `prog: boolean` em `State` (default `true`, como os demais recursos).

**UI:** dentro do acordeão "Programação" (passo 2 — Conteúdo, `a.kind === "programacao"`), um `<Toggle>` no cabeçalho, igual ao padrão de "Galeria de fotos" e "Mural de recados" no passo 5. Desligado, a lista de horários fica recolhida.

**Prévia e site:** o encanamento já existe e é genérico —
`montarRascunho()` monta `recursosOff`, `lib/previewEvento.ts` converte em `TogglesSite`, e
`components/templates/quinze-anos/glamour-rose/Evento.tsx:43` já faz
`recursos.programacao && evento.programacao.length > 0`. Basta:

- incluir `!S.prog ? "programacao" : null` em `recursosOff`;
- incluir `S.prog` em `estruturalDoEditor()` (mudança estrutural → recarrega o iframe, a seção some/volta).

**Persistência:** a action de gravação (`criar/acoes.ts`) já grava `customization.recursos` via `togglesParaCustomization`; `programacao` é chave existente em `RecursoSite`. Passa a viajar junto com rsvp/presentes/galeria/recados.

---

## 2. Letra em negrito

**Estado:** novo campo `negrito: boolean` (default `false` — eventos existentes não mudam).

**UI:** passo 1 (Capa), logo abaixo do bloco "Letras do convite" (`SeletorFontes`), num card igual ao "Escurecer a foto da capa": título **"Letra em negrito"**, apoio *"Deixa os títulos e os textos do convite com o traço mais forte."*

**Como aplica:** o site já usa variáveis de runtime no wrapper `.evt`
(`--ev-font-script/display/body/util`, `lib/fontes.ts`). O negrito entra pelo mesmo caminho: uma
variável de peso (`--ev-peso`, `400` → `600`) consumida pelos slots **display, body e util**.

**Limite real (declarar, não fingir):** o **nome da capa** usa o slot *script*. Nas duplas de letra
manuscrita (Dancing Script, Great Vibes, Pacifico, Milton) o Google não publica peso forte — o nome
não engrossa. Decisão: **a chavinha continua valendo para títulos e textos** (que sempre têm 600
carregado em `app/evt-fonts.ts`), e quando a letra escolhida não tem negrito no nome, aparece um
aviso curto — *"a letra escolhida não tem negrito no nome da capa"*. Nada de chavinha morta nem de
peso falso via `font-synthesis`.

**Prévia:** `negrito` entra em `montarRascunho()` e em `estruturalDoEditor()` (recarrega re-pesado,
mesmo caminho da troca de fonte, que também é estrutural).

---

## 3. Presentes — organizar

O passo 4 vira **três caixas** com títulos, no lugar de uma:

| Caixa | Conteúdo |
|---|---|
| **Como a lista aparece** | modelo Painel/Vitrine (com o cadeado de plano atual) + texto de apresentação |
| **Seus presentes** | sugestões de 1 toque + lista dos presentes + "Adicionar presente em branco" |
| **Dinheiro** | contribuição com valor livre + "Onde cai o dinheiro" (carteira) |

O liga/desliga geral (`S.gifts`) sobe para o cabeçalho do passo, fora das três caixas — desligado,
as três somem.

**Reordenar:** cada linha de presente ganha **↑ / ↓** (primeiro item sem ↑, último sem ↓), que
trocam de posição no `giftList`. A ordem do array já é a ordem do site (`presentes` no rascunho e no
payload), então não há nada a mudar no template.

**Campos mortos:** `Título` e `Valores sugeridos` do valor livre passam a ter estado
(`freeTitulo`, `freeValores`), entram no rascunho e são gravados. Sem estado, hoje o cliente digita e
perde — é bug, não falta de recurso.

---

## 4. Recados — textos editáveis

**Textos hoje chumbados** em `PaginaRecados.tsx`: chapéu `"Mural de recados"`, título
`"Deixe seu carinho"`, convite `"Escreva um recado de carinho para {nome}. Ela vai amar ler cada
palavra."` e o título do mural `"Recados de quem ama"`.

**Onde ficam:** externalizados em `lib/secoes.ts` — o módulo já existe exatamente para isso
(copy da seção vinda de `customization.secoes`, com fallback para o default do nicho). Entra a
subseção `recados: { eyebrow, titulo, convite, muralTitulo }`, todos opcionais, defaults iguais aos
textos atuais (site existente não muda um pixel).

**UI:** no passo 5, dentro da caixa "Mural de recados" e acima da lista de aprovação, um bloco
"Textos da página" com os quatro campos. Só aparece com o mural ligado.

**Prévia:** a caixa já tem `data-foco="recados"` e `paginaDoPasso(5, "recados")` já leva a prévia
para a página de recados — falta apontar o foco para lá quando o cliente mexe nos textos. Chapéu,
título e convite refletem **ao vivo** via `liveMapa()` (chaves `recados-eyebrow`,
`recados-titulo`, `recados-convite`, `recados-mural`) + `data-live` no componente, sem recarregar.

---

## Testes

Vitest, na fronteira pura (o padrão do repo — `lib/*.test.ts`):

- `lib/previewEvento.test.ts` — `recursosOff` com `"programacao"` volta como `programacao: false`; ausente = ligado.
- `lib/secoes.test.ts` — recados: defaults quando ausente/vazio; override quando preenchido; JSON malformado cai no default.
- `lib/fontes.test.ts` — mapa de peso: `negrito` → `600` nos slots display/body/util; quais duplas declaram script sem negrito.
- Novo `lib/presentesOrdem.test.ts` — subir/descer preserva o conjunto, respeita as pontas, é estável.

Verificação final: `tsc --noEmit`, `eslint`, `vitest run`, `pnpm build` e conferência visual na prévia (as quatro entregas vistas na tela antes de fechar).

## Riscos

- **Peso da fonte:** se algum slot usado como corpo só tiver 400 carregado, o negrito não aparece ali. Mitigação: o teste de `lib/fontes.ts` lista os pesos por dupla, e `app/evt-fonts.ts` ganha 600 onde faltar e o Google publicar.
- **Reload da prévia:** `negrito` e `prog` são estruturais (recarregam o iframe). É o comportamento já aceito para cor e fonte — não introduz piscada nova em quem digita texto.
