# Fluxo de criação de evento (estilo iCasei) — design

**Data:** 2026-07-10
**Repo:** `JoaoAlbernaz1/seuconviteia`
**Referência:** 11 screenshots do fluxo real do iCasei (área de trabalho do dono, `Screenshot_1..11`), analisados tela a tela.
**Status:** aprovado pelo dono nas decisões-chave; aguardando revisão do spec.

---

## 1. Contexto

Hoje existe `app/(dashboard)/painel/novo/Wizard.tsx`: 4 passos (Ocasião · Modelo · Detalhes · Publicar), herança visual "DARK", cria um **rascunho**, e a foto entra só no editor. Funciona, mas não tem o encanto guiado que o dono quer.

O dono pediu para replicar o **estilo iCasei**: logo após o login, um formulário guiado que coleta o essencial e faz **o site nascer no ar**. A referência foi capturada em 11 telas e mapeada abaixo.

### O fluxo do iCasei (as 11 telas) e a decisão para cada uma

| # | Tela iCasei | Decisão no nosso sistema |
|---|---|---|
| 1 | Escolher plano / checkout **antes** do formulário | **Pular.** Pagamento está congelado; o plano vem no cadastro (BASICO padrão). |
| 2+3 | "Nome do seu amor" + "Como exibir os dois nomes" | **Adaptar para um nome.** Casamento tem casal; 15 anos tem a debutante. Um campo: **Nome da debutante**. |
| 4 | "Quando será o Grande Dia?" — data (+ "Ainda não definimos") | **Adotar.** Ver §7.1 sobre o "não definimos" (nosso banco exige data). |
| 5 | "Qual estilo combina?" — Clássico/Campo/Moderno/Praia/Rústico/Me surpreenda | **Fundir com a #6** (ver abaixo). |
| 6 | "Principais cores?" — até 2 cores nomeadas | **Fundir #5+#6 numa tela "Escolha um clima".** Nosso modelo são temas nomeados (rose, dourado, azul, lavanda, verde), não geração livre por cor. Há **um** template de 15 anos. |
| 7 | Imagem de capa — upload (+ "Vamos escolher depois") | **Incluir.** É central ao reveal. Storage consertado em paralelo; o "escolher depois" é a rede de segurança. Ver §7.2. |
| 8 | "Crie o endereço" — slug sugerido + checa disponível | **Adotar.** `gerarSlugUnico` já garante unicidade na sugestão. |
| 9+10 | "Preparando um site incrível…" → "Uau! Já está no ar!" | **Adotar.** É o encanto. Loading → reveal do site nascido. |
| 11 | Painel com stats + checklist "Comece por aqui" | **Já temos** o "Meus eventos" (remodelado hoje). O checklist "Comece por aqui" fica como melhoria futura, não neste ciclo. |

### O padrão de UX do iCasei (replicar fiel)

Uma **pergunta por tela**. Layout dividido: imagem inspiradora à esquerda, um único foco à direita. Barra de progresso fina no topo, seta de voltar, um emoji, e microcopy que acalma ("Você pode mudar depois :)"). Botão primário grande; um link secundário discreto para pular/escapar. É isso que dá a sensação de leveza — a antítese de um formulário denso.

## 2. Objetivo

Substituir o wizard atual por um **fluxo guiado estilo iCasei**, para 15 anos, que começa logo após o login de quem não tem evento, coleta o mínimo, e **faz o site nascer publicado** — terminando no reveal "já está no ar" e levando ao painel.

## 3. Requisitos Funcionais (FR)

- **FR1 — Entrada automática.** Após o login, se o profissional tem **zero eventos**, ele entra direto no fluxo guiado (não na lista vazia). Com um ou mais eventos, vê o "Meus eventos".
- **FR2 — Uma pergunta por tela**, na ordem: (a) Nome da debutante; (b) Data do evento; (c) Clima (tema+letras); (d) Foto de capa; (e) Endereço do site.
- **FR3 — Nome da debutante.** Um campo de texto, com exemplo no placeholder e microcopy "você pode mudar depois". Obrigatório para avançar.
- **FR4 — Data.** Seletor de data amigável (não input cru). Ver §7.1 para o caso "ainda não definimos".
- **FR5 — Clima.** Uma tela que funde estilo+cor do iCasei: o usuário escolhe entre os temas curados (paleta + dupla de letras) que existem para 15 anos. Uma opção "Me surpreenda" escolhe um ao acaso. Pré-visualização do nome renderizado no tema.
- **FR6 — Foto de capa.** Upload da capa, com formatos e limite exibidos. Um link "Escolher depois" que pula sem bloquear (a capa cai no gradiente do tema). Ver §7.2.
- **FR7 — Endereço.** Campo de slug **pré-preenchido** a partir do nome (via `gerarSlugUnico`, já disponível), editável, com checagem de disponibilidade ao editar. Prefixo do domínio visível.
- **FR8 — Nascer no ar.** Ao concluir, o evento é criado já como **`PUBLISHED`** (decisão do dono), não como rascunho.
- **FR9 — Loading → Reveal.** Uma tela de transição ("Preparando um site incrível…") seguida do reveal ("Uau! Já está no ar!") mostrando o site real nascido (desktop + mobile), com botão "Acessar painel".
- **FR10 — Voltar e progresso.** Toda tela (exceto a primeira) tem voltar; uma barra de progresso mostra o avanço. Os dados digitados sobrevivem ao voltar.
- **FR11 — Só 15 anos.** Por ora, a única ocasião é 15 anos, então **não há tela de "Ocasião"**. O fluxo entra direto no nome.

## 4. Requisitos Não-Funcionais (NFR)

- **NFR1 — Extensível a novos templates/ocasiões (o pedido central do dono).** O fluxo lê ocasiões e templates do registro `lib/templates.ts` (já orientado a dados). Regras:
  - A tela de **Ocasião** aparece automaticamente quando houver **mais de uma** ocasião habilitada. Hoje há uma (15 anos) → a tela não aparece.
  - A tela de **Modelo** aparece quando a ocasião tiver **mais de um** template. Hoje 15 anos tem um → colapsa na escolha de clima.
  - Adicionar "Casamento" depois = acrescentar registros em `TEMPLATES`; as telas reaparecem **sem reescrever código de tela**.
- **NFR2 — Marca clara/amarela.** Mata a herança "DARK". Coerente com o painel remodelado (roxo `#7A40ED`, amarelo `#F5FF63`, preto `#19171C`). A imagem inspiradora à esquerda substitui o azul do iCasei.
- **NFR3 — Storage em paralelo.** A foto de capa (FR6) depende do Vercel Blob, hoje quebrado. O conserto do storage é tarefa **paralela** e pré-requisito da FR6 funcionar de verdade; o "Escolher depois" garante que o fluxo nunca trave se o storage atrasar.
- **NFR4 — Reaproveitar o que existe.** `criarRascunho` (adaptado para publicar), `gerarSlugUnico`, o registro de `TEMPLATES`, `CapaEvento` (gradiente do tema como fallback), o preview do site (`/preview-evento`).
- **NFR5 — Acessível.** Foco visível, navegação por teclado no fluxo, contraste AA. O amarelo só como fundo com tinta preta.
- **NFR6 — Responsivo.** O layout dividido vira empilhado no celular (imagem no topo ou omitida, foco embaixo). Muita gente cria pelo telefone.
- **NFR7 — PT-BR.** Toda a copy em português, no tom acolhedor do iCasei.

## 5. Componentes

O `Wizard.tsx` de hoje (365 linhas, tudo num arquivo) é reescrito como um fluxo de passos isolados. A lógica pura sai para `lib/`, testada.

| Arquivo | Responsabilidade |
|---|---|
| `lib/fluxoCriacao.ts` (novo, puro) | Deriva a sequência de passos a partir do registro de templates (NFR1): decide se "Ocasião"/"Modelo" aparecem. Testado. |
| `lib/fluxoCriacao.test.ts` (novo) | 1 ocasião → sem passo de ocasião; 1 template → sem passo de modelo; N → aparecem. |
| `app/(dashboard)/painel/novo/FluxoCriacao.tsx` (reescrito) | Orquestra os passos, o progresso, o voltar e o estado. Client. |
| `app/(dashboard)/painel/novo/_passos/*.tsx` (novos) | Um componente por tela: `PassoNome`, `PassoData`, `PassoClima`, `PassoCapa`, `PassoEndereco`. Cada um recebe valor + onChange + onAvancar. |
| `app/(dashboard)/painel/novo/_passos/Moldura.tsx` (novo) | O chassi comum: imagem à esquerda, foco à direita, progresso, voltar, emoji, microcopy. Todos os passos vivem dentro dele. |
| `app/(dashboard)/painel/novo/Revelacao.tsx` (novo) | Loading → reveal ("já está no ar") → "Acessar painel". |
| `app/api/slug-disponivel/route.ts` (novo) | Checagem de disponibilidade do slug editado (FR7). |
| `app/(dashboard)/painel/acoes.ts` (modificar) | `criarRascunho` (assinatura `useActionState`: `prevState, formData`) passa a ler um campo `publicar` do `FormData` e, se presente, cria `PUBLISHED` em vez de `DRAFT` (FR8). Sem mudar a assinatura. |
| `app/(dashboard)/painel/page.tsx` (modificar) | FR1: zero eventos → redireciona ao fluxo. |

## 6. Fluxo de dados

1. Login → `/painel`. Se zero eventos → redireciona a `/painel/novo` (FR1).
2. O usuário atravessa os passos; o estado vive no cliente (`FluxoCriacao`).
3. No último passo, um `submit` chama `criarRascunho` com um campo oculto `publicar` no `FormData`. O evento nasce `PUBLISHED`, com nome, data, tema, letras, template (o único de 15 anos), slug e — se houver — a URL da capa.
4. A tela `Revelacao` mostra o loading e depois o site real (reaproveitando o preview), com "Acessar painel".
5. "Acessar painel" → `/painel/<id>` (o editor) ou `/painel` (a lista, agora com um evento).

## 7. Decisões e casos delicados

### 7.1 Data "ainda não definimos"

O iCasei deixa pular a data. Mas nosso `expiresAt` é derivado da data do evento (`calcularExpiracao`), e o site expira 30 dias depois. Sem data, não há como calcular expiração.

**Decisão:** por ora, a data é **obrigatória** no fluxo de 15 anos (a festa já tem data). O "ainda não definimos" fica fora deste ciclo; se for pedido, exige tornar `eventDate`/`expiresAt` nuláveis no schema — mudança de banco, ciclo próprio.

### 7.2 Foto de capa vs storage quebrado

Decisão do dono ("preze pela experiência"): a foto **entra no fluxo**, porque é o que faz o reveal "já está no ar" ter impacto. Três camadas de segurança:
- O storage (Vercel Blob) é consertado em **paralelo** (o `TODO` já está escrito em `lib/storage/index.ts`).
- Enquanto não estiver pronto, o link **"Escolher depois"** (que o iCasei tem) é o caminho que funciona.
- Um site que nasce sem foto usa o **gradiente do tema** como capa (o `CapaEvento` já faz isso) — o reveal continua bonito, e a primeira tarefa no editor vira "adicione sua foto".

### 7.3 Nascer publicado

Decisão do dono: o site nasce `PUBLISHED` (igual iCasei), não rascunho. Consequência: um site de 15 anos vai ao ar com nome, data, tema e capa (foto ou gradiente) — conteúdo mínimo, mas legítimo e público na hora. O resto (mensagem, presentes, álbum) entra no editor com o site já no ar.

### 7.4 Estilo + Cores fundidos

O iCasei separa "estilo" (arquétipo) e "cores" (até 2). Nosso modelo é mais simples: temas nomeados que já combinam paleta + letras. Fundir as duas telas numa — "Escolha um clima" — é mais fiel ao **nosso** modelo e evita uma tela redundante. Quando houver mais templates, essa tela pode crescer.

## 8. Testes

Vitest, funções puras, sem tocar o banco (convenção dos 24 arquivos atuais).

- `lib/fluxoCriacao.test.ts` — a derivação de passos por quantidade de ocasiões/templates (NFR1).
- Extrair a validação de cada passo (nome não-vazio, data válida, slug válido) para funções puras testadas, em vez de deixá-las no componente.
- O comportamento visual (o reveal, o layout dividido, a barra de progresso) é verificado por **screenshot autenticado** (via CDP) e aprovação do dono — não por teste unitário.

## 9. Verificação

1. `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build` verdes.
2. Screenshot de cada passo (via CDP autenticado), comparado com as 11 telas do iCasei.
3. Percorrer o fluxo ponta a ponta com a conta `vazio@` (zero eventos): login → fluxo → site nasce → reveal → painel com um evento.
4. Confirmar que o evento nasce `PUBLISHED` e que o site público responde na hora.
5. Testar o "Escolher depois" da capa: o site nasce com o gradiente do tema, sem erro.
6. `npx impeccable detect` nas telas novas: zero anti-padrões.

## 10. Fora deste ciclo

- **Storage (Vercel Blob).** Pré-requisito paralelo da FR6; ciclo próprio, mas deve andar junto.
- **"Ainda não definimos" a data** (§7.1) — exige schema nulável.
- **Checklist "Comece por aqui"** do painel (tela 11 do iCasei) — melhoria futura.
- **Editor (D7)** — personalizar mensagem, presentes, álbum; é onde a foto realmente importa e onde o storage é indispensável.
- **Ocasião "Casamento"/"Aniversário"** — habilitar no registro quando os templates existirem; o fluxo já estará pronto (NFR1).
