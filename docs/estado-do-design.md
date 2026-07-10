# Estado do design — seuconviteia (para remodelagem)

Documento de handoff: descreve **o design ATUAL** do produto para uma IA/designer
remodelar. Não é código — é o mapa das telas, dos sistemas visuais e dos pontos
que o dono NÃO gostou.

## 1. O produto

SaaS B2B ("iCasei multi-nicho"): profissionais e pessoas físicas criam **sites de
convite digital** para **casamento, 15 anos e aniversário**. Cada site tem: capa,
convite, data/local, contador, programação, presentes com Pix, galeria, mural de
recados, confirmação de presença (RSVP), botão "adicionar à agenda", e páginas
internas (/evento, /presentes, /galeria, /recados, /confirmar, /obrigada).

Stack: Next.js 16 + React + TypeScript + Tailwind v4 + Prisma + MySQL. Publicação
por subdomínio (`<cliente>.seuconviteia.com`).

## 2. DOIS sistemas visuais (importante para a remodelagem)

Existem **dois** designs separados — a remodelagem pode mexer em um ou nos dois:

### (A) O PAINEL (dashboard onde o profissional trabalha)
- Marca: **turquesa + roxo**, fontes Fraunces + Sora.
- Tema **ESCURO** por padrão (tokens `scv-*`: `scv-ink`, `scv-card`, `scv-line`,
  `scv-muted`, `violeta`, `teal`, `scv-lilac`…), com tema claro alternável.
- Topbar central com abas (Meus eventos / Perfil / Plano). Sem sidebar.
- **É AQUI que estão as telas que o dono achou "feias"** (seleção de modelo,
  seleção de data/hora no wizard).

### (B) O SITE DO EVENTO (o convite que os convidados veem)
- Sistema `.evt` com tokens `--ev-*` (paleta re-tingível: rose/dourado/azul/
  lavanda/verde/terracota) + fontes por dupla (`--ev-font-*`).
- **9 templates** com layout PRÓPRIO cada (ver seção 5). Este design foi refeito
  recentemente e é separado do painel.

## 3. Telas do PAINEL (o que existe hoje)

| Rota | O que é |
|---|---|
| `/entrar` | Login/cadastro (card premium sobre névoa turquesa/violeta) |
| `/painel` | **Meus eventos** — saudação + card "Criar novo evento" + card por evento (capa+status). Vazio = só o "Criar novo evento". |
| `/painel/novo` | **Wizard de criação** (passos: 1 Ocasião · 2 Modelo · 3 Detalhes · publicar). **Passo 3 tem a seleção de data/hora que o dono achou feia** (inputs nativos `date`/`time`). |
| `/painel/[id]` | Acompanhar o evento (KPIs, confirmações, tirar do ar) |
| `/painel/[id]/detalhes` | Editar nome/data/local/mensagem/traje |
| `/painel/[id]/estilo` | **Trocar o estilo** — cards de template + cor livre + fonte + preview iPhone/Mac |
| `/painel/[id]/fotos` | Upload de fotos |
| `/painel/[id]/presentes` | Lista de presentes + Pix |
| `/painel/[id]/programacao` | Programação (hora/atividade) |
| `/painel/[id]/recursos` | Ligar/desligar módulos (RSVP/recados/galeria/…) |
| `/painel/[id]/convidados` | Lista manual de convidados |
| `/painel/[id]/publicar` · `/publicado` | Checklist + publicar + celebração |
| `/painel/perfil` · `/painel/plano` | Conta e plano |

## 4. Fluxo de criação (wizard atual)

1. **Ocasião** — Casamento / 15 anos / Aniversário (3 cards).
2. **Modelo** — cards dos 3 templates da ocasião (thumbnail + nome + descrição).
3. **Detalhes** — nome, **data (input nativo)**, **horário (input nativo)**, local,
   mensagem, endereço do site + preview ao vivo à direita.
4. Publicar — checklist + link.

> **PONTO QUE O DONO NÃO GOSTOU:** os campos de **data e horário** usam os inputs
> nativos do navegador (`<input type="date">` / `<input type="time">`), que são
> feios e sem identidade. Remodelar para algo bonito (calendário/seletor próprio,
> ou pelo menos inputs bem estilizados, grandes, com máscara e visual da marca).

## 5. Sistema de templates (site do evento) — refeito

- Registro: `lib/templates.ts` (metadados: id, nome, ocasião, categoria, **tags**,
  paleta/fonte padrão, plano, `editableGroups`) + `components/templates/registro.tsx`
  (mapa `id → {Home, Evento, Presentes, Galeria}`). Site público e preview usam o
  mesmo registro. Fallback = `casamento-classico-elegante`.
- **9 templates, cada um com corpo próprio** (Home + páginas internas com suas
  próprias seções — não compartilham miolo):
  - **Casamento:** `classico-elegante` (off-white/dourado, arco, serifa) ·
    `editorial-moderno` (revista, assimétrico) · `noite-luxo` (**escuro/black-tie**).
  - **15 anos:** `glamour-rose` (rosé/glossy, "15" gigante) ·
    `fashion-editorial` (moda/caps/assimétrico) · `princesa-delicado` (oval/floral).
  - **Aniversário:** `adulto-elegante` (neutro/moderno) · `infantil-ludico`
    (blobs/confete) · `tropical-festa` (gradientes vivos/orgânico).
- Ver ao vivo (dev): `<classico|editorial|noite|glamour|fashion|princesa|adulto|
  infantil|tropical>-demo.localhost:3000` (+ `/evento`, `/presentes`, `/galeria`).

## 6. PROBLEMA das FOTOS de demonstração (precisa de decisão)

- Até agora, o preview/demo dos templates usava as **fotos da Maria** (uma pessoa
  real, do `/public/exemplo/`). O dono **não quer a Maria** aparecendo como
  demonstração — quer **fotos de OUTRAS pessoas, SEM direitos autorais**, mas COM
  foto (o template povoado).
- **Já removi a Maria** (demos e preview agora mostram o empty-state do template).
- ⚠️ **Trava honesta:** eu (assistente) **não consigo baixar fotos de banco de
  imagens nem gerar fotos** de dentro do ambiente. Para ter "fotos de outras
  pessoas sem direitos autorais" é preciso um **conjunto CC0** (ex.: Pexels/Unsplash
  licença livre, ou geradas por IA de imagem, ou do próprio dono). Assim que esse
  conjunto existir em `/public/templates-demo/<ocasiao>/`, o seam `lib/demoFotos.ts`
  já está pronto para povoar os templates.
- **Ação sugerida:** o dono (ou a IA de imagem) fornece 3–6 fotos por ocasião
  (casal, debutante, adulto, criança) com licença livre → wire imediato.

## 7. O que o dono quer (direção da remodelagem)

- Cara de **SaaS premium**, não de sistema administrativo/ERP.
- Seleção de modelo como **galeria profissional** (abas por ocasião, filtros por
  estilo, busca, cards com preview, "Visualizar" antes de escolher).
- Tela de **"Personalizar layout"** (sidebar: Capa/Fontes/Cores/Menu/Módulos/
  Conteúdo/CSS avançado + preview grande ao vivo, com desktop/tablet/mobile).
- Data/hora **bonitos** (não os inputs nativos).
- Fotos de demonstração de **outras pessoas, sem direitos autorais**.
- Espaçamento generoso, cards bonitos, previews fortes, estados vazios bem escritos,
  badges elegantes, microtextos úteis.

## 8. Fundação já pronta para a galeria/personalização

`lib/templates.ts` já expõe: `tagsDoTemplate(id)`, `ESTILOS_FILTRO` (8 chips de
estilo), `templatesFiltrados(ocasiao, {tag, busca})`, `GRUPOS_EDICAO`, e os tipos
`TemplateTag` / `TemplateEditableGroup` / `TemplatePreviewMode`. A galeria e o
estúdio de personalização podem ser construídos em cima disso.
