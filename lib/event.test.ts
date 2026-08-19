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
    expect(
      eventoPublico({ status: "DRAFT", expiresAt: futuro, foraDoAr: false }, agora),
    ).toEqual({ ok: false, motivo: "rascunho" });
  });

  it("status EXPIRED -> expirado (mesmo com expiresAt no futuro)", () => {
    expect(
      eventoPublico({ status: "EXPIRED", expiresAt: futuro, foraDoAr: false }, agora),
    ).toEqual({ ok: false, motivo: "expirado" });
  });

  it("expiresAt no passado -> expirado", () => {
    expect(
      eventoPublico({ status: "PUBLISHED", expiresAt: passado, foraDoAr: false }, agora),
    ).toEqual({ ok: false, motivo: "expirado" });
  });

  it("fora do ar -> fora-do-ar (mesmo publicado e no prazo)", () => {
    expect(
      eventoPublico({ status: "PUBLISHED", expiresAt: futuro, foraDoAr: true }, agora),
    ).toEqual({ ok: false, motivo: "fora-do-ar" });
  });

  it("publicado, no prazo e no ar -> ok", () => {
    expect(
      eventoPublico({ status: "PUBLISHED", expiresAt: futuro, foraDoAr: false }, agora),
    ).toEqual({ ok: true });
  });
});
