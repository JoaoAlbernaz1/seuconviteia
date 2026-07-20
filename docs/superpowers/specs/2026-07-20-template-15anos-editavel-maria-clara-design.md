# Design — Template de 15 anos 100% editável (clone fiel do site da Maria Clara)

**Data:** 2026-07-20
**Autor:** João (cliente) + Claude
**Status:** Aprovado para virar plano de implementação
**Branch de trabalho:** `backup/dashboard-editor-local-20260720` (linha local, MySQL) — ver §8 (Riscos) sobre reconciliação com produção.

---

## 1. Objetivo (em uma frase)

Transformar o site de convite da **Festa 15 anos Maria Clara** num **template reutilizável e 100% editável** dentro do SaaS **seuconvite**: o visual fica **idêntico ao site da Maria Clara** (clone pixel a pixel) e **todo o conteúdo** que hoje está chumbado passa a ser preenchido pelo cliente, a partir do editor "Criar convite".

**Regra-mestra:** o **template controla o VISUAL** (layout/estrutura fixos = garantem que sempre fique bonito); o **cliente controla o CONTEÚDO** (textos, fotos, cores, dados). Sem "montar layout livre".

**Nicho:** apenas **15 anos** nesta entrega. Casamento/aniversário depois, reusando o mesmo motor.

---

## 2. Contexto — o que já existe (não recomeçar do zero)

A investigação (2026-07-20) confirmou que **~80% da fundação já está construída** no repo `/Users/joaoalbernaz/seuconviteia`:

### 2.1. Backbone data-driven do site do evento (pronto)
- **`Event.customization` (Json)** — campo único que guarda o conteúdo editável do convite. Escrita por **merge de chaves** (`mesclar()` em `app/(dashboard)/painel/acoes.ts`).
- **Adapter `lib/eventoFesta.ts` (`lerEventoFesta`) + `lib/convite.ts` (`lerConteudo`)** — normalizam `Event` + `customization` + relações num objeto `EventoFesta` (validado com Zod, tolerante a lixo).
- **Templates:** `lib/templates.ts` + `components/templates/registro.tsx` — 4 templates, cada um com Home/Evento/Presentes/Galeria próprios. O nosso alvo é **`quinze-anos-glamour-rose`**.
- **Temas (cor):** `lib/temas.ts` — 6 paletas (`rose` padrão, dourado, azul, lavanda, verde, terracota), aplicadas como CSS vars `--ev-*`.
- **Fontes:** `lib/fontes.ts` — 5 duplas (`classica` padrão, romantica, moderna, minimalista, festiva).
- **Copy por nicho:** `lib/textos.ts` — títulos de seção e microcopy **chumbados por `EventType`** (este é um dos alvos a parametrizar).
- **Páginas do site:** `app/%5Fsites/[sub]/{page,evento,galeria,presentes,confirmar,recados,obrigada}` + `agenda/route.ts`. Cada uma resolve o tenant via `carregarEventoFesta(sub)` e renderiza o componente do template.
- **Multi-tenant:** `lib/tenant.ts` resolve `<slug>.dominio` → `Event.subdomain` (`@unique`).
- **Server actions de gravação (funcionam):** em `app/(dashboard)/painel/acoes.ts` — `criarRascunho`, `atualizarDetalhes`, `salvarEstilo`, `salvarRecursos`, `salvarFotos`, `salvarPresentes`, `salvarProgramacao`, `publicarEComemorar`, `excluirEvento`, `adicionarConvidado`, `removerConvidado`.
- **Upload de imagem:** `app/api/upload/route.ts` (multipart autenticado, Zod JPG/PNG/WebP ≤6MB) → `getStorageProvider()`.
- **Preview REAL:** `app/(dashboard)/preview-evento/page.tsx` + `lib/previewEvento.ts` (`eventoDoRascunho`) — já renderiza o site de verdade a partir de um rascunho.
- **Helpers de parsing:** `lib/eventoForm.ts` (`parseRecursos`, `parseProgramacao`, `parsePresentes`, `parseFotos`, `brlParaCents`, `montarMapsUrls`, `semUndefined`).

### 2.2. Os dois problemas centrais (o trabalho real)
1. **Desconexão + duplicação de editores.** Existem DOIS editores:
   - **Editor NOVO (bonito, do "Claude Design" do João):** `app/(dashboard)/painel/criar/CriarConvite.tsx` — 6 passos, prévia iPhone/MacBook. **Estado 100% local, não grava.** A prévia é um **MOCK próprio** (JSX inline, cores roxas fixas), **não** reusa `components/evt/*` nem os templates reais. "Publicar" só abre um modal.
   - **Editor ANTIGO (feio, funcional):** `painel/novo/Wizard.tsx` + `painel/[id]/*` — grava de verdade via `acoes.ts`, preview = site real.
   - **Decisão:** o editor NOVO (bonito) vira o editor de verdade; o preview dele passa a ser o **site real**; ele liga nas server actions (estendidas). O wizard antigo pode ser aposentado depois.
2. **Fidelidade parcial + copy chumbada.** O template `quinze-anos-glamour-rose` é **parecido, não idêntico** ao site da Maria Clara, e muita copy de seção está chumbada nos componentes + `lib/textos.ts`. Além disso, o editor novo coleta **muitos campos que não têm casa** hoje no schema nem no template (ver §5).

### 2.3. A fonte da verdade visual (o que clonar)
Repo `/Users/joaoalbernaz/festa-15-maria-clara`, branch **`build/festa-site`** (Next 16 + Tailwind v4). Características a clonar fiel:
- **Capa cinematográfica** (`components/HeroCinematic.tsx`): 2 fotos (mobile + desktop), Ken Burns, lockup nome + "15 anos".
- **Fontes locais:** Milton One (`--font-script`, nome cursivo), Classy Vogue (`--font-display`, números/datas — **SEM acentos**, gotcha), Cormorant Garamond (corpo), Jost (labels/nav).
- **Paleta rosa** definida em `@theme` do Tailwind v4 (`app/globals.css`): rosa `#E86FA6`, rosa-ink `#B83D6B`, CTA `#CE578B`, blush/ivory `#FBF6F2`, ink `#2E1A20`. ⚠️ Framboesa `#93264A`/`#9b2679` **vetadas**.
- **Seções:** capa → carta/convite (2 parágrafos + assinatura "Adalberto, Ivânia e Maria Clara") → contagem regressiva → Quando & Onde + "Abrir no Maps" → traje → programação (timeline) → CTA → (páginas) presentes+Pix, galeria+lightbox, recados (mural moderado), confirmar (RSVP multi-convidado), obrigada.
- **Interações:** countdown 1s, reveal-on-scroll, Ken Burns, lightbox (teclado/swipe), Pix copiável, RSVP add/remove convidado + barra de progresso.
- ⚠️ **Inconsistência a unificar:** as telas `/confirmar` e `/obrigada` do site da Maria Clara usam uma **paleta local mais escura** (plum/wine), herança do convite antigo. No template, isso deve ser **tematizado** (seguir o tema do convite), não clonado como inconsistência.

---

## 3. Decisões travadas (com o João)

1. **Caminho 1 ("dev sênior"):** trazer o visual exato da Maria Clara para o template do sistema, **ligado ao banco** — não jogar o site inteiro como template paralelo/chumbado.
2. **Clone pixel a pixel** do site da Maria Clara como base do template de 15 anos.
3. **Maria Clara = exemplo/demo pré-preenchido.** Cliente novo começa desse visual e troca o conteúdo.
4. **Escopo editável = TUDO que o editor "Criar convite" mostra** (lista completa em §4). O João confirmou "pode colocar tudo".
5. **Cor e fonte são trocáveis** (padrão = as da Maria Clara: paleta rose + dupla de fontes dela). As outras paletas/fontes prontas ficam como opção.
6. **Editor bonito vira o editor de verdade**, com preview do site real.
7. **Fora de escopo agora:** outros nichos, layout livre, pagamento/cobrança (congelado), e a reconciliação com a produção Postgres (é pré-requisito de publicação, tratado à parte — §8).

---

## 4. Escopo editável completo (contrato com o cliente)

Organizado pelos 6 passos do editor (rótulos = os que aparecem na tela). Este é o **contrato**: todo item abaixo deve ficar realmente editável e refletir no site.

**Passo 1 — Festa:** nome da debutante · data · horário de início · CEP (auto-preenche via ViaCEP) · nome do local · endereço · cidade · UF · link do convite (`slug`) · [Mais detalhes] nome do pai · nome da mãe · horário de término · complemento · link do mapa · traje.

**Passo 2 — Capa e estilo:** foto da capa (trocar/reposicionar/ponto principal/zoom/remover) · texto principal · subtítulo · texto abaixo da capa · tamanho (P/M/G) de cada um dos 3 textos · cor do texto principal · cor dos detalhes · escurecer foto (overlay on/off).

**Passo 3 — Conteúdo (seções):** Mensagem de abertura (título + texto) · Mensagem abaixo da capa (subtítulo + texto) · **Pais e família** (on/off + nome do pai + nome da mãe + texto de apresentação) · Local da festa (texto de apresentação da seção) · **Traje** (on/off + título + descrição) · **Botão principal** (texto acima + texto do botão + ação: Confirmar presença / Ver localização / Ver presentes) · **Rodapé** (mensagem pessoal + nome exibido + data).

**Passo 4 — Confirmação (RSVP), on/off:** data limite · máximo de acompanhantes · toggles de perguntas: permitir acompanhantes / nome dos acompanhantes / telefone / e-mail / restrição alimentar / recado · cores do formulário (usar as do convite ou personalizar → cor do botão) · mensagem para quem confirma · mensagem para quem não pode ir.

**Passo 5 — Presentes e Pix, on/off:** título da lista · texto de apresentação · **lista de presentes** (adicionar / editar / ocultar — nome, valor, quantidade, status) · contribuição com valor livre (on/off + título + valores sugeridos) · **Pix** (QR Code trocar/remover, quem recebe, chave, texto de orientação).

**Passo 6 — Galeria e recados:** Galeria (on/off, adicionar/reordenar/legenda, foto destaque, até 20) · Mural de recados (on/off, **moderação** aprovar/ocultar) · checklist "antes de publicar" · Publicar.

---

## 5. Arquitetura da solução

Cinco frentes. As três primeiras são o miolo.

### 5.1. Fidelidade — reconstruir o template `quinze-anos-glamour-rose` idêntico à Maria Clara
- Portar para dentro do SaaS os **assets** do site da Maria Clara: fontes locais (Milton One, Classy Vogue) e as fotos-demo. Registrar as fontes como a **dupla padrão** do template de 15 anos (via `lib/fontes.ts`), e a paleta rose como padrão (já é).
- Reescrever os componentes do template `quinze-anos-glamour-rose` (Home/Evento/Presentes/Galeria em `components/templates/*`) para **markup/CSS/animações idênticos** aos do site da Maria Clara (`HeroCinematic`, contagem, timeline, lightbox, Pix, etc.), **porém lendo tudo do objeto `EventoFesta`** (props), sem strings chumbadas.
- Unificar a paleta das telas `/confirmar` e `/obrigada` para seguir o tema (remover o plum/wine herdado).
- Preservar gotchas: fuso **-03:00 (Brasília)** no countdown/data; `prefers-reduced-motion`; Classy Vogue só em texto **sem acento**; escala Tailwind v4 (usar `[18px]` etc., não `4.5/5.5`).

### 5.2. Modelo de dados — ampliar `Event.customization`
Manter o padrão de **JSON de chaves + merge**. Presentes/fotos/recados continuam em suas **tabelas** (`GiftItem`/`Photo`/`Recado`). Adicionar as chaves que hoje faltam para cobrir §4:
- `capa`: `{ textoPrincipal, subtitulo, textoAbaixo, tamPrincipal, tamSubtitulo, tamAbaixo, corTexto, corDetalhe, overlay }`
- `pais`: `{ on, pai, mae, texto }`
- `secoes`: títulos/textos editáveis por seção (abertura `{titulo,texto}`, abaixoCapa `{subtitulo,texto}`, local `{texto}`, traje `{on,titulo,descricao}`)
- `botao`: `{ textoAcima, texto, acao }` (acao ∈ confirmar|local|presentes)
- `rodape`: `{ mensagem, nome, data }`
- `rsvpConfig`: `{ on, dataLimite, maxAcompanhantes, perguntas[6 bool], corForm(modo+cor), msgConfirma, msgRecusa }`
- `presentes`: `{ on, titulo, texto, contribuicaoLivre{on,titulo,valores}, pix{qrUrl, orientacao} }` (nome/chave já existem)
- `galeria`: `{ on, destaqueId, legendas{} }` · `recados`: `{ on }`
- `endereco`: adicionar `cidade`, `uf` (hoje viram parte de `local/endereco`).

Atualizar o schema Zod em `lib/convite.ts` / `lib/eventoFesta.ts` para ler essas chaves com defaults = valores da Maria Clara.

### 5.3. Parametrizar a copy (tirar do chumbado)
- Fazer os componentes do template e `lib/textos.ts` lerem os títulos/textos de seção de `customization.secoes` (com fallback = a copy da Maria Clara por nicho). Toda string visível vira: **valor do usuário → senão default do nicho**.

### 5.4. Editor "Criar convite" — ligar de verdade
- **Persistência por passo:** cada passo grava via server action (estender `acoes.ts` com o merge das novas chaves; reusar `salvarFotos/salvarPresentes/salvarProgramacao`). Trocar o estado local por rascunho no banco (reusar/adaptar `criarRascunho`).
- **Upload real** da capa e da galeria (usar `app/api/upload`). QR do Pix idem.
- **CRUD real** de presentes (add/editar/ocultar → `GiftItem`), fotos (`Photo`) e recados (`Recado` + moderação: campo `approved`, ação aprovar/ocultar).
- **Slug real:** checagem de disponibilidade contra o banco (não a lista fake).
- **Publicar real:** `publicarEComemorar` → status `PUBLISHED` → site no subdomínio.
- **Preview = site real:** substituir o mock (`inviteMobile`/`inviteDesktop`) pela renderização do template real dentro do `DeviceFrame` (reusar `eventoDoRascunho`/`preview-evento`, via iframe ou render direto). Some a duplicação.
- **Datas:** trocar os inputs de texto livre por seletor de data/hora, gravando com fuso -03:00.

### 5.5. RSVP e Recados dinâmicos
- O formulário de RSVP (`components/evt/RsvpConvite.tsx`) passa a ler `rsvpConfig` (quais perguntas, data limite, máximo de acompanhantes, cor, mensagens de confirma/recusa) e a seguir o tema.
- Moderação de recados: back de aprovar/ocultar + a UI do passo 6 e do painel operando de verdade.

---

## 6. Unidades de trabalho (para o plano)

Fatias pequenas, cada uma verificável ao vivo (o João decide vendo). Ordem sugerida:

1. **U1 — Fidelidade do template (só visual, com dados-demo Maria Clara):** portar assets/fontes + reescrever `quinze-anos-glamour-rose` idêntico, lendo de `EventoFesta`. Entregável: o site do evento demo idêntico à Maria Clara.
2. **U2 — Ampliar `customization` + Zod + defaults:** novas chaves (§5.2), sem UI ainda. Entregável: dados fluem do banco ao template.
3. **U3 — Parametrizar copy (§5.3).** Entregável: trocar um texto no banco muda o site.
4. **U4 — Editor: passos 1 e 3 gravando (dados + textos/seções)** com preview real. Entregável: editar nome/data/local/carta/pais e ver no site.
5. **U5 — Editor: passo 2 (capa: upload, textos, tamanhos, cores, overlay).**
6. **U6 — Editor: passo 5 (presentes CRUD + Pix + contribuição livre).**
7. **U7 — Editor: passo 4 (RSVP dinâmico) + passo 6 (galeria upload/reordenar + recados moderação).**
8. **U8 — Publicar de verdade + slug real + QA E2E** (criar → publicar → abrir no subdomínio → RSVP grava → recado modera).

*(A reconciliação com produção Postgres — §8 — é uma unidade à parte, pré-requisito de publicar pra valer, fora deste ciclo de feature.)*

---

## 7. Fora de escopo (explícito)

- Outros nichos (casamento, aniversário, bodas, 60).
- Editor de layout livre / arrastar-blocos.
- Pagamento/cobrança (Asaas) — congelado.
- Domínio próprio de produção (`seuconvite.orivya.com.br`) — decisão de infra do João.

---

## 8. Riscos e dependências

1. **Divergência de branch (o maior).** O editor bonito + template vivem na linha **local (MySQL)**; a **produção** roda **Postgres/Supabase** (`seuconviteia-prod`) numa linha divergente (fork em `0c69eb0`). **Plano:** construir e validar esta feature na linha local (o João vê ao vivo); antes de publicar pra valer, fazer a **reconciliação** (portar dashboard+editor+esta feature para a linha Postgres) — é uma tarefa própria, não parte da feature. Registrar backup a cada fatia (já há branch `backup/dashboard-editor-local-20260720` no GitHub).
2. **Assets/fontes da Maria Clara** têm licença? Milton One / Classy Vogue são arquivos locais — confirmar direito de uso ao distribuir como template padrão (senão trocar por equivalentes).
3. **Classy Vogue sem acentos** — só usar em número/data.
4. **Fuso -03:00** no `eventDate`/countdown (Vercel roda UTC).
5. **Tabela `Template` do Prisma é inerte** — o layout vem de `customization.template` (string). Não confundir; não investir nela agora.
6. **Duplicação de preview** — ao migrar o preview do editor para o site real, remover o mock para não manter dois.

---

## 9. Critérios de pronto (definição de sucesso)

- Um usuário cria um convite do zero pelo editor bonito, **preenchendo todos os campos de §4**, vê a **prévia real** batendo com o resultado, e **publica** num subdomínio.
- O site publicado é **visualmente idêntico** ao da Maria Clara (com o conteúdo do usuário).
- Trocar cor/fonte pelas opções prontas funciona; padrão = Maria Clara.
- RSVP grava, presentes/Pix aparecem, galeria e recados (com moderação) funcionam.
- `next build` + `tsc` + lint limpos; testes E2E do fluxo criar→publicar→confirmar passam.
