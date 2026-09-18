# Endereços, domínios próprios e créditos de convite — decisões

> Conversa com o João em 18/09/2026. Pedido de partida, literal: *"eu quero que a
> pessoa possa mudar sim o domínio de acordo com o plano que ela escolher mas se
> for o mais básico por exemplo que tenha ainda no domínio
> seuconvite.orivya.com.br"*, e depois *"tem que ter um sistema de crédito"* e
> *"eu quero que a pessoa tenha a opção de comprar domínio sim"*.
>
> Este documento registra **decisões**, não implementação. Cada item da fila
> ganha sua própria spec em `docs/superpowers/specs/` quando chegar a vez.

## O que o código já faz hoje (levantado antes de decidir)

**O endereço do convite JÁ é escolhido pela pessoa, em todos os planos.** O que
parecia faltar está construído:

| Peça | Onde |
| --- | --- |
| Campo para digitar o endereço | `CriarConvite.tsx:2663` |
| Formato (4–30, `[a-z0-9-]`) | `CriarConvite.tsx:972` |
| Recusa de reservados, mesma lista do servidor | `ehReservado`, `CriarConvite.tsx:978` |
| Congela na primeira publicação | `slugTravado` / `enderecoTravado(event)` |
| Servidor honra o endereço pedido | `acoes.ts:178` (criar), `acoes.ts:336` (publicar) |
| Aviso quando o servidor emenda `-2` | `enderecoTrocado`, `CriarConvite.tsx:1024` |

O congelamento não é acidente: a spec de 18/08
(`2026-08-18-convite-fechado-passe-de-edicao-design.md`) já decidiu que *"o
endereço do convite (slug) nunca muda depois da primeira publicação, nem com
passe: link já compartilhado não pode quebrar"*.

**O que NÃO existe é o domínio próprio.** `lib/plans.ts` declara `dominioProprio`
como recurso e o card do Estúdio o vende, mas o grep no repo inteiro só encontra a
bandeira em `lib/plans.ts` e `lib/plans.test.ts`. Nenhuma coluna no banco guarda
domínio, e `middleware.ts` manda para a landing qualquer host que não termine em
`NEXT_PUBLIC_ROOT_DOMAIN`.

**A máquina de compra avulsa existe e está provada.** `PASSE_PRECO_CENTS = 1990`
(`lib/edicao.ts:17`), cobrança Pix, webhook idempotente e cota por plano
(`passesIncluidos`: Básico 0, Profissional 1, Estúdio 3). As notas de 20/08
registram o teste real, com dinheiro real, em produção.

## Decisões

### 1. O endereço dentro da nossa casa não vira degrau de plano

O Grátis continua escolhendo o próprio endereço. Colocar gate ali seria **tirar**
uma capacidade que já funciona, e o Grátis é o funil: o convite gratuito completo
é a decisão de posicionamento de 17/08. Escolher o endereço não custa nada à
plataforma e não é o que vende o plano pago.

### 2. Domínio próprio é POR CONVITE, não por conta

O card do Estúdio vende "domínio próprio **do cliente**", e é isso que a noiva
quer: `anaejoao.com.br`, não `estudiofulano.com.br/ana-e-joao`. Por convite o
middleware faz uma pergunta só (*este host é de algum evento?*); por conta faria
duas, precisando de caminho ou subdomínio para desambiguar. Domínio por conta, se
um dia fizer falta, entra depois como segunda coluna — o contrário dá retrabalho.

Custo assumido: cada cliente do estúdio precisa de um apontamento de DNS. O
estúdio fará isso pelo cliente, e é trabalho que ele cobra.

### 3. Na primeira versão, o cliente traz o domínio dele

A pessoa registra por fora, cola o domínio no painel e aponta o DNS. Nós
verificamos, emitimos o certificado e servimos. Sem obrigação de renovação, sem
cobrança recorrente por domínio, sem entrar na relação jurídica do Registro.br.

### 4. Vender domínio entra depois — decisão do João

Recomendei contra e o João manteve o pedido; está decidido. Fica como fila
separada (item C) porque **depende do A2**: não dá para vender domínio antes de o
sistema saber servir um domínio de fora. Custos reais a carregar no desenho:
renovação anual vira obrigação nossa, cobrança recorrente separada da assinatura,
e a Vercel cobra por domínio registrado.

### 5. Crédito de convite é saída AVULSA do Grátis, não substitui o ilimitado

O ilimitado **é o produto** do plano pago: o card do Profissional o traz como
primeiro item, e o comentário de 17/08 em `lib/plans.ts` registra que *"o que se
vende agora é ESCALA (ilimitado) e MARCA"*. Trocar por crédito faria o assinante
voltar a contar convites — exatamente o que ele paga para não fazer — e
enfraqueceria o plano contra concorrente que dá o site de graça.

Onde há dinheiro parado é no Grátis: hoje são 1 convite e um paredão, e quem quer
o segundo precisa assinar R$ 59/mês. Um crédito avulso na faixa do passe captura
essa pessoa sem canibalizar a assinatura — quem faz festa o ano inteiro continua
achando o plano mais barato que comprar crédito toda vez.

Se a preocupação for abuso do ilimitado, o remédio é um teto de uso justo alto,
não crédito.

## Fila

| Ordem | Entrega | Por que aqui |
| --- | --- | --- |
| **B** | Crédito de convite avulso no Grátis | Menor dos três, receita direta, reusa a cobrança do passe |
| **A2** | Domínio próprio (cliente traz o dele) | Coluna, verificação de DNS, certificado, middleware resolvendo host externo |
| **C** | Venda de domínio | Só faz sentido com o A2 de pé |

## Pendências que este documento não resolve

- **O card do Profissional promete "sua marca no lugar da nossa", mas
  `recursosDoPlano("CLASSICO").whiteLabel` é `false`** — só o Estúdio tem. A
  landing vende marca própria num plano que o gating nega. Decisão do João:
  corrigir o card ou liberar o recurso.
- **Preço do crédito de convite** (o passe é R$ 19,90; o crédito pode ou não
  acompanhar).
- **Domínio próprio depois do cancelamento.** `lib/plans.ts` promete que o
  convite nunca sai do ar por pagamento, mas domínio próprio é o recurso pago.
  Meio-termo proposto e ainda não confirmado: o domínio continua respondendo até
  `expiresAt` e só então para — o convite de papel não morre, e o benefício não
  vira eterno. **Decidir na spec do A2.**

## A branch `codex/domain-slug-wip` está encerrada

Trabalho de 08/09 resgatado de uma worktree do Mac, nunca verificado. Rodei os
portões nela em 18/09: `tsc` limpo e 314 testes passando — **e isso não vale**,
porque a branch nasceu de `241ba91` (16/08) e a master andou ~150 commits desde
então (354 arquivos, +22.165/−5.810), incluindo a migração para PostgreSQL e a
pasta `tests/` inteira, que nem existe lá.

Não vale rebase: ela edita `publicar/page.tsx`, que a master apagou (`4e86896`), e
acrescenta linhas a `CriarConvite.tsx` (+1052/−209 na master) e `acoes.ts`
(+177/−403). O `lib/event-editor/slug.ts` dela duplica o `lib/slug.ts` que a
master já tem, com `ehReservado` resolvendo a mesma pergunta.

Fica no GitHub como registro. Não é base para nada.
