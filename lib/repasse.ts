// REPASSE (saque do cofre) — as regras puras de quem paga o resgate e de quem
// pode liquidá-lo.
//
// Por que este arquivo existe: o Mercado Pago **não tem API de saída** para a
// chave Pix de um terceiro. O caminho oficial deles para dinheiro chegar em
// outra conta é o split de pagamentos (o convidado paga já dividido, e o dono
// recebe na conta MP dele, via OAuth). Enquanto o split não existir aqui, o
// dinheiro entra na conta da plataforma e sai por REPASSE HUMANO.
//
// Isso muda o significado de um resgate PENDING: ele não é "uma transferência
// que o gateway está processando", é **um pedido na fila do operador**. É a
// diferença entre uma tela que mente ("processando…" para sempre) e uma que
// diz a verdade — e é por isso que a decisão vive aqui, pura e testável, em vez
// de espalhada em `if` dentro da action.

/** O provedor sabe transferir sozinho? (o simulado sabe; o Mercado Pago não). */
export function repasseEhAutomatico(provider: { podeTransferir: boolean }): boolean {
  return provider.podeTransferir;
}

/**
 * Quem pode liquidar repasse (marcar pago/recusado) — o operador da plataforma,
 * não o dono do convite.
 *
 * A lista vem de `ADMIN_EMAILS` (separada por vírgula ou ponto-e-vírgula). Sem a
 * variável, ninguém é admin: preferir a fila INACESSÍVEL a uma fila em que
 * qualquer conta logada mexe no dinheiro dos outros — este é o único lugar do
 * sistema que enxerga convite de todo mundo.
 *
 * Comparação sem caixa e sem espaço porque e-mail chega do jeito que a pessoa
 * digitou, e `Joao@X.com ` não pode virar "não é admin" calado.
 */
export function ehAdminDeRepasse(
  email: string | null | undefined,
  lista: string | undefined = process.env.ADMIN_EMAILS,
): boolean {
  const alvo = email?.trim().toLowerCase();
  if (!alvo) return false;
  const permitidos = (lista ?? "")
    .split(/[,;]/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return permitidos.includes(alvo);
}

/** Texto do estado de um resgate para o DONO do convite (não para o operador). */
export function rotuloDoRepasse(
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED",
  automatico: boolean,
): string {
  switch (status) {
    case "PAID":
      return "Pago";
    case "FAILED":
      return "Não saiu — o valor voltou para o saldo";
    case "REFUNDED":
      return "Estornado";
    default:
      // A frase MUDA com o caminho: no repasse humano, "processando" sugere que
      // uma máquina está trabalhando e que é questão de segundos.
      return automatico ? "Processando" : "Pedido enviado — em até 1 dia útil";
  }
}
