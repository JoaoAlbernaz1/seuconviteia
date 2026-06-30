# Brief de design — SeuConvite IA

> Documento para uma IA de design criar as telas do produto. É auto-contido:
> assuma que você não tem nenhum contexto além daqui.

## 1. O que é o produto

**SeuConvite IA** é uma plataforma **B2B, multi-tenant**, onde **profissionais de
eventos** (cerimonialistas, ateliês, decoradores, assessores) criam **sites de
convite** para os **clientes** deles. É multi-nicho: **casamento, 15 anos, 60
anos, bodas e aniversário**.

Cada evento vira um **site próprio** num subdomínio automático
(ex.: `mariaclara.seuconviteia.com`). O profissional monta o site, mostra pro
cliente, e publica.

## 2. MODELO DE NEGÓCIO — leia com atenção (NÃO é assinatura)

> ⚠️ **NÃO É ASSINATURA. Não existe mensalidade, não existe plano.**
> O modelo é **comprar 1 SITE por vez — pagamento ÚNICO por site** — mais
> **upsells avulsos**. Todo o design tem que comunicar isso.

Como funciona, em ordem:

1. **Prévia grátis com marca d'água.** O profissional cria o site e ele já nasce
   funcionando 100%, no ar, mas com uma **marca d'água** cobrindo o site inteiro
   (ladrilho diagonal "Prévia · seuconviteia"). Serve pra mostrar pro cliente
   antes de pagar. Criar e mostrar é **de graça e ilimitado**.
2. **Publicar = pagamento ÚNICO daquele site.** Quando o cliente aprova, um
   **pagamento único** tira a marca d'água e publica o site de verdade. **Não há
   recorrência** — paga uma vez, aquele site fica publicado.
3. **Upsells avulsos.** Recursos extras destravam pagando **separado, um a um**:
   - **Confirmação de presença (RSVP)**
   - **Mural de recados**
   - **Álbum de fotos**
   - **Domínio próprio**
   A **base já vem incluída** no site: **capa/convite, página do evento e lista
   de presentes (Pix)**.
4. **Editar site publicado custa.** Enquanto é prévia, o profissional edita à
   vontade. Depois de publicado (pago), para alterar é preciso **liberar a edição**
   (novo pagamento) — aí volta a ser prévia até publicar de novo.
5. **Lista de presentes (Pix).** Convidados presenteiam por Pix; a plataforma
   fica com uma **taxa da transação** (é uma fonte de receita, além da venda do
   site).

Resumo do dinheiro: **venda avulsa de cada site (pagamento único) + upsells
avulsos + taxa sobre a lista de presentes.** Nenhuma assinatura.

## 3. Personas

- **Profissional de eventos** (o cliente que paga a plataforma): usa o **PAINEL**
  para criar, personalizar, publicar e gerenciar os sites. É quem decide comprar
  cada site/upsell. Não é técnico — quer rapidez e um resultado lindo pra mostrar
  e vender pro cliente dele.
- **Cliente final** (noiva/noivo, debutante, aniversariante, família): recebe o
  **SITE do evento**. Confirma presença, deixa recado, vê o álbum, presenteia via
  Pix. Não tem login — só navega o site.
- **Convidado**: acessa o site do evento, confirma presença, presenteia.

## 4. Jornada

1. Profissional **cria conta** (sem escolher plano — não há planos).
2. No **painel**, clica em **Criar evento** → preenche um **formulário rico**
   (nicho, paleta de cores, dados, local, programação, lista de presentes, fotos).
3. O **site nasce na hora** como **prévia com marca d'água**, num subdomínio.
4. Profissional **mostra a prévia** pro cliente.
5. Cliente aprovou → **publica (pagamento único)** → marca d'água sai.
6. Conforme a festa precisa, **ativa upsells avulsos** (RSVP, recados, álbum,
   domínio).

## 5. Superfícies a desenhar

| Superfície | Para quem | O que faz |
|---|---|---|
| **Landing (página inicial)** | profissional (prospect) | Vende a plataforma. Precisa explicar: cria e mostra de graça (com marca d'água) → publica com pagamento único → extras avulsos. **Sem assinatura.** Deixar claro como funciona e por que vale. |
| **Cadastro / Login** | profissional | Entrar na plataforma. |
| **Painel (dashboard)** | profissional | Lista de eventos, criar evento, publicar/upsell, ir pro perfil. |
| **Formulário criar/editar evento** | profissional | Monta o site: nicho, paleta, dados, local, programação, presentes (Pix), fotos. Com sugestões de texto e dicas. |
| **Perfil** | profissional | Foto/avatar, nome, marca (crédito no rodapé dos sites), senha. |
| **Site do evento** | cliente final / convidados | O produto final: capa cinematográfica + convite + evento (quando/onde/programação/mapa/contador) + lista de presentes (Pix) + upsells (confirmar presença, recados, álbum). |

## 6. Recursos — base + upsells (detalhado)

Cada recurso abaixo é uma **seção/página do site do evento** para desenhar.

### Base — já incluída quando o site é comprado (pagamento único)

- **Capa / convite** — capa cinematográfica (foto do evento + nome em destaque +
  data) e o texto do convite. É a primeira tela, o "uau".
- **Página do evento** — quando e onde (data, horário, local, endereço, mapa),
  **contagem regressiva**, **programação** (linha do tempo da festa) e traje.
- **Lista de presentes (Pix)** — um painel com a foto ao lado, a lista de
  presentes (itens com valor) e a **chave Pix** para copiar (com QR opcional).

### Upsells — cada um destrava com um pagamento à parte (avulso)

> São recursos "de valor" que ficam **travados** até o profissional/cliente
> pagar por eles, **um a um**. No site, quando NÃO estão ativos, a aba/seção
> simplesmente não aparece (nada de espaço vazio).

- **Confirmação de presença (RSVP)** — o convidado confirma se vai ("Vou / Não
  vou"), informa o nome e os acompanhantes, e pode deixar uma mensagem. O
  profissional acompanha as confirmações pelo painel (quantos vão). É o upsell
  mais pedido. **Desenhar:** a tela de confirmar presença (formulário elegante,
  no tema do evento) + a tela de "obrigada" após confirmar.
- **Mural de recados** — os convidados deixam mensagens de carinho que aparecem
  num mural. **Desenhar:** o mural (cards de mensagem) + o campo de novo recado.
- **Álbum de fotos (galeria)** — galeria das fotos do ensaio/evento, com tela
  cheia (lightbox). **Desenhar:** a grade de fotos + a visualização ampliada.
- **Domínio próprio** — em vez do subdomínio grátis (`festa.seuconviteia.com`),
  o evento usa um domínio próprio (ex.: `festadamaria.com.br`). É mais uma
  configuração/venda do que uma tela nova.

No **painel**, o profissional vê, por evento, o status de cada upsell e um botão
para **destravar** (que será o passo de pagamento). Hoje a base aparece como
"incluída" e os upsells como "ativar à parte".

## 7. Identidade visual

Há **duas identidades** (não confundir):

### a) Marca da PLATAFORMA (landing, painel, cadastro, perfil) — turquesa + roxo
- Cores: **ink** `#0F172A` (texto), **turquesa** `#2DE2E6` (acento vivo),
  **teal** `#0EA5A6` (apoio), **violeta** `#6D28D9` (**CTA principal**),
  **névoa** `#F1F5F9` (fundo), **lilás** `#EDE9FE` (superfícies),
  **texto-suave** `#64748B`.
- Gradientes: **texto** = `teal → violeta` (90°); **acentos/ícones/badges** =
  `turquesa → teal → violeta` (135°).
- Fontes: **Fraunces** (serif, títulos/headlines) + **Sora** (sans, UI/corpo).
- Wordmark: `seuconvite` + **`ia`** (no gradiente teal→violeta) + `.com`.
- Ícones: **Bootstrap Icons**.
- Clima: premium, sofisticado, claro (fundo névoa), CTA roxo.

### b) Site do EVENTO — editorial, cinematográfico, "themeable"
- Cada evento escolhe uma **paleta pronta**: rose, dourado, azul, lavanda, verde,
  terracota — que re-tinge o site inteiro.
- Estética **editorial premium**: capa escura cinematográfica com a foto do
  evento, nome em fonte de destaque/cursiva, partículas/atmosfera, seções calmas
  e elegantes, muito respiro. Fontes display + script + Cormorant (serifa).
- **Referência concreta**: o site de uma festa de 15 anos (rosé, capa
  cinematográfica, confirmar presença, recados, álbum, lista de presentes com
  Pix). É o padrão de qualidade que o dono ama.

## 8. Tom e referências

- **Premium e específico, NUNCA "cara de IA"/genérico.** O dono rejeita design
  genérico e gosta de referências concretas replicadas com fidelidade.
- **Painel**: referência **Horizon UI** — sidebar à esquerda (marca + navegação +
  card de conta), cards limpos com ícone (não fotos cortadas), claro.
- **Site do evento**: editorial/cinematográfico, rosé (a festa de 15 anos).
- **Simples de entender** — nada poluído; o profissional não é técnico.

## 9. Stack (caso gere código)

Next.js (App Router, React) + **Tailwind CSS** + Bootstrap Icons. Pensar o design
em termos de utilitários do Tailwind e tokens de cor (acima). Multi-tenant: o site
do evento é servido por subdomínio.

## 10. Restrições / regras de ouro

- **Comunicar o modelo sem assinatura**: comprar 1 site (pagamento único) +
  upsells avulsos. Nada de "planos/mensalidade".
- **Marca d'água** existe e cobre o site inteiro enquanto é prévia.
- **Duas identidades**: turquesa/roxo (plataforma) vs. rosé editorial themeable
  (site do evento). Não misturar.
- **Premium, não genérico.** Replicar referências com fidelidade.
