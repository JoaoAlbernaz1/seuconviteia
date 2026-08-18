import { describe, expect, it } from "vitest";
import { secaoEmLeitura } from "./focoVisivel";

const JANELA = 900; // linha de leitura em 315px

describe("secaoEmLeitura", () => {
  it("no topo do passo, vale a primeira seção (a galeria, não o mural)", () => {
    // Foi o erro da primeira tentativa: por "maior área", o cartão mais ALTO
    // vencia e o passo abria mostrando os recados.
    expect(
      secaoEmLeitura(
        [
          { sec: "galeria", topo: 10, altura: 300 },
          { sec: "recados", topo: 320, altura: 1200 },
        ],
        JANELA,
      ),
    ).toBe("galeria");
  });

  it("ao rolar até o mural, a prévia acompanha", () => {
    expect(
      secaoEmLeitura(
        [
          { sec: "galeria", topo: -420, altura: 300 },
          { sec: "recados", topo: 120, altura: 1200 },
        ],
        JANELA,
      ),
    ).toBe("recados");
  });

  it("seção que já saiu por cima não conta", () => {
    expect(
      secaoEmLeitura(
        [
          { sec: "galeria", topo: -800, altura: 300 },
          { sec: "recados", topo: 40, altura: 1200 },
        ],
        JANELA,
      ),
    ).toBe("recados");
  });

  it("com a seção seguinte ainda abaixo da linha, continua na anterior", () => {
    expect(
      secaoEmLeitura(
        [
          { sec: "galeria", topo: -50, altura: 500 },
          { sec: "recados", topo: 460, altura: 1200 },
        ],
        JANELA,
      ),
    ).toBe("galeria");
  });

  it("nada na tela não escolhe nada (o foco atual continua)", () => {
    expect(secaoEmLeitura([], JANELA)).toBeUndefined();
    expect(secaoEmLeitura([{ sec: "galeria", topo: -900, altura: 300 }], JANELA)).toBeUndefined();
  });
});
