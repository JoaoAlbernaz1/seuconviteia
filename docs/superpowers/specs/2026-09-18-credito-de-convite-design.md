# Crédito de convite avulso — design

> Aprovado pelo João em 18/09/2026. Pedido dele, literal: *"as pessoas não podem
> ter tipo assim, liberdade pra criar quantos convites elas quiserem, tem que ser
> de acordo com o plano que ela escolher, acho que tem que ter um sistema de
> crédito pra isso"*.
>
> Decisões de contexto em `docs/ops/enderecos-dominios-e-creditos.md`.

## Por que (o que o código mostra hoje)

**A cota do Grátis é um paredão, não uma escada.** `limiteEventos("BASICO") === 1`
(`lib/plans.ts`), e a única saída para o segundo convite é assinar R$ 59/mês.
Quem quer chá de bebê e depois aniversário não assina R$ 59 — desiste, ou abre
outra conta. É dinheiro parado na porta.

**A cota tem TRÊS portas, e não uma.** Conserto de 24/08: a vaga é cobrada ao
criar, ao **reativar** (salvar rascunho vencido com data futura) e ao **publicar**.
Uma porta só deixava metade do caminho aberto — dava para ficar com dois convites
no ar no plano de um. Qualquer desenho de crédito tem de passar pelas três.

**Convite vencido NÃO ocupa vaga** (decisão do João, 12/08): *"senão o Básico
virava uso único para sempre"*. Passada a festa, a vaga grátis volta.

**A máquina de compra avulsa existe e está provada em produção.** O passe de
edição: `Transaction` com `kind: "EDIT_PASS"`, compare-and-set `PENDING → PAID`,
`providerId` único como rede do ledger, e — o principal — **quem concede é o
webhook do Mercado Pago, nunca o clique no painel** (`lib/passeEdicao.ts`). A
action só pede a cobrança e a deixa `PENDING`.

## Decisão

Um **crédito** compra **uma criação de convite**. Gasta e não volta.

- **Preço: R$ 29,90.** Escolhido pela escada que a pessoa calcula sozinha: o 2º
  convite sai mais barato que assinar; no 3º ela já gastou R$ 59,80 e o plano de
  R$ 59/mês passa a ser a escolha óbvia. Abaixo disso um convite inteiro custaria
  o mesmo que a janela de 48h do passe, e o passe pareceria caro por comparação.
- **Crédito NÃO é vaga permanente.** A alternativa — comprou uma vez, a conta
  passa a ter 2 vagas para sempre — mata o plano Profissional: como a vaga se
  regenera quando a festa passa, R$ 29,90 uma vez substituiria R$ 59 por mês para
  sempre. É o mesmo tipo de vazamento do `event.plan` congelado e da data no
  passado, já consertados.
- **O crédito é gasto ao CRIAR**, não ao publicar. Gastar ao publicar obrigaria a
  porta de criar a deixar passar o segundo rascunho — exatamente o buraco fechado
  em 24/08.
- **O ilimitado dos planos pagos continua intacto.** Crédito é saída do Grátis,
  não substituto da assinatura. Justificativa em
  `docs/ops/enderecos-dominios-e-creditos.md`.

## O modelo

`Transaction` exige `eventId`, e o crédito é comprado **quando não há convite** —
a pessoa está barrada na porta de criar. Tornar `eventId` opcional mexeria na
tabela de dinheiro de que presentes, taxas e passes dependem, obrigando a revisar
toda consulta que hoje assume o vínculo. Reusar `CobrancaAssinatura` faria os
números de assinatura mentirem. Então: tabela própria, com a MESMA disciplina.

```prisma
model CreditoConvite {
  id             String    @id @default(cuid())
  professionalId String
  professional   Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  amountCents    Int
  status         String    @default("PENDING")  // PENDING | PAID | FAILED
  /// Id da cobranca no gateway. UNICO: rede do ledger, como em `Transaction`.
  providerId     String?   @unique
  paidAt         DateTime?
  /// O convite que ESTE credito pagou. Nulo = credito na mao, nao gasto.
  /// UNICO: e o que torna gasto duplo impossivel NO BANCO, nao na aplicacao.
  eventId        String?   @unique
  event          Event?    @relation(fields: [eventId], references: [id], onDelete: SetNull)
  createdAt      DateTime  @default(now())

  @@index([professionalId])
}
```

**O saldo não é guardado.** Saldo = créditos `PAID` com `eventId` nulo. É a mesma
filosofia do `planoEfetivo` (*"derivar na leitura — em vez de rebaixar por cron"*)
e elimina a classe inteira de bug em que um contador sai de sincronia.

**Gastar é um compare-and-set**, como no passe:
`updateMany where id = <crédito> AND eventId IS NULL SET eventId = <convite>`.
Duas abas ao mesmo tempo: só uma vira a linha. O índice único é a rede; a
aplicação não precisa acertar sozinha.

**O convite pago por crédito não ganha coluna nova.** A marca é o próprio crédito
apontando para ele.

## A regra da vaga, reescrita

> A vaga do Grátis é ocupada por convite não vencido **que nenhum crédito pagou**.

Nas três portas de 24/08:

| Porta | Com crédito | Sem crédito e vaga tomada |
| --- | --- | --- |
| **Criar** | Reivindica o crédito e cria — na MESMA transação. Falhou a reivindicação, o convite não nasce | Recusa e oferece a compra |
| **Reativar** | Convite que tem crédito nunca contou: passa direto | Recusa e oferece a compra |
| **Publicar** | Idem | Idem |

A decisão de 12/08 sobrevive: passada a festa, a vaga grátis volta. O convite
comprado vive fora dessa conta, para sempre.

## O fluxo

O popup de plano que já existe em `CriarConvite.tsx` ganha uma segunda saída além
de "assinar": **"Comprar convite extra — R$ 29,90"** → Pix → webhook confirma → o
crédito aparece → ela cria.

Mesmo contrato do passe: o clique só pede a cobrança e a deixa `PENDING`. **Quem
concede é o gateway**, depois de confirmar o dinheiro. O webhook ganha um terceiro
destino ao lado de `EDIT_PASS` e assinatura, achado pela mesma dupla
`providerId` / `external_reference`.

## Como se prova

Banco de verdade, espelhando `tests/limite-de-convites.test.ts` e
`tests/passe-edicao.test.ts`:

1. Grátis com 1 convite ativo e zero crédito: as três portas recusam.
2. Com crédito na mão: cria, e o crédito fica com `eventId` preenchido.
3. **Gasto duplo:** duas criações concorrentes com 1 crédito — uma passa, a outra
   recusa.
4. **Webhook idempotente:** a mesma notificação duas vezes concede um crédito só.
5. `FAILED` também entra no compare-and-set do webhook — mesmo motivo do passe: o
   timeout de rede depois de o MP ter criado a cobrança deixa a linha presa em
   `FAILED` com o dinheiro dentro.
6. Convite pago por crédito vence: a vaga grátis continua livre (nunca contou).
7. Convite grátis vence: a vaga volta, como em 12/08.
8. **Nos dois sentidos:** revertendo o conserto, os casos 1 e 3 voltam a passar —
   que é o exploit acontecendo. Mesma prova que o conserto de 24/08 usou.

## Fora de escopo

- **Crédito nos planos pagos.** O ilimitado é o produto do Profissional.
- **Pacote de créditos** (comprar 3 de uma vez). O modelo aguenta — são três
  linhas — mas a tela de pacote é decisão comercial que não foi tomada.
- **Reembolso/estorno de crédito não gasto.** Não há caminho de estorno para o
  passe hoje; abrir um para o crédito criaria precedente sem decisão.
