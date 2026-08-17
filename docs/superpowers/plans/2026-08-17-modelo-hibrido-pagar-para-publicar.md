# Modelo de negócio: convite grátis, receita na taxa — plano e estado

**Decisões do João em 17/08/2026**, depois de a assinatura mensal ficar pronta e de o
mercado ser levantado. Este documento substitui a ideia inicial de "pagar R$ 129 para
publicar", que a pesquisa derrubou.

## O mercado (levantado em 17/08/2026)

| Concorrente | Site do evento | Cobra o quê | Taxa | Saque |
| --- | --- | --- | --- | --- |
| FestaLab | **grátis**, com RSVP, recados, lista e mapa | R$ 14,90–19,90 só pela **arte** | **3,69%** | **30 dias** + R$ 3,67 por saque |
| Wedy | **grátis** (Free) | plano Premium (valor não publicado) | 5,99% free · 4,95% premium | 1 dia útil |
| iCasei | Basic grátis por 6 meses | Classic R$ 79,90/3 meses · Black R$ 149,90/3 meses | 3,69%–3,89% | — |
| Conviter / Convitin | grátis | R$ 9,90 pela arte / plano único | — | — |

**Ninguém cobra pelo site.** Todos ganham na taxa dos presentes. Cobrar para publicar nos
tirava do jogo; e a nossa taxa de entrada (5,90%) era a pior da tabela, empatada com o Wedy
gratuito.

## O modelo

| | Preço | Taxa | Para quem |
| --- | --- | --- | --- |
| **Grátis** | R$ 0 | **3,5%** | convite completo: RSVP, recados, álbum, presentes com Pix |
| **Sem marca** | R$ 29 uma vez, por convite | 2,9% | quem quer o site sem a nossa assinatura |
| **Profissional** | R$ 59/mês | 2,9% | cerimonialista: ilimitado + marca própria |
| **Estúdio** | R$ 149/mês | 2,5% | domínio próprio do cliente, atendimento em 1 dia útil |

Regras que sustentam isso:

1. **O gratuito é completo.** Tirar RSVP/recados/álbum dele perde na primeira comparação.
2. **O que se vende é escala e marca**, não recurso.
3. **A taxa é o único número que o cliente compara** — por isso 3,5% no gratuito, abaixo do
   melhor plano dos concorrentes. Há teste que quebra se alguém subir disso.
4. **Nada de plano concedido por clique**: quem concede é o webhook do gateway.
5. **Preços em um arquivo só** (`lib/plans.ts` e `lib/pagamentos/taxa.ts`).

## Estado

### ✅ Feito e no ar (17/08)

- Taxa 3,5% / 2,9% / 2,5% (`lib/pagamentos/taxa.ts`), com teste de posicionamento.
- Gratuito com o convite completo (`recursosDoPlano`), vitrine de presentes liberada para
  todos — cobrar pela lista bonita era cobrar para ganhar dinheiro.
- Planos renomeados: **Grátis · Profissional · Estúdio**, com as listas falando de escala e
  marca.
- Landing reescrita: três cards, o gratuito levando ao cadastro e os pagos ao checkout com 7
  dias grátis, e a comparação de taxa em número no rodapé da seção.
- Assinatura mensal completa (checkout próprio, teste de 7 dias, webhook idempotente,
  cancelamento que cancela no gateway) — serve o lado profissional.

### ⏳ Próxima fatia — o "Sem marca" de R$ 29

- `lib/pacotes.ts`: `PACOTES_CONVITE` (SEM_MARCA R$ 29 → libera `whiteLabel` naquele convite).
- `Event.pagoEm` + tabela `CompraConvite` (`providerId` único, como o ledger de presentes).
- `criarCompraConviteMp`: `POST /checkout/preferences` (Checkout Pro — cartão, Pix e boleto na
  mesma tela), `external_reference` = id do convite, `back_urls` **sem query** (o MP recusa).
- Webhook `type=payment` passa a reconhecer a compra do convite além da contribuição de
  presente, reconsultando no MP antes de gravar.
- Tela de compra no nosso padrão de checkout (resumo do pedido + dados de cobrança).

### ⚠️ Dívida que a landing torna urgente

**O saque não existe** (`transferir()` em `lib/pagamentos/mercadopago.ts` lança erro). A
promessa da landing foi escrita em cima do que é verdade hoje ("sem taxa de saque") e **não**
em "dinheiro em 1 dia útil". Quando o payout for implementado, a frase pode crescer — e aí
vira vantagem direta sobre a FestaLab, que segura 30 dias e cobra R$ 3,67 por saque.
