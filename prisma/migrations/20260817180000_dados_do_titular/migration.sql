-- Dados do titular da conta.
--
-- `telefone` e pedido no CADASTRO (contato de suporte); `documento` (CPF/CNPJ)
-- so no CHECKOUT, porque e dado de cobranca — pedir antes de a pessoa decidir
-- comprar so derruba cadastro. `perfilUso` diz se ela faz a propria festa ou
-- trabalha com isso, que e o que muda a linguagem do painel.
--
-- Tudo nulo: nenhuma conta existente fica invalida.
ALTER TABLE "Professional" ADD COLUMN "telefone" TEXT;
ALTER TABLE "Professional" ADD COLUMN "documento" TEXT;
ALTER TABLE "Professional" ADD COLUMN "perfilUso" TEXT;
