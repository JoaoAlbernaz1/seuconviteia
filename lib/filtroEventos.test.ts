import { describe, expect, it } from "vitest";
import { filtrarEOrdenar, type ItemFiltravel } from "./filtroEventos";

const itens: ItemFiltravel[] = [
  {
    id: "a",
    titulo: "Casamento Ana",
    estado: "NO_AR",
    criadoEm: new Date("2026-01-01"),
    dataEvento: new Date("2026-12-01"),
  },
  {
    id: "b",
    titulo: "15 Anos Bárbara",
    estado: "RASCUNHO",
    criadoEm: new Date("2026-03-01"),
    dataEvento: new Date("2026-09-01"),
  },
  {
    id: "c",
    titulo: "Bodas Célia",
    estado: "EXPIRADO",
    criadoEm: new Date("2026-02-01"),
    dataEvento: new Date("2026-05-01"),
  },
  {
    id: "d",
    titulo: "Aniversário Duda",
    estado: "NO_AR_PENDENTE",
    criadoEm: new Date("2026-04-01"),
    dataEvento: new Date("2026-10-01"),
  },
];

const ids = (r: ItemFiltravel[]) => r.map((i) => i.id);

describe("filtrarEOrdenar", () => {
  it("sem busca e sem filtro, devolve tudo", () => {
    expect(filtrarEOrdenar(itens, "", "TODOS", "RECENTES")).toHaveLength(4);
  });

  it("busca ignora acento e caixa", () => {
    expect(ids(filtrarEOrdenar(itens, "barbara", "TODOS", "RECENTES"))).toEqual(["b"]);
    expect(ids(filtrarEOrdenar(itens, "ANIVERSARIO", "TODOS", "RECENTES"))).toEqual(["d"]);
  });

  it("filtro NO_AR inclui os que tem pendencia", () => {
    expect(ids(filtrarEOrdenar(itens, "", "NO_AR", "RECENTES")).sort()).toEqual(["a", "d"]);
  });

  it("filtro EXPIRADO", () => {
    expect(ids(filtrarEOrdenar(itens, "", "EXPIRADO", "RECENTES"))).toEqual(["c"]);
  });

  it("ordem RECENTES: criado mais recente primeiro", () => {
    expect(ids(filtrarEOrdenar(itens, "", "TODOS", "RECENTES"))).toEqual(["d", "b", "c", "a"]);
  });

  it("ordem PROXIMOS: data do evento mais proxima primeiro", () => {
    expect(ids(filtrarEOrdenar(itens, "", "TODOS", "PROXIMOS"))).toEqual(["c", "b", "d", "a"]);
  });

  it("ordem ALFABETICA respeita acento do portugues", () => {
    expect(ids(filtrarEOrdenar(itens, "", "TODOS", "ALFABETICA"))).toEqual(["b", "d", "c", "a"]);
  });

  it("nao muta a lista recebida", () => {
    const copia = [...itens];
    filtrarEOrdenar(itens, "", "TODOS", "ALFABETICA");
    expect(itens).toEqual(copia);
  });
});
