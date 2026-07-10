# Referência de design — template "15 anos" (festa-15-maria-clara)

> Extraído do site no ar `https://festa-15-maria-clara.vercel.app` em 2026-07-10 com
> Playwright (fontes/cores medidas dos elementos reais; prints de página inteira com as
> animações de scroll disparadas). A fonte original está só no Mac; esta é a referência
> fiel para recriar o site como o **primeiro template de 15 anos** do seuconviteia.
>
> Prints salvos no scratchpad da sessão (`festa-home.png`, `-evento`, `-confirmar`,
> `-presentes`, `-galeria`, `-recados`). Re-extrair: `scratchpad/festa_reveal.py`.

## Identidade

**Estética:** hero **escuro cinematográfico** full-bleed (a foto ocupa a tela), seguido de
seções **claras** (rosa/creme) com acentos rosa. Editorial, romântico, "quinze anos de luxo".

### Fontes (medidas dos elementos)

| Papel | Fonte usada | Fallback (usar no template — as de cima parecem pagas/custom) |
|---|---|---|
| Corpo / serifa | `Cormorant` | Cormorant (Google) |
| UI / sans (kickers, nav) | `Jost` | Jost (Google) |
| Manuscrita (nomes: "Maria Clara", "Vem comemorar comigo") | `milton` | **Pinyon Script** (Google) |
| Display ("15 ANOS") | `vogue` | Cormorant Garamond (Google) |

Como na landing (TWK Lausanne → Hanken), as fontes custom `milton`/`vogue` viram os
fallbacks Google no template.

### Paleta (hex convertidos dos `rgb` medidos)

| Token | Hex | Uso |
|---|---|---|
| Escuro ameixa | `#160C12` | fundo do hero cinematográfico |
| Texto escuro | `#2E1A20` | texto sobre claro |
| Creme | `#FBF6F2` | texto sobre escuro; fundo de seções |
| Rosa | `#E86FA6` | acento (kickers, links) |
| Rosa profundo | `#B83D6B` | CTA preenchido, destaques |
| Cinza/apoio | `#6B4A54` | texto secundário |
| Branco | `#FFFFFF` | cards |

## Estrutura por página

**Nav (todas):** monograma "MC" à esquerda · Início · Evento · Confirmar · Presentes ·
Galeria · Recados. **Rodapé (todas):** nome em manuscrita + divisória ornamental +
"29 . 08 . 2026 · ESPLENDOR HALL · BRASÍLIA" + "Feito com carinho."

### Home (`/`)
1. **Hero cinematográfico**: foto full-bleed escura, "Maria Clara" em manuscrita à esquerda.
2. **O Convite**: kicker "O CONVITE" → "Vem comemorar comigo" (manuscrita) → divisória →
   linha em rosa ("Os pais de Maria Clara convidam…") → 2 parágrafos serifa → "Com carinho,"
   + nomes (manuscrita rosa) → botão outline "LER O CONVITE E VER OS DETALHES".
3. **Card Quando/Onde**: duas colunas (QUANDO: "Sábado, 29 de agosto / 20h30" rosa; ONDE:
   "Esplendor Hall / endereço") + botão outline "VER MAPA E PROGRAMAÇÃO".
4. **CTA**: "Faça parte dessa noite" (manuscrita) + botão preenchido rosa "CONFIRMAR PRESENÇA →".
5. **Traje**: kicker "TRAJE" + "Esporte fino" (manuscrita).
6. **Dois cards**: Presentes ("Sua presença é o presente") e Recados ("Deixe seu carinho"),
   cada um com "ABRIR →".

### Presentes (`/presentes`)
Kicker + "Sua presença é o presente" (manuscrita) + parágrafo. **Card dividido**: foto à
esquerda; à direita "LISTA DE PRESENTES / Se quiser me presentear" com itens (Roupas tam P,
Calças M·38, Calçados nº36, Joias, Perfumes, Maquiagem — cada um com detalhe em rosa à
direita); depois "OU, SE PREFERIR / um Pix" + **QR code** + "Recebedor: <nome>".

### Evento · Confirmar · Galeria · Recados
Mesma linguagem (hero menor + seções claras). Confirmar = formulário de RSVP; Galeria =
grade de fotos com lightbox; Recados = mural de mensagens. **Estas funções já existem no
sistema** (`app/%5Fsites/[sub]` + `components/evt/*`), hoje no tema claro/rosê.

## Insight para o escopo

O seuconviteia **já implementa** RSVP, presentes (Pix), galeria e recados — foram
construídos justamente para replicar esta festa. O que diverge é o **visual**: o sistema
renderiza claro/rosê com capa em arco; a festa é **hero escuro cinematográfico** + seções
claras + esta paleta/fontes específicas.

Portanto o trabalho é, em grande parte, **re-tematizar o template de evento existente** para
esta identidade (paleta, fontes, e sobretudo a **capa cinematográfica escura**, que foi
removida no reset MVP e precisa voltar), e não reconstruir a funcionalidade do zero. Isso
deve virar um spec próprio (o "template 15 anos"), separado do fluxo de criação (D5).
