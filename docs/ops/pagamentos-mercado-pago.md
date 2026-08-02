# Pagamentos — Mercado Pago (Pix)

A lista de presentes recebe por **Pix** via Mercado Pago. O código usa a API REST
do MP (sem SDK) e um webhook que confirma o pagamento sozinho.

## Como liga/desliga (seam por env var)

- **Sem `MERCADO_PAGO_ACCESS_TOKEN`** → provedor **simulado** (`FakePaymentProvider`).
  O convidado vê o QR de mentira e confirma na mão ("Confirmar pagamento"). É o
  modo de desenvolvimento — nenhum dinheiro real.
- **Com `MERCADO_PAGO_ACCESS_TOKEN`** → **Pix real** (`MercadoPagoPaymentProvider`).
  O convidado paga no app do banco; o webhook confirma automaticamente e a tela
  do convidado atualiza sozinha (faz polling a cada 4s como rede de segurança).

Fonte da decisão: `lib/pagamentos/index.ts` → `getPaymentProvider()`.

## Variáveis de ambiente

| Variável | Onde pegar | Obrigatória |
|---|---|---|
| `MERCADO_PAGO_ACCESS_TOKEN` | MP → **Suas integrações** → sua aplicação → **Credenciais**. Tem par de **TESTE** e de **PRODUÇÃO**. | Sim (pra Pix real) |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Ao configurar o webhook no painel do MP, ele gera uma **chave secreta**. | Recomendada (valida a assinatura) |

Coloque em `.env.local` (dev) e nas env vars da Vercel (produção). Comece pelas
credenciais de **TESTE** pra validar o fluxo ponta a ponta sem dinheiro real.

```
MERCADO_PAGO_ACCESS_TOKEN="TEST-xxxxxxxx..."   # depois troque pelo APP-USR-... de produção
MERCADO_PAGO_WEBHOOK_SECRET="xxxx"
```

## Webhook (obrigatório pra confirmação automática)

No painel do MP → **Webhooks / Notificações**, cadastre:

- **URL:** `https://<seu-dominio>/api/webhooks/mercadopago`
  (em produção; em dev use um túnel tipo ngrok/cloudflared apontando pra `localhost:3000`).
- **Evento:** `Pagamentos` (payment).
- Copie a **chave secreta** gerada → `MERCADO_PAGO_WEBHOOK_SECRET`.

O webhook (`app/api/webhooks/mercadopago/route.ts`):
1. Valida a assinatura (`x-signature`) com o segredo.
2. Re-consulta o status **real** no MP (nunca confia só no payload).
3. Se `approved`, confirma a contribuição (marca PAGO + registra no ledger +
   marca o presente como realizado se completou). Idempotente.

## Taxa e cofre

- Taxa da plataforma: **5%** (o dono assume; líquido = bruto − taxa). Fonte:
  `lib/pagamentos/taxa.ts`.
- O líquido entra no **cofre** do convite (saldo = Σ líquidos pagos − Σ payouts).
  O **saque** do cofre pro Pix do dono (payout/`transferir`) ainda **não** está
  implementado no MP — é a próxima etapa.

## Teste rápido (com credenciais de TESTE)

1. Setar `MERCADO_PAGO_ACCESS_TOKEN` de teste no `.env.local` e reiniciar o dev.
2. Abrir um convite publicado → **Presentes** → **Presentear** → o QR agora é real (MP).
3. Pagar com um **usuário de teste** do MP (painel → Suas integrações → Contas de teste).
4. O webhook (via túnel) confirma; a tela do convidado vira "Presente confirmado!".
