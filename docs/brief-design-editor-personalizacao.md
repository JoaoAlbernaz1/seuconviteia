# Brief de design — Editor de personalização do seuconviteia ("iCasei, só que fácil")

> Prompt completo para IA externa de design. Saída esperada: MOCKUP navegável em HTML.
> Quando o mockup for aprovado pelo João, o Claude Code replica FIEL no produto.

---

Você é um designer de produto sênior. Sua tarefa é desenhar, em **alta fidelidade**, as telas do editor de personalização de um SaaS brasileiro chamado **seuconviteia**. A referência de acabamento é **SaaS profissional de verdade** — pense na densidade calma e na tipografia impecável de produtos como Linear, Stripe e Notion, aplicadas à identidade visual descrita abaixo. Leia TODO este brief antes de começar. Não invente nada fora do que está aqui.

## 1. Contexto do produto

O **seuconviteia** é um SaaS B2B: **profissionais de eventos** (cerimonialistas, assessorias, fotógrafos) **assinam um plano mensal** (Básico, Clássico ou Premium) e criam **sites de evento** para os clientes deles — casamento, 15 anos, 60 anos, bodas e aniversário. Cada site sai num subdomínio próprio (`nomedafesta.seuconviteia.com`) e é um convite digital premium: capa cinematográfica com foto e nome em fonte cursiva, contador regressivo, programação, lista de presentes com Pix, galeria, mural de recados e confirmação de presença (RSVP).

**Modelo de negócio: assinatura por conta.** O plano da conta define quais recursos os sites podem ter (Básico → convite completo + RSVP · Clássico → + mural de recados + galeria · Premium → + marca própria/white-label + domínio próprio). Fazer upgrade é uma ação **da conta** (mexe na mensalidade e vale para todos os eventos), não uma compra avulsa por site. Não invente preços.

O concorrente de referência é o **iCasei** — mas nossa promessa é ser **muito mais fácil**. A filosofia do produto é **curadoria total**: o usuário nunca "monta" nada tecnicamente; ele **escolhe entre combinações prontas e bonitas** (template, paleta de cores, dupla de fontes) e **vê o resultado na hora**. É impossível deixar o site feio.

O usuário das telas é o profissional de eventos — muitas vezes **leigo em tecnologia** e trabalhando **do celular**. Tudo precisa ser didático: linguagem simples, zero jargão, cada controle com uma explicação de uma linha.

## 2. O que já existe — e o que MUDA

**Permanece (já aprovado, não redesenhar):**
- **Sidebar escura** (azul-tinta `#0F172A`) do painel, com a marca no topo, grupos de navegação ("Painel": Visão geral, Eventos, Convidados, Lista de presentes · "Conta": Meu perfil, Plano) e card do plano com gradiente na base.
- **Topbar clara** com busca, botão "Criar evento" e identidade do usuário.
- O conceito do **editor com preview ao vivo**: controles de um lado, **site do evento em moldura de celular** do outro, reagindo instantaneamente. Cabeçalho com voltar, status (Rascunho/Publicado), Pré-visualizar, Publicar e Salvar.

**MUDA (é o coração deste redesign):**
- Hoje o editor tem **um item de navegação para cada recurso** (Confirmar presença, Mural de recados, Álbum, Domínio próprio...). **Isso morre.** Recurso não é página de navegação.
- A navegação lateral do editor passa a ter **só 5 itens, fixos e limpos**:
  1. **Informações** — nome do evento, tipo de festa, data/hora, local, endereço, traje
  2. **Estilo** — template + paleta + dupla de fontes
  3. **Textos** — mensagem de boas-vindas, programação, textos das seções (com botão "✨ Sugerir")
  4. **Fotos** — capa, álbum, foto da lista de presentes
  5. **Recursos do site** — UMA tela única que estrutura todos os recursos/upsells (detalhada na seção 4d)

## 3. Identidade visual (obrigatória, sem desvios)

**Painel (marca do SaaS):**
- Cores: tinta `#0F172A` (estrutura/sidebar), turquesa `#2DE2E6` (acento vivo), teal `#0EA5A6` (apoio), **violeta `#6D28D9` (CTA principal)**, névoa `#F1F5F9` (fundo), lilás `#EDE9FE` (superfícies), texto suave `#64748B`.
- Gradientes: `135deg turquesa → teal → violeta` (símbolos/acentos) e `90deg teal → violeta` (só para texto, ex. o "ia" do wordmark).
- Fontes: **Fraunces** (títulos, serif com itálico) + **Sora** (UI e corpo). Wordmark: `seuconvite` + `ia` em gradiente + `.com`, em Sora minúsculas.
- Tom: premium, limpo, profissional — sem "cara de template de IA", sem badges gritando, sem excesso de cor.

**Site do evento (o que aparece DENTRO do preview de celular):**
- NÃO usa a marca do SaaS. É tematizado pela paleta do evento. Use como evento de exemplo: **"Maria Clara — 15 anos"**, paleta **rose** (rosa suave, fundo claro, dourado discreto), capa escura cinematográfica com foto da debutante, nome em fonte **cursiva** grande e "15 ANOS" em serifada display, contador regressivo, cards claros nas seções internas.

## 4. A spec do que o design precisa cobrir (modelo de personalização v1)

Tudo curado, tudo com preview ao vivo:

### 4a. ESTILO — as 3 escolhas visuais
1. **Template** — galeria de modelos do site. Na v1 existe 1 template pronto ("Clássico") e espaços "Em breve"; o design deve mostrar a galeria como ficará com ~6 templates: cards grandes com **miniatura visual real do site**, nome, descrição de uma linha e tag de estilo. Dá para trocar de template depois sem perder nenhum dado preenchido.
2. **Paleta de cores** — 6 paletas prontas em swatches: Rose, Dourado, Azul, Lavanda, Verde, Terracota. Clicou, o preview inteiro re-tinge na hora.
3. **Dupla de fontes** — ~5 estilos nomeados: **Clássica** (cursiva + serifada), **Romântica**, **Moderna**, **Minimalista**, **Festiva**. Regra de ouro: o cliente NUNCA vê nome técnico de fonte numa lista; cada opção é um card mostrando **o nome real do evento dele** ("Maria Clara") renderizado naquele estilo. Escolher um estilo troca em conjunto: fonte do nome na capa + títulos + textos.

### 4b. TEXTOS
Mensagem de boas-vindas, programação (linha do tempo de horários), textos-chave das seções. Campos com botão "✨ Sugerir" que preenche um texto pronto conforme o tipo de festa.

### 4c. FOTOS
Foto de capa, álbum (galeria) e foto da lista de presentes — upload com preview e dica de dimensão ideal em linguagem humana.

### 4d. RECURSOS DO SITE — a tela única (o coração do redesign)

Uma única tela, estilo "gerenciador de recursos" de SaaS profissional, que estrutura TODOS os recursos do site num só lugar. Nada de navegação por recurso, nada de espalhar upsell pelo produto.

- **Lista/grade de cards de recurso**, cada um com: ícone, nome, **explicação de UMA linha do que o convidado vê**, e um **toggle** liga/desliga. Recursos: Confirmação de presença (RSVP) · Mural de recados · Galeria de fotos · Lista de presentes + Pix · Contador regressivo · Programação.
- **Recurso incluído no plano** → toggle livre; desligou, some do site na hora (refletir no preview).
- **Recurso fora do plano** → o card aparece normalmente (é vitrine), porém em estado bloqueado elegante: cadeado discreto + badge do plano que o inclui ("Clássico" / "Premium"). Sem tom de propaganda, sem card apagado/morto.
- **Upgrade em UM lugar só**: uma faixa/banner único e sóbrio no topo da tela — "Seu plano: Básico · O Clássico desbloqueia mural de recados e galeria" — com um botão "Ver planos" que leva à página Plano da conta. **Nenhum botão de upgrade por card.** Clicar num recurso bloqueado pode abrir um popover/modal explicando o recurso com o mesmo CTA único.
- Recursos que dependem de configuração (ex.: Lista de presentes precisa da chave Pix) mostram, quando ligados, um link discreto "Configurar" que leva à seção correspondente — a configuração NÃO mora nesta tela.
- Comunicar sutilmente que upgrade é da **conta** (vale para todos os eventos), não do site individual.

## 5. As dores do iCasei que o design precisa MATAR (nossos diferenciais)

| Dor real dos usuários do iCasei (Reclame Aqui) | O que o seu design deve comunicar |
|---|---|
| Edita "às cegas" num painel e só vê o site clicando em pré-visualizar | **Preview ao vivo SEMPRE visível** ao lado dos controles, com alternador celular/computador |
| Formatação que "não pega" (negrito que some, tamanho errado) | O preview é a verdade: o que se vê é exatamente o que publica |
| "Não consigo posicionar/editar sem chamar o suporte, que demora dias" | **Autosserviço total**: todo controle é autoexplicativo, com resultado imediato; nenhum caminho termina em "fale com o suporte" |
| Editor rígido e ao mesmo tempo complexo (CSS avançado com classes instáveis) | Curadoria: poucas escolhas, todas bonitas — **decidir menos, errar zero** |
| Convite/capa engessado, sem identidade própria | A capa re-tinge por completo: template + paleta + fontes + foto do cliente |

## 6. Telas a entregar

1. **Galeria de templates** — passo dentro da criação do evento (como descrito em 4a.1).
2. **Editor — seção "Estilo"** — o editor com a navegação de 5 itens à esquerda e a seção Estilo ativa: template atual (com "trocar"), as 6 paletas em swatches, os 5 cards de dupla de fontes com "Maria Clara" renderizado; preview de celular à direita mostrando a capa do evento reagindo.
3. **Editor — seção "Recursos do site"** — a tela única descrita em 4d, vista por um usuário do plano **Básico**: RSVP/contador/programação/presentes ligáveis; mural de recados e galeria bloqueados com badge "Clássico"; banner único de upgrade no topo.
4. **Versões mobile (390px)** das telas 2 e 3 — como o editor colapsa num celular (ex.: preview vira botão flutuante "Ver site" ou aba), mantendo tudo utilizável com uma mão.

Bônus (se couber): tela de **primeiro acesso** com checklist "Primeiros passos" (criar evento → personalizar → publicar → compartilhar).

## 7. Formato de entrega (obrigatório)

- **HTML estático auto-contido**: um único arquivo `.html` (ou um por tela) com CSS embutido, **sem nenhuma dependência externa** (sem CDN, sem framework, sem imagem externa — use placeholders desenhados em CSS/SVG inline para fotos).
- Desktop em 1440px + as versões mobile pedidas.
- **Textos reais em português brasileiro** (nada de lorem ipsum) — use o evento de exemplo "Maria Clara — 15 anos" e linguagem didática nos rótulos e explicações.
- É um **mockup para aprovação visual**, não código de produção: capriche na fidelidade visual; não precisa de JavaScript funcional (estados podem ser mostrados lado a lado ou em telas separadas).

## 8. O que NÃO desenhar (fora da v1, de propósito)

Reordenar ou renomear seções, música de fundo, editor de texto rico (negrito/itálico livre), posicionamento livre de elementos, CSS customizado, enquetes, criação de páginas novas, upgrade/compra por evento individual. Se sentir falta de algo disso, resista — a facilidade vem de decidir menos.
