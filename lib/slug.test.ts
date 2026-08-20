import { describe, it, expect } from "vitest";
import { ehReservado, gerarSlugUnico } from "./slug";

const nuncaExiste = async () => false;

/** Predicado `existe` a partir de um conjunto de slugs ocupados. */
function existeEm(slugs: string[]) {
  const set = new Set(slugs);
  return async (slug: string) => set.has(slug);
}

describe("gerarSlugUnico", () => {
  it("retorna o slug base quando esta livre", async () => {
    expect(await gerarSlugUnico("Maria Clara", nuncaExiste)).toBe("maria-clara");
  });

  it("sufixa -2 quando o slug base ja existe", async () => {
    const existe = existeEm(["maria-clara"]);
    expect(await gerarSlugUnico("Maria Clara", existe)).toBe("maria-clara-2");
  });

  it("incrementa o sufixo (-2, -3, ...) ate achar um livre", async () => {
    const existe = existeEm(["festa", "festa-2", "festa-3"]);
    expect(await gerarSlugUnico("Festa", existe)).toBe("festa-4");
  });

  it("trata palavras reservadas como ocupadas", async () => {
    expect(await gerarSlugUnico("app", nuncaExiste)).toBe("app-2");
    expect(await gerarSlugUnico("admin", nuncaExiste)).toBe("admin-2");
  });

  // A TELA usa a mesma funcao (`CriarConvite.tsx`): a lista inventada que
  // estava la dizia "disponivel" para `admin`, e o servidor devolvia `admin-2`
  // ja congelado. Uma lista so, e este par prova que as duas concordam.
  it("`ehReservado` concorda com o que `gerarSlugUnico` recusa", async () => {
    expect(ehReservado("admin")).toBe(true);
    expect(ehReservado("app")).toBe(true);
    expect(ehReservado("maria15")).toBe(false);
    expect(await gerarSlugUnico("maria15", nuncaExiste)).toBe("maria15");
  });

  it("usa 'evento' como base quando o slug fica vazio", async () => {
    expect(await gerarSlugUnico("!!!", nuncaExiste)).toBe("evento");
    expect(await gerarSlugUnico("", nuncaExiste)).toBe("evento");
  });
});
