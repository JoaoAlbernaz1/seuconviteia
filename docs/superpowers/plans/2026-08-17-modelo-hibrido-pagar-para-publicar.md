# Modelo híbrido: grátis até publicar — plano de execução

**Decisão do João (17/08/2026), depois de a assinatura mensal ficar pronta.**

## Por que mudar

Assinatura mensal serve para quem usa todo mês. A mãe da debutante não usa: monta o
convite, a festa acontece, ela cancela. Cobrar mensalidade de uso pontual gera churn alto,
arrependimento e chargeback — e **nenhum concorrente direto faz isso**: iCasei, Wedy e
Casar.com vendem **por evento, pagamento único**, e ganham de verdade na taxa dos presentes.

O segundo erro era o cartão antes do produto. Wix, Canva e Webflow — que vendem "site
pronto" — fazem o contrário: monta de graça, paga para **publicar**. O paywall depois do
trabalho feito converte muito mais, e de quebra mata o vazamento do teste grátis (sem pagar,
não publica).

## O modelo

Todo mundo monta o convite de graça, sem cartão, e vê a prévia completa. O paywall fica no
botão **Publicar**, e o caminho se divide pelo que a pessoa já respondeu no cadastro
(`perfilUso`):

| Quem | Como paga | Preço | Taxa nos presentes |
| --- | --- | --- | --- |
| Faz a própria festa | **uma vez**, por convite | **R$ 129** | 5,9% |
| idem, com marca própria e domínio | uma vez | **R$ 229** | 3,4% |
| Cerimonialista / estúdio | assinatura mensal (ilimitada) | R$ 59 / R$ 149 | 3,4% / 2,6% |

A assinatura mensal (com 7 dias grátis e cartão) **já está pronta** e continua servindo o
lado profissional. O que entra agora é a compra única.

## Regras (uma frase cada)

1. **Publicar exige pagamento:** compra paga naquele convite **ou** assinatura ativa na conta.
2. **O que o site mostra** = plano da COMPRA quando ela existe; senão, plano efetivo da conta.
   Assim o convite comprado nunca degrada (mesmo sem assinatura), e o do assinante segue a
   assinatura — que é o que fecha o vazamento.
3. **A compra vale para aquele convite**, sem prazo próprio: o convite já sai do ar sozinho em
   `expiresAt` (90 dias após a festa).
4. **Nada de plano concedido por clique**: quem marca `pagoEm` é o webhook do gateway.
5. **Preços moram em um arquivo só** (`lib/pacotes.ts` para compra única, `lib/plans.ts` para
   assinatura). Nunca escritos em tela.

---

### Fatia 1 — a regra e o gate (sem gateway ainda)

- `lib/pacotes.ts`: `PACOTES_CONVITE` (CONVITE R$ 129 → plano CLASSICO; CONVITE_MARCA R$ 229 →
  PREMIUM), com teste de que o preço sai daqui.
- `Event.pagoEm DateTime?` + tabela `CompraConvite` (`providerId` único, como o ledger de
  presentes) + migration aditiva.
- `lib/licenca.ts` PURO: `compraPaga(event)`, `planoDoSite(event, planoDaConta)`,
  `podePublicar(event, conta, agora)`, `assinaturaAtiva(conta, agora)`.
- Site público (`app/%5Fsites/[sub]/*`) passa a usar `planoDoSite` em vez de `event.plan` cru.
- Publicar (painel e editor) passa a exigir `podePublicar`; sem isso, manda para o pagamento.

### Fatia 2 — a compra no Mercado Pago

- `criarCompraConviteMp`: `POST /checkout/preferences` (Checkout Pro — cartão, Pix e boleto
  na mesma tela hospedada), `external_reference` = id do convite, `back_urls` sem query.
- Webhook `type=payment`: além da contribuição de presente, reconhece a compra do convite,
  reconsulta no MP e grava `CompraConvite` + `Event.pagoEm`/`plan` de forma idempotente.
- Tela `/publicar/<id>`: resumo do pedido no nosso padrão (o que inclui, preço, "vale até 90
  dias depois da festa") e o botão que abre o Checkout Pro.

### Fatia 3 — as telas

- Landing: seção de preços com os dois públicos ("Vou fazer minha festa" × "Trabalho com
  eventos"), pagamento único de um lado e assinatura do outro.
- Painel: o botão Publicar leva ao pagamento quando não há direito; estado "convite pago"
  visível no card do convite.
- Cadastro já pergunta o perfil — passa a decidir o que a pessoa vê primeiro.

## Depois do plano

- A taxa sobre presentes segue por `Event.plan` (compra) ou pela conta (assinatura) — conferir
  que `lib/presentear.ts` usa a mesma regra do site.
- Contas antigas (`joaovictoralbernaz@gmail.com`) continuam com assinatura de cortesia.
