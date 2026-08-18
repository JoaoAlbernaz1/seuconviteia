// A FICHA da confirmação: tudo o que o convidado respondeu, organizado.
//
// Até 18/08/2026 o `Guest` tinha quatro campos (nome, status, nº de
// acompanhantes e um texto). Como o formulário pergunta muito mais — quem vai e
// quem não vai, nome a nome, telefone, e-mail, restrição alimentar e recado —,
// tudo isso era espremido numa frase só:
//
//   "Confirmados: Ana, João (criança) · Não vão: Pedro · Recado: … · Tel: … ·
//    E-mail: … · Restrição: …"
//
// Agora cada coisa tem a sua coluna. Este módulo entrega a ficha pronta para a
// tela SEM que ela precise saber de qual das duas formas o dado veio: linha
// nova usa as colunas; linha antiga é lida daquela frase.
//
// PURO (sem I/O) para ser testável e rodar dos dois lados.

export type PessoaDaFicha = {
  nome: string;
  tipo: "adulto" | "crianca";
  /** true = vai à festa. */
  vai: boolean;
};

export type Ficha = {
  /** Quem vai e quem não vai, nome a nome. Vazio quando não se sabe. */
  pessoas: PessoaDaFicha[];
  telefone?: string;
  email?: string;
  restricao?: string;
  recado?: string;
};

/** Linha do banco de que a ficha precisa (o resto não interessa aqui). */
export type LinhaConvidado = {
  name: string;
  companions: number;
  message: string | null;
  phone?: string | null;
  email?: string | null;
  dietary?: string | null;
  party?: unknown;
};

const PREFIXOS = [
  ["Confirmados:", "confirmados"],
  ["Não vão:", "recusados"],
  ["Nao vao:", "recusados"],
  ["Recado:", "recado"],
  ["Tel:", "telefone"],
  ["E-mail:", "email"],
  ["Email:", "email"],
  ["Restrição:", "restricao"],
  ["Restricao:", "restricao"],
] as const;

/** "João (criança)" -> { nome: "João", tipo: "crianca" } */
function lerPessoa(bruto: string, vai: boolean): PessoaDaFicha | null {
  const t = bruto.trim();
  if (!t) return null;
  const crianca = /\((crian[çc]a)\)\s*$/i.test(t);
  const nome = t.replace(/\((crian[çc]a)\)\s*$/i, "").trim();
  return nome ? { nome, tipo: crianca ? "crianca" : "adulto", vai } : null;
}

/**
 * Lê a frase antiga. O que não tiver rótulo conhecido é recado — é assim que
 * o formulário simples gravava (só o recado, sem prefixo nenhum).
 */
export function lerFichaLegado(message: string | null | undefined): Ficha {
  const ficha: Ficha = { pessoas: [] };
  if (!message?.trim()) return ficha;

  const soltos: string[] = [];
  for (const parte of message.split("·")) {
    const t = parte.trim();
    if (!t) continue;
    const achado = PREFIXOS.find(([p]) => t.toLowerCase().startsWith(p.toLowerCase()));
    if (!achado) {
      soltos.push(t);
      continue;
    }
    const [prefixo, campo] = achado;
    const valor = t.slice(prefixo.length).trim();
    if (!valor) continue;
    if (campo === "confirmados" || campo === "recusados") {
      const vai = campo === "confirmados";
      for (const nome of valor.split(",")) {
        const pessoa = lerPessoa(nome, vai);
        if (pessoa) ficha.pessoas.push(pessoa);
      }
    } else if (campo === "recado") ficha.recado = valor;
    else if (campo === "telefone") ficha.telefone = valor;
    else if (campo === "email") ficha.email = valor;
    else ficha.restricao = valor;
  }

  if (!ficha.recado && soltos.length > 0) ficha.recado = soltos.join(" · ");
  return ficha;
}

/** As pessoas guardadas em coluna, se a linha for nova e tiver o formato certo. */
function lerParty(party: unknown): PessoaDaFicha[] {
  if (!Array.isArray(party)) return [];
  const pessoas: PessoaDaFicha[] = [];
  for (const item of party) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const nome = typeof o.nome === "string" ? o.nome.trim() : "";
    if (!nome) continue;
    pessoas.push({
      nome,
      tipo: o.tipo === "crianca" ? "crianca" : "adulto",
      vai: o.vai !== false,
    });
  }
  return pessoas;
}

/**
 * A ficha de um convidado. Coluna preenchida MANDA; o resto vem da frase antiga.
 * Assim uma linha antiga continua mostrando telefone e restrição na tela, e uma
 * linha nova não depende de texto nenhum.
 */
export function fichaDoConvidado(linha: LinhaConvidado): Ficha {
  const legado = lerFichaLegado(linha.message);
  const pessoas = lerParty(linha.party);
  return {
    pessoas: pessoas.length > 0 ? pessoas : legado.pessoas,
    telefone: linha.phone?.trim() || legado.telefone,
    email: linha.email?.trim() || legado.email,
    restricao: linha.dietary?.trim() || legado.restricao,
    // Linha nova guarda SÓ o recado em `message`; a antiga guardava a frase toda.
    recado: (linha.party || linha.phone || linha.email || linha.dietary)
      ? linha.message?.trim() || legado.recado
      : legado.recado,
  };
}

/** Quantas pessoas vão, contando o titular. Cai no `companions + 1` do legado. */
export function quantasVao(linha: LinhaConvidado, ficha: Ficha): number {
  const naFicha = ficha.pessoas.filter((p) => p.vai).length;
  return naFicha > 0 ? naFicha : linha.companions + 1;
}
