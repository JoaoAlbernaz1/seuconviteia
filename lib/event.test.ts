import { describe, it, expect } from "vitest";
import { eventoPublico } from "./event";

const agora = new Date("2025-06-01T12:00:00Z");
const futuro = new Date("2030-01-01T00:00:00Z");
const passado = new Date("2020-01-01T00:00:00Z");

describe("eventoPublico", () => {
  it("evento inexistente (null) -> inexistente", () => {
    expect(eventoPublico(null, agora)).toEqual({
      ok: false,
      motivo: "inexistente",
    });
  });

  it("status DRAFT -> rascunho", () => {
    expect(eventoPublico({ status: "DRAFT", expiresAt: futuro }, agora)).toEqual(
      { ok: false, motivo: "rascunho" },
    );
  });

  it("status EXPIRED -> expirado (mesmo com expiresAt no futuro)", () => {
    expect(
      eventoPublico({ status: "EXPIRED", expiresAt: futuro }, agora),
    ).toEqual({ ok: false, motivo: "expirado" });
  });

  it("expiresAt no passado -> expirado", () => {
    expect(
      eventoPublico({ status: "PUBLISHED", expiresAt: passado }, agora),
    ).toEqual({ ok: false, motivo: "expirado" });
  });

  it("PUBLISHED e dentro do prazo -> ok", () => {
    expect(
      eventoPublico({ status: "PUBLISHED", expiresAt: futuro }, agora),
    ).toEqual({ ok: true });
  });
});
