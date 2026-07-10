# Brief de design — Dashboard "Meus eventos" (para IA externa)

> **Como usar:** cole a seção **PROMPT** inteira numa IA de design (Claude, v0, Lovable…).
> Ela devolve o HTML/CSS. Eu porto 1:1 para o Next.js, como fiz com a landing.
>
> Gerado em 2026-07-10, a partir do código real de `app/(dashboard)/painel/page.tsx`.

---

## Decisão que você precisa tomar antes de colar

O prompt abaixo assume que **o painel adota a identidade da landing** (amarelo `#F5FF63`,
roxo `#7A40ED`, preto `#19171C`). Hoje ele usa outra paleta — violeta `#6d28d9` e teal
`#0EA5A6` — e nem o roxo é o mesmo roxo. Quem se cadastra vê uma marca e entra em outra.

Se você preferir manter o painel como está, troque a seção **2. Marca** por: *"mantenha
os tokens atuais: fundo `#f3f5f9`, cards `#ffffff`, tinta `#0f172a`, acento violeta
`#6d28d9`, apoio teal `#0EA5A6`"*. Nada mais muda.

---

# PROMPT

Você vai desenhar **uma tela**: a home do painel de um SaaS brasileiro chamado
**seuconvite.ia**. Entregue HTML + CSS puros, num arquivo único, sem framework.

## 1. O produto, em três frases

O seuconvite.ia cria **sites de convite digital** (casamento, 15 anos, aniversário). Cada
evento vira um site próprio, num subdomínio (`maria-clara.seuconviteia.com`), com
confirmação de presença, lista de presentes no Pix, galeria e mural de recados.

Quem usa o painel é de dois tipos, com o **mesmo login**: a pessoa que faz o site do
próprio casamento, e o **cerimonialista** que faz sites para vários clientes.

A tela que você vai desenhar é a **primeira coisa que essas pessoas veem depois de entrar**.

## 2. Marca

- Acento: amarelo **`#F5FF63`**
- Roxo da marca (o `.ia` do logo): **`#7A40ED`**
- Preto: **`#19171C`**
- Cinza de superfície: **`#F2F1F3`**
- Fundo: branco
- Display (títulos): grotesca pesada — use **Hanken Grotesk**
- Corpo: **Inter**

Tema **claro apenas**. O modo escuro foi removido do produto de propósito; não invente um.

## 3. Requisitos funcionais (o que a tela precisa mostrar e permitir)

### 3.1 Topo

Navegação com três destinos: **Meus eventos** (esta tela), **Perfil**, **Plano**. Mais o
nome do usuário e **Sair**.

### 3.2 Saudação e resumo

Saudação pelo primeiro nome ("Olá, Maria"). Abaixo, três números agregados de todos os
eventos da conta:

- quantos **sites estão no ar**
- quantas **presenças confirmadas**
- quantos **recados** recebidos

Hoje isso é uma frase corrida (`1 site no ar · 1 presença confirmada · 4 recados`).
Você pode manter, ou transformar em algo mais legível — mas **não invente métricas que o
produto não tem** (nada de "visitas", "conversão", "receita").

### 3.3 A grade de eventos

Um card para **criar novo evento** (leva a um assistente de 4 passos) e um card por evento.

Cada card de evento mostra:

- **Capa**: a foto do evento. Se não houver foto, um gradiente na paleta escolhida pelo
  cliente para aquele evento. Sobre a capa, o nome do evento numa fonte decorativa (cada
  evento tem sua própria dupla de fontes — o card é uma miniatura do site real).
- **Selo de status**, canto superior da capa.
- **Tipo e data**: "15 anos · 07 de set. de 2026".
- **Uma linha de contexto**, que muda conforme o estado (ver 3.4).
- **Um botão de ação**, que muda conforme o estado.

### 3.4 Os quatro estados de um evento — desenhe todos

| Estado | Selo | Linha de contexto | Botão |
|---|---|---|---|
| **Rascunho** (não publicado) | "Em preparação" | "Continue de onde parou — falta pouco" | "Continuar montando" (ação primária) |
| **No ar**, tudo pronto | "No ar" | "3 convidados confirmaram" | "Ver e editar" (ação secundária) |
| **No ar**, faltando algo | "No ar" | "3 convidados confirmaram · faltam as fotos" | "Ver e editar" |
| **Expirado** | "Expirado" | "Este site saiu do ar em 07 de out. de 2026" | "Ver e editar" |

O site de um evento fica no ar até **30 dias depois da festa**. Depois disso ele expira e
sai do ar sozinho. **Hoje a tela não desenha esse estado** — é uma das coisas que este
redesenho precisa resolver.

Atenção ao português: **"1 convidado confirmou"**, "2 convidados confirmaram". O texto
atual erra a concordância no singular.

### 3.5 Estado vazio

Conta nova, nenhum evento. A tela não pode parecer quebrada. Frase atual, que você pode
melhorar: *"Seu primeiro site de evento está a 4 passos daqui."*

### 3.6 Limite do plano

O plano **Básico permite 3 eventos**; os outros são ilimitados. Quando o cliente do Básico
chega em 3, o card "Criar novo evento" precisa comunicar o limite e oferecer o upgrade —
sem sermão, sem bloquear a tela.

Os planos hoje se chamam **Básico · Clássico · Premium** no painel, mas a landing vende
**Convite único (R$47) · Assinatura (R$27/mês) · Cerimonialista (R$69/mês)**. Use os nomes
da **landing** — os do painel estão desatualizados.

### 3.7 O caso do cerimonialista

O plano Cerimonialista existe para quem tem **muitos eventos**. Uma grade de cards funciona
para 3; para 30, não. A tela precisa ter uma resposta para isso: busca, filtro por status,
ordenação, ou uma segunda densidade de visualização. **Desenhe a sua resposta** e mostre
como fica com ~12 eventos.

Não é preciso paginar — mas se a sua solução exigir, mostre o controle.

## 4. Requisitos não funcionais

**Densidade e vazio.** Hoje, com um evento só, dois terços da tela ficam vazios e o
dashboard parece inacabado. A tela precisa se sustentar tanto com **um** evento quanto com
**doze**.

**Responsivo de verdade.** Desktop (1440px), tablet e celular. Muita gente vai abrir isso
no telefone, entre um cliente e outro. Não entregue desktop-only.

**Acessibilidade.** Contraste AA no mínimo. O amarelo `#F5FF63` **não passa contraste com
branco**: use-o como fundo com tinta preta, ou como detalhe — nunca como texto sobre claro.
Estados de foco visíveis. Respeite `prefers-reduced-motion`.

**Movimento discreto.** Transições curtas. Nada de card que gira, brilha ou pulsa.

**Idioma.** Todo o texto em **português do Brasil**. Datas no formato "07 de set. de 2026".

**Ferramentas.** HTML e CSS puros. Ícones: use SVG inline simples ou Bootstrap Icons (o
projeto já usa). Nenhuma biblioteca de UI, nenhum JavaScript além do mínimo para demonstrar
um filtro ou busca, se você propuser um.

## 5. Faça o oposto disto

Isto **não** é um ERP, um analytics ou um CRM. Não desenhe gráficos, KPIs com setinha de
tendência, "receita do mês", tabelas densas ou barra lateral cheia de ícones.

Quem usa isto está organizando **a festa de alguém**. A tela deve parecer um ateliê
organizado, não um cockpit.

Evite o visual genérico de template de dashboard: card branco com sombra difusa, número
gigante, ícone colorido dentro de um quadrado arredondado, tudo em grade de quatro. Se o
resultado pudesse ser de qualquer SaaS do mundo, comece de novo.

## 6. O que entregar

1. Um **arquivo HTML único**, com o CSS embutido, abrindo direto no navegador.
2. Dentro dele, **quatro seções empilhadas**, claramente separadas, mostrando:
   - estado vazio (conta nova);
   - um evento no ar;
   - grade com ~12 eventos (o caso do cerimonialista, com a sua solução de busca/filtro);
   - os quatro estados de card lado a lado (rascunho, no ar, faltando algo, expirado).
3. As três larguras (desktop, tablet, celular) funcionando por media query — não três
   arquivos.

Use fotos de placeholder de eventos reais (Unsplash) nas capas. Nomes fictícios brasileiros.

# FIM DO PROMPT

---

## Google Stitch (usado em 2026-07-10)

O Stitch foi conectado como MCP (`claude mcp add --transport http stitch https://stitch.googleapis.com/mcp`,
com header `X-Goog-Api-Key`). Três coisas aprendidas:

1. **O Claude Code não carrega as ferramentas dele.** `claude mcp list` diz
   `Connected · tools fetch failed`, e o motivo é `can't resolve reference
   #/$defs/ScreenInstance from id #` — o schema do Stitch usa `$defs` que o validador
   do cliente não resolve. Não é a chave nem a URL.
2. **O transporte funciona.** Dá para falar JSON-RPC direto com o endpoint por `fetch`,
   e as 15 ferramentas respondem (`create_project`, `create_design_system`,
   `generate_screen_from_text`, `generate_variants`, `apply_design_system`…).
3. **Ele devolve IMAGEM, não código.** Não há campo de HTML no retorno e `list_screens`
   volta vazio. Portar uma tela do Stitch significa **reimplementar a partir do
   screenshot**, não colar um HTML pronto (como foi com o artifact da landing).

Projeto criado: `projects/358589699141357452`.
Design system: `assets/15422681558507635724` — `LIGHT`, Hanken Grotesk + Inter,
`ROUND_TWELVE`, `customColor: #7A40ED`, com os hex exatos da marca no campo `designMd`.

**Cuidado:** o `customColor` vira a cor **primária**. Com `#7A40ED` o painel sai roxo e o
amarelo `#F5FF63` só aparece em detalhes. Para o amarelo virar o botão principal (como na
landing), recriar o design system com `customColor: "#F5FF63"`.

---

## Depois que a IA responder

Me mande o HTML (ou o link do artifact). Eu porto para o Next.js:

- `app/(dashboard)/painel/page.tsx` — a tela
- `app/(dashboard)/painel/_ui/` — cards e estilos compartilhados
- `app/globals.css` — tokens `--scv-*`

E conserto, no mesmo passo, os dois defeitos que o código já tem:

1. **`"convidados confirmaram"`** é literal em `page.tsx:104` — o plural do substantivo é
   condicional, mas o verbo não. Nunca concorda no singular.
2. **O status `EXPIRED` não é tratado**: a tela só testa `status === "PUBLISHED"`, então um
   evento vencido cai no `else` e aparece como *"Em preparação"*, com o botão *"Continuar
   montando"*. O cliente vê um site expirado convidando-o a terminar de montar.
