import { describe, expect, it } from "vitest";
import { estadoDoEvento, pendenciaDoEvento } from "./painelEstado";

const AGORA = new Date("2026-07-10T12:00:00Z");
const FUTURO = new Date("2026-08-10T12:00:00Z");
const PASSADO = new Date("2026-06-10T12:00:00Z");

describe("estadoDoEvento", () => {
  it("rascunho", () => {
    expect(
      estadoDoEvento({ status: "DRAFT", expiresAt: FUTURO }, null, AGORA),
    ).toBe("RASCUNHO");
  });

  it("publicado e dentro do prazo", () => {
    expect(
      estadoDoEvento({ status: "PUBLISHED", expiresAt: FUTURO }, null, AGORA),
    ).toBe("NO_AR");
  });

  it("publicado COM pendencia", () => {
    expect(
      estadoDoEvento(
        { status: "PUBLISHED", expiresAt: FUTURO },
        "faltam as fotos",
        AGORA,
      ),
    ).toBe("NO_AR_PENDENTE");
  });

  it("PUBLISHED com prazo vencido e EXPIRADO, nao NO_AR", () => {
    expect(
      estadoDoEvento({ status: "PUBLISHED", expiresAt: PASSADO }, null, AGORA),
    ).toBe("EXPIRADO");
  });

  it("status EXPIRED explicito", () => {
    expect(
      estadoDoEvento({ status: "EXPIRED", expiresAt: FUTURO }, null, AGORA),
    ).toBe("EXPIRADO");
  });

  it("expirado vence a pendencia (nao adianta pedir fotos de um site fora do ar)", () => {
    expect(
      estadoDoEvento(
        { status: "PUBLISHED", expiresAt: PASSADO },
        "faltam as fotos",
        AGORA,
      ),
    ).toBe("EXPIRADO");
  });

  it("rascunho vencido continua rascunho (nunca esteve no ar)", () => {
    expect(
      estadoDoEvento({ status: "DRAFT", expiresAt: PASSADO }, null, AGORA),
    ).toBe("RASCUNHO");
  });
});

describe("pendenciaDoEvento", () => {
  it("sem foto: a foto vem primeiro", () => {
    expect(pendenciaDoEvento(false, 0)).toBe("faltam as fotos");
  });
  it("com foto e sem presentes", () => {
    expect(pendenciaDoEvento(true, 0)).toBe("falta a lista de presentes");
  });
  it("tudo pronto", () => {
    expect(pendenciaDoEvento(true, 3)).toBeNull();
  });
});
