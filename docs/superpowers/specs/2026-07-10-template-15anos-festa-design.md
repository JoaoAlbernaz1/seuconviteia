# Template "15 anos" idêntico à festa-15-maria-clara — design

**Data:** 2026-07-10
**Repo:** `JoaoAlbernaz1/seuconviteia`
**Referência:** `docs/referencia-template-festa.md` + prints em `scratchpad/festa-*.png` (extraídos do site no ar com Playwright).
**Status:** aprovado nas decisões-chave; aguardando revisão do spec.

---

## 1. Contexto

O template `quinze-anos/glamour-rose` **já existe** e já está quase lá:

- **Paleta:** o preset de tema `rose` tem, segundo o próprio comentário do código (`lib/temas.ts:14`), "os valores EXATOS do festa original". O `maria-clara` usa `rose`. Palette já é fiel.
- **Componentes:** `SiteNav`, `SiteFooter`, `SectionHeading`, `ConfirmCTA`, `PixCard`, `Galeria`, `RecadoForm`, `RsvpConvite`, `Timeline`, `MapEmbed`, `Particles`, `Reveal` — todos existem em `components/evt/`.
- **Fontes:** tokens `--ev-font-display/script/body/util` (o script é Pinyon Script, como a festa).
- **Páginas:** `Home`, `Evento`, `Presentes`, `Galeria` em `components/templates/quinze-anos/glamour-rose/`.

**O que diverge da festa:** o **layout**, não a identidade. Principalmente a **capa**: a
`CapaGlamour` atual é **clara** (`bg-evt-ivory`), com a foto centralizada num arco; a festa é
**escura, cinematográfica, full-bleed**, com o nome em manuscrita à esquerda. As seções
internas também precisam de alinhamento fino ao print da festa.

**Gap de dados:** não existe campo de **pais** ("Os pais de Maria Clara convidam… /
Adalberto, Ivânia e Maria Clara"). `ConviteConteudo` (`lib/convite.ts`) não tem `pais`, e o
editor `detalhes` não o coleta.

## 2. Objetivo

Deixar o template de 15 anos **pixel-fiel** ao `festa-15-maria-clara.vercel.app`, tela por
tela, mantendo **todo o conteúdo editável** pelo painel (nada cravado no template).

## 3. Não-objetivos

- **Não reconstruir a funcionalidade** (RSVP, presentes, galeria, recados já existem).
- **Não mexer na paleta** — o preset `rose` já é a paleta da festa.
- **Não tocar nos outros templates** (casamento, aniversário).
- **Não mexer no fluxo de criação (D5)** nem no storage — ciclos próprios.

## 4. Requisitos Funcionais (FR)

Cada FR = uma tela/seção alinhada ao print da festa (`scratchpad/festa-<pagina>.png`).

- **FR1 — Capa cinematográfica.** Reescrever `CapaGlamour`: foto **escura full-bleed**
  (`min-h-100svh`), scrim/vinheta para legibilidade, nome da debutante em **manuscrita à
  esquerda**, "15 ANOS" em display, monograma + nav no topo. Sem foto → gradiente escuro do
  tema (fallback). Ken Burns/fade suave, respeitando `prefers-reduced-motion`.
- **FR2 — Home · O Convite.** kicker "O CONVITE" → "Vem comemorar comigo" (manuscrita) →
  divisória ornamental → linha do convite dos pais (rosa) → parágrafos do `mensagem`
  (serifa) → "Com carinho," + assinatura (pais + debutante, manuscrita) → botão outline
  "Ler o convite e ver os detalhes".
- **FR3 — Home · Quando/Onde.** card branco de duas colunas: QUANDO (`date`/`time`, rosa) e
  ONDE (`local` + `endereco`) + botão "Ver mapa e programação".
- **FR4 — Home · CTA + Traje + cards.** "Faça parte dessa noite" (manuscrita) + botão
  preenchido rosa "Confirmar presença"; seção "TRAJE" + `traje` (manuscrita); dois cards
  (Presentes / Recados) com "Abrir →".
- **FR5 — Evento** (`/evento`): alinhar ao print da festa.
- **FR6 — Presentes** (`/presentes`): card dividido (foto à esquerda; lista de presentes à
  direita com detalhe rosa por item; "OU, SE PREFERIR" + Pix/QR + recebedor). Reusa
  `PixCard` e os `presentes` editáveis.
- **FR7 — Galeria** (`/galeria`): grade de fotos + lightbox (reusa `Galeria`).
- **FR8 — Recados** (`/recados`): mural (reusa `RecadoForm` + listagem).
- **FR9 — Nav e rodapé** em todas: monograma + itens; rodapé com nome em manuscrita +
  divisória + linha "data · local · cidade" + "Feito com carinho.".
- **FR10 — Campo de pais editável.** Novo campo `pais` (texto) em:
  `ConviteConteudo` + schema (`lib/convite.ts`), no editor `detalhes`, e usado na FR2. Vazio
  → a linha do convite dos pais some (grau de degradê, não quebra).

## 5. Requisitos Não-Funcionais (NFR)

- **NFR1 — Fidelidade pixel a pixel** ao print da festa, verificada por screenshot lado a lado.
- **NFR2 — Tudo editável.** Todo texto/foto vem de campo do painel; nada hardcoded no
  template. Um único campo novo (`pais`); o resto já existe.
- **NFR3 — Reaproveitar.** Componentes de `components/evt/*` e o modelo de dados existente.
  Só a camada de layout do `glamour-rose` muda.
- **NFR4 — Responsivo.** A festa é responsiva (capa mobile "presa na base"); replicar
  desktop + mobile.
- **NFR5 — Acessível.** Contraste do texto creme sobre o hero escuro (passa fácil); foco
  visível; `prefers-reduced-motion` no Ken Burns.
- **NFR6 — Fontes custom viram fallback Google.** `milton`/`vogue` (pagas) → Pinyon Script /
  Cormorant, como já é no sistema e como foi na landing.

## 6. Componentes

| Arquivo | Mudança |
|---|---|
| `components/templates/quinze-anos/glamour-rose/Capa.tsx` | Reescrever para o hero escuro cinematográfico (FR1) |
| `.../glamour-rose/Home.tsx` | Alinhar as seções (FR2–FR4) |
| `.../glamour-rose/Evento.tsx` | Alinhar (FR5) |
| `.../glamour-rose/Presentes.tsx` | Alinhar o card dividido + Pix (FR6) |
| `.../glamour-rose/Galeria.tsx` | Conferir contra o print (FR7) |
| `lib/convite.ts` | Adicionar `pais` ao `ConviteConteudo`, ao schema e a `lerConteudo` (FR10) |
| `app/(dashboard)/painel/[id]/detalhes/*` | Campo `pais` no form (FR10) |
| `app/(dashboard)/painel/acoes.ts` | Persistir `pais` no `customization` (FR10) |
| `app/globals.css` (bloco `.ev`/`--ev-*`) | Só se algum token específico da capa escura faltar |

Recados usa a página/rota já existente (`app/%5Fsites/[sub]/recados`) — sem componente de
template próprio, então FR8 é conferência, não reescrita.

## 7. Mapa de editabilidade (conteúdo da festa → campo do painel)

| Conteúdo na festa | Campo | Onde edita |
|---|---|---|
| Nome da debutante | `title` | detalhes |
| Data / hora | `date` / `time` | detalhes |
| Local + endereço | `local` / `endereco` | detalhes |
| Texto do convite | `mensagem` | detalhes |
| **Pais / assinatura** | **`pais`** (novo) | detalhes |
| Traje | `traje` | detalhes |
| Lista de presentes + Pix | `presentes` | presentes |
| Fotos (capa, galeria) | `fotos` | fotos |
| Programação | `programacao` | programação |

## 8. Testes

- A lógica pura afetada é `lib/convite.ts` (`lerConteudo` passa a devolver `pais`). Estender
  o teste existente de convite: `pais` presente → devolvido; ausente → `undefined`/vazio.
- O visual é verificado por **screenshot**, não teste unitário — é o que importa aqui.

## 9. Verificação

1. `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build` verdes.
2. Rodar o dev, abrir `maria-clara.localhost:3000` em cada página, **capturar e comparar
   lado a lado** com o print correspondente da festa (`scratchpad/festa-<pagina>.png`).
   Iterar até idêntico. O dono aprova vendo.
3. Editar o campo `pais` no painel e ver a linha do convite mudar no site.
4. Testar sem foto (capa cai no gradiente escuro) e `prefers-reduced-motion`.
5. `npx impeccable detect` nas telas — zero anti-padrões.
6. Mobile: conferir a capa e as seções no viewport de celular.

## 10. Fora deste ciclo

- Fluxo de criação (D5), storage, dashboard (já têm seus ciclos).
- Novos templates (casamento/aniversário) — o registro já suporta; entram quando existirem.
