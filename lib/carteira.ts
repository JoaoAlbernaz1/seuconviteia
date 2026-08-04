// Carteira do cofre (modelo Wedy): antes de poder RESGATAR, o dono "ativa a
// carteira" informando os dados do titular (nome, CPF, celular) + a chave Pix
// de recebimento. O estado vive em `Event.customization.carteira`; a chave Pix
// segue nas colunas `payoutPixKey/payoutPixName` (usadas pelo resgate).
//
// PURO: sem Prisma/IO — validação de CPF, máscara e leitura do customization.
// A action que grava (`ativarCarteira`) fica em `lib/cofre.ts`.

export type Carteira = {
  ativa: boolean;
  /** Nome completo do titular (quem recebe). */
  titular?: string;
  /** CPF do titular — armazenado só dígitos; exibir SEMPRE mascarado. */
  cpf?: string;
  /** Data de nascimento (ISO yyyy-mm-dd). */
  nascimento?: string;
  /** Celular de contato (só dígitos). */
  celular?: string;
  /** Ocupação/profissão do titular. */
  ocupacao?: string;
  /** Endereço do titular (KYC). */
  endereco?: { cep: string; logradouro: string; cidade: string; uf: string };
  /** ISO de quando a carteira foi ativada. */
  ativadaEm?: string;
};

/** Só os dígitos de uma string ("123.456.789-09" -> "12345678909"). */
export function soDigitos(s: string): string {
  return s.replace(/\D+/g, "");
}

/** CPF válido? (11 dígitos + dígitos verificadores; rejeita sequências iguais). */
export function cpfValido(cpf: string): boolean {
  const d = soDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let soma = 0;
    for (let i = 0; i < len; i++) soma += Number(d[i]) * (len + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

/** CPF mascarado para exibição: "•••.456.789-09". */
export function mascararCpf(cpf: string): string {
  const d = soDigitos(cpf);
  if (d.length !== 11) return "•••";
  return `•••.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Lê a carteira do `customization` do evento (ausente/inválida -> inativa). */
export function lerCarteira(customization: unknown): Carteira {
  if (customization && typeof customization === "object" && "carteira" in customization) {
    const c = (customization as { carteira?: unknown }).carteira;
    if (c && typeof c === "object" && (c as { ativa?: unknown }).ativa === true) {
      const o = c as Record<string, unknown>;
      const e = o.endereco;
      const endereco =
        e && typeof e === "object"
          ? {
              cep: String((e as Record<string, unknown>).cep ?? ""),
              logradouro: String((e as Record<string, unknown>).logradouro ?? ""),
              cidade: String((e as Record<string, unknown>).cidade ?? ""),
              uf: String((e as Record<string, unknown>).uf ?? ""),
            }
          : undefined;
      return {
        ativa: true,
        titular: typeof o.titular === "string" ? o.titular : undefined,
        cpf: typeof o.cpf === "string" ? o.cpf : undefined,
        nascimento: typeof o.nascimento === "string" ? o.nascimento : undefined,
        celular: typeof o.celular === "string" ? o.celular : undefined,
        ocupacao: typeof o.ocupacao === "string" ? o.ocupacao : undefined,
        endereco,
        ativadaEm: typeof o.ativadaEm === "string" ? o.ativadaEm : undefined,
      };
    }
  }
  return { ativa: false };
}
