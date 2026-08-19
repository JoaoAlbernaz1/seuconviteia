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

  // O caso que separa a ORDEM das checagens: prazo vencido E fora do ar ao mesmo
  // tempo.
  //
  // A ordem MUDOU em 19/08/2026 (era `foraDoAr` primeiro). O motivo: a tela de
  // "fora do ar" diz ao visitante "volte mais tarde", e todo convite pausado
  // acaba vencendo (`expiresAt` = festa + 2 dias). Depois do vencimento o painel
  // do dono passa a dizer "Festa encerrada" e nao oferece mais "Voltar ao ar" —
  // o convidado ficava esperando uma volta impossivel. Agora as duas pontas
  // respondem igual: `eventoPublico` e `estadoDoConvite` (lib/estadoConvite)
  // perguntam o fim da festa ANTES da pausa. Nao inverta sem trocar as duas.
  it("fora do ar com prazo vencido -> expirado (encerrada vence a pausa)", () => {
    expect(
      eventoPublico({ status: "PUBLISHED", expiresAt: passado, foraDoAr: true }, agora),
    ).toEqual({ ok: false, motivo: "expirado" });
  });

  it("publicado, no prazo e no ar -> ok", () => {
    expect(
      eventoPublico({ status: "PUBLISHED", expiresAt: futuro, foraDoAr: false }, agora),
    ).toEqual({ ok: true });
  });
});
