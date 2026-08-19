# Convite fechado depois de publicado + passe de edição — design

> Aprovado pelo João em 18/08/2026. Pedido dele, literal: "não quero que tenha a
> opção da pessoa editar o convite depois de publicar", com aviso no fim da
> criação, "Meus convites" sem editar/trocar template, "será necessário pagar
> para mudar" (e as telas de pagamento têm de existir), e "Recursos do site"
> atualizado ao que já foi feito.

## Por que (o que o código mostra hoje)

**1. "Recursos do site" não tem mais efeito no site publicado.** `salvarRecursos`
(`app/(dashboard)/painel/acoes.ts:339`) grava em `Event.customization.recursos`,
mas o site público lê o snapshot: `carregarEventoFesta` →
`publishedEventProjection` (`lib/event-editor/public-document.ts:20`) **substitui
o `customization` inteiro** pelo derivado de `publishedData`
(`documentToLegacyCustomization`, `lib/event-editor/legacy.ts:159`). A tela
promete "o site muda na hora" e, depois de publicado, muda só a prévia.

**2. O upsell dessa tela está vazio.** `RecursosCliente` separa `permitidos` de
`bloqueados` por `planoPermite`, mas desde 17/08 (`lib/plans.ts:52`) o Básico já
libera `rsvp`, `recados` e `galeria`, e `presentes`/`contador`/`programacao`
nunca tiveram gate. `bloqueados` é sempre vazio: os cards tracejados e o rótulo
"Com o plano X" são código morto.

**3. O menu "Gerenciar o site" inteiro é a camada antiga.** `detalhes`, `estilo`,
`fotos`, `presentes` e `programacao` escrevem em `customization` /`GiftItem`
/`Photo` — todos sobrescritos pela projeção do snapshot. Tirar "Editar o site" e
"Trocar o estilo" não remove função: remove tela que já mente.

**4. O bloqueio precisa de três portas, não de um botão.** Achado do Codex:
`/painel/criar?id=<publicado>` abre o editor sem checar status
(`app/(dashboard)/painel/criar/page.tsx:41`), `salvarDocumentoConvite` não exige
`DRAFT`, e **"Tirar do ar" devolve o evento para `DRAFT`**
(`app/(dashboard)/actions.ts:207`) — o que hoje seria um destravamento grátis em
dois cliques.

## Decisão

O convite publicado é uma **peça fechada**. O que continua livre é o **movimento
da festa**. Para mexer no site depois de publicado, compra-se um **passe de
edição**.

### A régua

| Congela ao publicar | Continua livre, sempre |
| --- | --- |
| nome, data, hora, local, endereço | confirmações e lista de convidados |
| todos os textos (abertura, pais, traje, rodapé, mural) | recados recebidos (esconder/apagar) |
| capa, foto desktop, monograma, álbum | presentes recebidos, saldo, resgate por Pix |
| template, cores, fontes, tamanhos, animações | ativar carteira e dados de recebimento |
| programação | tirar o convite do ar |
| configuração do RSVP (campos, acompanhantes, prazo, mensagens) | |
| catálogo de presentes (nome, valor, cotas, foto) | |
| liga/desliga das seções | |

O **endereço do convite (slug) nunca muda depois da primeira publicação**, nem
com passe: link já compartilhado não pode quebrar.

O álbum de fotos fica do lado **congelado** (decisão do João, pergunta 4). Soltar
depois é possível — exige escrever no `publishedData`, não na tabela `Photo`.

### O passe

- **R$ 19,90 no Pix, libera 48 horas.** Dentro da janela, edita e republica
  quantas vezes quiser. Compra única, não renova.
- **Cortesia de 1 hora** logo depois da primeira publicação, grátis — é a rede
  para o erro de digitação, que é o que vira reclamação.
- **Liberações incluídas na assinatura, com teto** (decisão do João: assinante
  tem limite): Básico **0**, Profissional **1 por convite**, Studio **3 por
  convite**. Gastou a cota daquele convite, compra o passe como todo mundo.
- **Trocar template não é cobrança separada** — entra no mesmo passe. Cobrar duas
  vezes pelo mesmo destravamento é pedágio duplo.

### Máquina de estados

```
rascunho ──publicar──▶ publicado (fechado)
                          │  ▲
              liberar ────┘  └──── republicar (fecha de novo)
              (cortesia 1h | cota do plano | Pix R$ 19,90 → 48h)
```

- **Publicado (fechado):** site serve `publishedData`; editor recusa.
- **Liberado:** `draftData` parte de uma cópia do publicado. **O site antigo
  continua no ar** até "Publicar alterações" — o convidado nunca vê obra.
- **Janela vence com rascunho não publicado:** o rascunho fica guardado, o acesso
  fecha.
- **"Tirar do ar" deixa de virar `DRAFT`**: some do público, continua fechado.

## Banco

`Event` ganha:

| campo | para quê |
| --- | --- |
| `edicaoAte DateTime?` | até quando a edição está liberada. **Única pergunta do sistema**: `edicaoAte > agora`? |
| `passesGratis Int @default(0)` | quantas liberações da cota do plano já foram usadas **neste convite** |
| `foraDoAr Boolean @default(false)` | "tirar do ar" sem destravar edição (`status` continua `PUBLISHED`) |

Publicar pela primeira vez grava `edicaoAte = agora + 1h` (a cortesia). Republicar
não mexe em `edicaoAte`. O passe pago grava `agora + 48h`.

O pagamento reusa `Transaction` (é por evento, tem `providerId` único):
`kind = "EDIT_PASS"`, `amountCents = 1990`. **Quem libera é o webhook**, nunca a
volta do checkout — no ramo `pagamento` de `app/api/webhooks/mercadopago/route.ts`,
quando nenhum `giftContribution` casar com o `dataId`, procura a `Transaction`
`EDIT_PASS` e abre a janela.

## Telas

1. **Passo 6 do editor** — cartão de aviso depois do checklist: *"Depois de
   publicar, o site fica fechado. Confira nome, data, hora, endereço, textos e
   visual. Para mudar depois, é preciso liberar a edição. Confirmações, recados e
   presentes você continua acompanhando normalmente."* Publicar vira **confirmação
   em dois toques** (padrão do painel, sem diálogo do navegador). O campo de
   endereço fica **somente leitura** a partir da segunda publicação.
2. **Meus convites** — rascunho: "Continuar". Publicado: selo **"Publicado ·
   edição fechada"**, botões **Acompanhar** e **Ver**, e um link discreto
   "Precisa mudar algo?". Sai o ícone de lápis (ele promete edição).
3. **Tela do convite (`/painel/[id]`)** — somem "Editar o site" e "Trocar o
   estilo"; ficam **Ver site**, **Copiar link** e **Liberar edição**. O menu passa
   a listar só o que é vivo: Convidados, Recados, Recebimentos.
4. **`/painel/[id]/liberar` (nova)** — capa, link e data da publicação; o que será
   liberado; o preço; "vale 48 horas"; "compra única, sem assinatura"; **"o site
   atual continua no ar até você publicar as alterações"**; e o Pix. Para quem tem
   cota incluída, o mesmo lugar mostra "Você tem 1 liberação incluída no seu
   plano" e abre sem cobrar. Enquanto a janela está aberta, o editor mostra uma
   faixa fixa: "Edição liberada até 20/08 às 18h40 — o público ainda vê a versão
   anterior."
5. **`/painel/[id]/recursos` vira somente leitura** — lista honesta de "Ativo no
   site / Oculto no site" e um botão "Liberar edição". Os toggles de verdade ficam
   só no editor, onde já funcionam. Os cards tracejados de upsell saem.
6. **`/painel/[id]/recados` (nova, pequena)** — esconder/apagar recado. O campo
   `Recado.approved` já existe e não tem tela; sem ela, "recados são vivos" é
   mentira e um recado ofensivo fica no ar sem saída.

Telas que **morrem** (escrevem onde o site publicado não lê): `detalhes`,
`estilo`, `fotos`, `presentes`, `programacao`. Trocar template passa a ser o
passo 2 do editor, dentro da janela liberada. Nada de valor se perde: o único
campo dessas telas que o documento não tem (`customization.pixQrUrl`, QR fixo
no convite) já é descartado pela projeção do snapshot — está morto hoje.

## As três portas (servidor, não só UI)

Esconder botão não é bloqueio. Precisa recusar no servidor:

- `painel/criar/page.tsx`: `id` de evento `PUBLISHED` sem janela aberta →
  redireciona para `/painel/[id]/liberar`.
- `salvarDocumentoConvite` e `publicarDocumentoConvite`: exigem `DRAFT` **ou**
  janela aberta; republicar ignora mudança de slug.
- `tirarDoAr`: passa a gravar `foraDoAr = true`, não `status = "DRAFT"`.
- `eventoPublico` (`lib/event.ts`) passa a esconder `foraDoAr`.

## Riscos assumidos

- **Consumidor (CDC art. 49 / vício do serviço):** a tela de liberação informa
  preço, prazo, compra única e ausência de renovação. Erro **nosso** (prévia
  diferente do publicado, pagamento confirmado e editor não abre) se corrige de
  graça — nunca exigindo um segundo passe.
- **LGPD:** congelar o site não pode travar apagar/corrigir dado de convidado,
  esconder recado nem remover foto de convidado. Por isso essas ações ficam do
  lado vivo.
- **Estorno:** só o webhook concede. `providerId` único no `Transaction` já é a
  rede contra dupla concessão.

## Fora de escopo

Álbum vivo depois da festa; histórico de versões publicadas (útil para suporte,
mas não pedido); domínio próprio; qualquer mexida no site público em si.
