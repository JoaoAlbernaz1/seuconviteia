# Lista de presentes com Pix (split + taxa da plataforma) — design

**Data:** 2026-07-31
**Branch:** `backup/dashboard-editor-local-20260720`
**Referência de mercado:** iCasei — Central de Ajuda (lista de presentes em dinheiro, formas de
pagamento, tarifas e resgate). Pesquisa feita em 2026-07-31.

## Problema

Hoje a lista de presentes é **estática**: o dono coloca a chave Pix + QR dele no site,
e o convidado paga **direto na conta do dono**, por fora da plataforma. O botão
"Presentear" só rola até a seção do Pix. Como o dinheiro nunca passa pela plataforma,
**não é possível cobrar a taxa nem fazer split** — que é o motor de receita nº 2 do negócio
(taxa sobre a lista de presentes, decidido na Frente 1 do modelo de negócio).
> **Atualização 12/08/2026:** a taxa passou de 5% para **2,5%** (decisão do dono).
> Fonte única: `lib/pagamentos/taxa.ts` (`TAXA_BPS`).

## Objetivo

Trazer o modelo iCasei: o convidado paga **a plataforma** (Pix), a plataforma **retém a
taxa (5%)** e credita o líquido no **cofre (saldo) do convite**; o dono **resgata** para a
chave Pix dele. Presentes podem ser **valor fixo**, **cotas** ("10 cotas de R$100") ou
**"a partir de"** (valor livre com mínimo).

## Decisão de abordagem (dado o estágio do projeto)

Construir a feature **inteira** agora com um **gateway simulado ("Pix de mentira")** e trocar
a "tomada" para o **Asaas** depois, quando a conta existir. Racional:

- Ainda **não há conta/credenciais Asaas**; o Asaas real exige conta + KYC + cadastrar cada
  dono como subconta (pesado, travaria o progresso).
- É **o mesmo padrão de adapter que o `lib/storage` já usa** (interface + provider por ambiente
  + stub de produção). Zero gambiarra.
- Deixa o fluxo **visível e testável ponta a ponta** já (convidado presenteia → dinheiro entra
  → dono saca), sem esperar o Asaas.
- **Nada é descartado:** virar a chave para o Asaas = implementar 1 provider e um webhook.

### Modelo do dinheiro: "conta única + carteira interna"

Todo o dinheiro entra numa conta da plataforma (no futuro, o CNPJ que o João já tem, no Asaas).
O **saldo de cada convite** é um ledger no nosso banco (soma das contribuições líquidas pagas).
O dono **não** publica a chave Pix no site; ele cadastra a chave dele **no painel**, só para o
**resgate**. Isso espelha exatamente o iCasei (a plataforma segura o valor e faz o resgate) e é
muito mais rápido do que o split real por subconta (que fica para a Fatia 4/Asaas).

```
Convidado escolhe presente (bruto R$100)
  → paga via Pix (a plataforma recebe)
  → Contribuição registrada (bruto R$100, taxa R$5, líquido R$95, status PAGO)
  → Transação GIFT_PIX (ledger)  →  saldo do convite += R$95
Dono no painel: vê saldo, extrato, taxa retida
  → "Resgatar" (chave Pix dele)  →  Payout (no simulado, marca PAGO)
```

Taxa: **5%**, o **dono assume** (líquido = bruto − taxa). Gancho para, no futuro, **repassar ao
convidado** (bruto + taxa). Constante única em `lib/pagamentos/taxa.ts` (`TAXA_BPS = 500`).

## Modelo de dados (Prisma)

**`GiftItem` (estender)** — como o item pode ser presenteado:
- `pricingMode` enum `GiftPricing { FIXO | COTAS | LIVRE }` (default `FIXO`).
- `priceCents` (reutilizado): FIXO = preço; COTAS = preço **total** do item; LIVRE = **mínimo**.
- `quotaCount Int?` — nº de cotas (só COTAS); valor da cota = `priceCents / quotaCount`.
- (mantém `title`, `description`, `imageUrl`, `mode`, `purchased` por compat; `purchased`
  passa a significar "totalmente arrecadado", derivado.)

**`GiftContribution` (novo)** — uma pessoa presenteando um item:
- `id`, `eventId` (índice/isolamento por tenant), `giftItemId`.
- `buyerName String`, `buyerContact String?` (opcional, LGPD mínimo), `message String? @db.Text`.
- `quotas Int?` (modo COTAS).
- `grossCents Int`, `feeCents Int`, `netCents Int`.
- `status` enum `PayStatus { PENDING | PAID | FAILED | REFUNDED }` (default `PENDING`).
- `provider String` ("fake" | "asaas"), `providerChargeId String?`.
- `pixCode String? @db.Text`, `pixQrUrl String?`, `paidAt DateTime?`, `createdAt`.

**`Payout` (novo)** — resgate do dono, por convite:
- `id`, `eventId`, `amountCents Int`, `pixKey String` (snapshot), `pixName String?`.
- `status PayStatus`, `provider String`, `providerTransferId String?`, `createdAt`, `paidAt DateTime?`.

**`Event` (estender)** — dados de recebimento do dono:
- `payoutPixKey String?`, `payoutPixName String?` (chave onde o dono recebe o resgate; nunca
  exposta no site público).

**`Transaction`** (já existe) — ledger. `kind` usa `GIFT_PIX` (crédito bruto) e a taxa fica
implícita na Contribuição; `PAYOUT` para saques. Saldo do convite =
`Σ netCents(Contribuições PAGAS) − Σ amountCents(Payouts PAGOS/PENDENTES)`.

## Adapter de pagamento (`lib/pagamentos/`)

- `index.ts` — interface `PaymentProvider`:
  - `criarCobrancaPix(input) → { chargeId, pixCode, pixQrUrl, status }`
  - `consultarCobranca(chargeId) → { status }`
  - `transferir(input) → { transferId, status }` (payout do resgate)
- `FakePaymentProvider` — gera `pixCode`/`pixQrUrl` fake, cobrança começa `PENDING`; a confirmação
  vem de um endpoint dev que faz o que o webhook fará (marca `PAID`). Transferência resolve `PAID`.
- `AsaasPaymentProvider` — **stub que lança "não implementado"** (igual `VercelBlobStorage`);
  implementado na Fatia 4.
- `getPaymentProvider()` — `ASAAS_API_KEY` presente → Asaas; senão → Fake.

## Fatias (cada uma visível e commitável)

1. **Convidado presenteia de verdade (Pix simulado)** — fundação (schema + adapter + Zod + testes)
   + no site publicado o "Presentear" abre um fluxo: escolher cota/valor → nome + recado →
   "Gerar Pix" → mostra QR + copia-e-cola → "Confirmar pagamento" (simulado) → tela de obrigada.
   Por baixo: cria `GiftContribution`, calcula taxa, credita o cofre, grava `Transaction`.
   **Verificação:** Playwright headless (login demo não é preciso; é site público) — screenshot do
   fluxo + assert no banco de que o saldo subiu.
2. **Painel do dono: cofre + extrato + resgate** — total recebido, taxa retida, saldo líquido,
   lista de quem presenteou (nome/valor/recado), cadastro da chave Pix e botão **Resgatar**
   (saque simulado → `Payout` PAGO, saldo desce).
3. **Editor "Criar convite": configurar a lista** — cada presente: FIXO / COTAS / LIVRE; ligado
   ao editor existente e refletido na prévia.
4. **(depois) Virar a tomada pro Asaas real** — `AsaasPaymentProvider` (cobrança Pix + webhook
   assinado + transferência), onboarding de recebimento do dono. Só quando a conta Asaas existir.

## Erros, segurança e bordas

- **Zod** valida toda entrada (form do convidado, params, payload de webhook).
- **Webhook** (Fatia 4) verifica assinatura antes de processar; idempotente por `providerChargeId`.
- **Isolamento por tenant:** toda query por `eventId`; validar ownership no servidor no painel.
- **LGPD:** nome/contato do convidado com consentimento e mínimo necessário.
- **Concorrência de cotas:** ao confirmar, recomputar arrecadado; não deixar exceder o total
  (última cota vence; excedente vira erro amigável "esse presente já foi completado").
- **Fuso:** `paidAt`/datas em -03:00 (regra do projeto).

## Fora de escopo (agora)

- Split real por subconta Asaas (Fatia 4).
- Repassar a taxa ao convidado (só o gancho).
- Cartão/boleto (só Pix no MVP).
- Catálogo de +50 mil presentes fictícios do iCasei (a lista é montada pelo dono).
