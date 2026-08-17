# Assinatura do SaaS via Mercado Pago — design

> Aprovado pelo João em 17/08/2026. Substitui o upgrade grátis por cobrança real.

## Por que

`trocarPlano` (`app/(dashboard)/actions.ts`) concede plano pago com um
`prisma.professional.update({ plan })` — **sem cobrar nada**. Qualquer conta
clica em "Fazer upgrade" e vira PREMIUM (R$ 149/mês) de graça, e a tela ainda
diz "Mercado Pago", dando a entender que cobrou. O `Professional` guarda apenas
`plan`: não há status de assinatura, vencimento nem histórico. A integração com
o MP só sabe fazer Pix avulso (presente do convidado); não tem recorrência.

Os preços são decisão do dono e já existem em `lib/plans.ts`: Básico grátis,
Clássico R$ 59, Premium R$ 149 (`mensalidadeCents`).

## Decisão: cartão recorrente, formulário hospedado pelo Mercado Pago

Pix **não faz recorrência automática** — assinatura sem recorrência vira
cobrança manual todo mês, que é onde esse negócio sangra. Então: cartão.

O cartão é digitado **no Mercado Pago**, nunca no nosso site: criamos a
assinatura sem `card_token_id` e redirecionamos para o `init_point` que a API
devolve. Isso nos mantém fora do escopo PCI — a mesma conclusão que matou a
digitação de cartão no projeto do eletroposto.

## Fluxo

1. Painel → "Assinar Clássico/Premium" dispara uma server action.
2. A action chama `POST /preapproval` com:
   - `reason` (ex.: "seuconvite — plano Clássico"),
   - `auto_recurring`: `{ frequency: 1, frequency_type: "months",
     transaction_amount: <mensalidadeCents/100>, currency_id: "BRL" }`,
   - `payer_email` = e-mail da conta,
   - `external_reference` = `professionalId`,
   - `back_url` = `/painel/plano?assinatura=ok`.
3. Redireciona para `init_point`. O plano **não muda aqui**.
4. Volta para `/painel/plano`, que mostra "aguardando confirmação".
5. **O webhook decide o plano**, nunca o clique:
   - `subscription_preapproval` → `authorized` sobe o plano; `cancelled` /
     `paused` marcam para rebaixar no fim do período pago.
   - `subscription_authorized_payment` → registra a cobrança e empurra o
     vencimento em um mês.

O princípio é o mesmo que já vale para o presente do convidado: **só o gateway
concede**, o cliente nunca.

## Banco

`Professional` ganha:

| campo | para quê |
| --- | --- |
| `mpPreapprovalId String? @unique` | ligar o webhook à conta; único evita duas contas na mesma assinatura |
| `assinaturaStatus String?` | `pending` / `authorized` / `paused` / `cancelled` |
| `assinaturaAte DateTime?` | até quando o plano vale (é o que sustenta a carência) |

Mais um modelo `CobrancaAssinatura` (professionalId, amountCents, status,
`providerId` **único**, paidAt). Não dá para reusar `Transaction`: ela é
amarrada a um `Event` por FK, e assinatura é da conta, não do evento.

O `providerId` único repete a lição do ledger de presentes: o webhook pode
chegar duas vezes, e o banco tem de recusar a segunda.

## Regras aprovadas

- **Cartão falhou:** o plano vale até `assinaturaAte`. Venceu sem renovar → cai
  para Básico. Não se corta no primeiro erro de cartão.
- **Cancelou:** mantém o plano até o fim do período já pago, depois Básico.
- **`trocarPlano` para de conceder plano pago.** Descer para Básico segue
  direto (é cancelamento); subir passa pelo checkout.
- O rebaixamento por vencimento é decidido na **leitura** do plano (derivado de
  `assinaturaAte` + status), não por cron — assim não existe janela em que o
  banco diz PREMIUM e o direito já venceu.

## Landing

Sem mudança estrutural: os CTAs seguem indo para `/cadastrar`. Só passam o plano
escolhido adiante (`/cadastrar?plano=classico`) para a pessoa cair no checkout
certo depois de criar a conta, em vez de ter de procurar.

## Fora de escopo

- Pix como forma de pagar a assinatura (avaliar depois; exige cobrança manual).
- Troca de cartão e histórico de faturas na interface.
- Boleto, cupom, teste grátis e a garantia de 7 dias que a landing menciona
  (`MOSTRAR_GARANTIA`) — política, não código.
- O buraco dos templates sem fluxo de presentear (3 de 4), registrado à parte.

## Verificação

- Teste do webhook: `authorized` sobe o plano; `cancelled` não rebaixa antes do
  vencimento; duas entregas do mesmo evento gravam **uma** cobrança.
- Teste da leitura do plano: `assinaturaAte` no passado + status não autorizado
  → o efetivo é Básico, mesmo com `plan = PREMIUM` na linha.
- Teste de que `trocarPlano` recusa subir de plano.
- No ar, com a conta real do João: assinar o Clássico, ver o plano subir só
  depois do webhook, e cancelar.
