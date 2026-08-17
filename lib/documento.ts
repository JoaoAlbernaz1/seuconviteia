// CPF/CNPJ e telefone — validacao e mascara (PURO, sem banco e sem React).
//
// O documento e pedido no CHECKOUT, nao no cadastro: e dado de cobranca, e
// pedir antes de a pessoa decidir comprar so derruba cadastro. O Mercado Pago
// pede o "Documento do titular" na tela do cartao, entao ter o nosso confere
// com o que ela vai digitar la — e e o que a nota fiscal vai exigir.
import { cpfValido, soDigitos } from "@/lib/carteira";

export { cpfValido, soDigitos };

/** CNPJ valido pelos dois digitos verificadores (modulo 11). */
export function cnpjValido(cnpj: string): boolean {
  const n = soDigitos(cnpj);
  if (n.length !== 14) return false;
  // Sequencia repetida passa na conta dos digitos, mas nao existe.
  if (/^(\d)\1{13}$/.test(n)) return false;

  const digito = (base: string, pesoInicial: number): number => {
    let peso = pesoInicial;
    let soma = 0;
    for (const char of base) {
      soma += Number(char) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = digito(n.slice(0, 12), 5);
  const d2 = digito(n.slice(0, 13), 6);
  return d1 === Number(n[12]) && d2 === Number(n[13]);
}

/** CPF ou CNPJ — o campo e um so, e quem decide e a quantidade de digitos. */
export function documentoValido(valor: string): boolean {
  const n = soDigitos(valor);
  if (n.length === 11) return cpfValido(n);
  if (n.length === 14) return cnpjValido(n);
  return false;
}

/** Mascara progressiva: vira CPF ate 11 digitos, CNPJ a partir do 12o. */
export function formatarDocumento(valor: string): string {
  const n = soDigitos(valor).slice(0, 14);
  if (n.length <= 11) {
    return n
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
  }
  return n
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})$/, "$1.$2.$3/$4-$5");
}

/** Fixo (10) ou celular (11) COM DDD — sem DDD nao serve para contato. */
export function telefoneValido(valor: string): boolean {
  const n = soDigitos(valor);
  return n.length === 10 || n.length === 11;
}

/** `(61) 99999-8888` / `(61) 3333-4444`, formatando enquanto digita. */
export function formatarTelefone(valor: string): string {
  const n = soDigitos(valor).slice(0, 11);
  if (n.length <= 2) return n ? `(${n}` : "";
  const ddd = `(${n.slice(0, 2)}) `;
  const resto = n.slice(2);
  // Ate 5 digitos ainda nao da para saber se e celular (9) ou fixo (8) — nao
  // adianta chutar o hifen e mexer no cursor de quem esta digitando.
  if (resto.length <= 5) return ddd + resto;
  const corte = resto.length > 8 ? 5 : 4;
  return `${ddd}${resto.slice(0, corte)}-${resto.slice(corte)}`;
}
