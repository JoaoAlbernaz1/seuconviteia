import { describe, expect, it } from "vitest";
import { fichaDoConvidado, lerFichaLegado, quantasVao } from "./rsvpFicha";

const vazia = { name: "Ana", companions: 0, message: null };

describe("lerFichaLegado", () => {
  it("lê a frase inteira que o sistema gravava antes", () => {
    const f = lerFichaLegado(
      "Confirmados: Ana, João (criança) · Não vão: Pedro · Recado: Vai ser lindo! · Tel: 11 99999-0000 · E-mail: ana@teste.com · Restrição: sem glúten",
    );
    expect(f.pessoas).toEqual([
      { nome: "Ana", tipo: "adulto", vai: true },
      { nome: "João", tipo: "crianca", vai: true },
      { nome: "Pedro", tipo: "adulto", vai: false },
    ]);
    expect(f.recado).toBe("Vai ser lindo!");
    expect(f.telefone).toBe("11 99999-0000");
    expect(f.email).toBe("ana@teste.com");
    expect(f.restricao).toBe("sem glúten");
  });

  it("texto sem rótulo nenhum é recado (o formulário simples gravava assim)", () => {
    expect(lerFichaLegado("Nao perco por nada!").recado).toBe("Nao perco por nada!");
  });

  it("aguenta sem acento e sem alguns pedaços", () => {
    const f = lerFichaLegado("Confirmados: Ana · Tel: 11 98888-0000 · Restricao: vegetariana");
    expect(f.pessoas).toHaveLength(1);
    expect(f.restricao).toBe("vegetariana");
    expect(f.email).toBeUndefined();
  });

  it("vazio, nulo ou só espaço devolve ficha vazia", () => {
    expect(lerFichaLegado(null).pessoas).toEqual([]);
    expect(lerFichaLegado("   ").recado).toBeUndefined();
  });
});

describe("fichaDoConvidado", () => {
  it("linha NOVA: as colunas mandam e o recado é só o recado", () => {
    const f = fichaDoConvidado({
      name: "Ana",
      companions: 1,
      message: "Vai ser lindo!",
      phone: "11 99999-0000",
      email: "ana@teste.com",
      dietary: "sem glúten",
      party: [
        { nome: "Ana", tipo: "adulto", vai: true },
        { nome: "Pedro", tipo: "adulto", vai: false },
      ],
    });
    expect(f.pessoas.map((p) => p.nome)).toEqual(["Ana", "Pedro"]);
    expect(f.recado).toBe("Vai ser lindo!");
    expect(f.telefone).toBe("11 99999-0000");
  });

  it("linha ANTIGA continua mostrando tudo, lida da frase", () => {
    const f = fichaDoConvidado({
      name: "Ana",
      companions: 1,
      message: "Confirmados: Ana, Bia · Tel: 11 97777-0000",
    });
    expect(f.pessoas).toHaveLength(2);
    expect(f.telefone).toBe("11 97777-0000");
  });

  it("coluna vazia não apaga o que a frase antiga tinha", () => {
    const f = fichaDoConvidado({
      ...vazia,
      message: "Confirmados: Ana · Restrição: sem lactose",
      phone: "11 96666-0000",
      dietary: null,
    });
    expect(f.telefone).toBe("11 96666-0000");
    expect(f.restricao).toBe("sem lactose");
  });
});

describe("quantasVao", () => {
  it("conta pela ficha quando ela tem gente", () => {
    const linha = { name: "Ana", companions: 0, message: null, party: [
      { nome: "Ana", tipo: "adulto", vai: true },
      { nome: "Bia", tipo: "adulto", vai: true },
      { nome: "Léo", tipo: "adulto", vai: false },
    ] };
    expect(quantasVao(linha, fichaDoConvidado(linha))).toBe(2);
  });

  it("sem ficha, cai no titular + acompanhantes", () => {
    const linha = { name: "Ana", companions: 2, message: null };
    expect(quantasVao(linha, fichaDoConvidado(linha))).toBe(3);
  });
});
