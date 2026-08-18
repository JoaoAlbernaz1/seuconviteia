import { describe, expect, it } from "vitest";
import { activeDraftPointerKey, localDraftKey, versaoInicialDoRascunho } from "./local-draft";

describe("escopo do recovery local", () => {
  it("isola convites existentes por eventId", () => {
    expect(localDraftKey("event-a", "user-1")).toBe("sc-editor-rascunho:event-a");
    expect(localDraftKey("event-b", "user-1")).toBe("sc-editor-rascunho:event-b");
  });

  it("isola criação por usuário e usa ponteiro separado", () => {
    expect(localDraftKey(null, "user-1")).toBe("sc-editor-rascunho:new:user-1");
    expect(activeDraftPointerKey("user-1")).toBe("sc-editor-active:user-1");
  });
});

describe("versaoInicialDoRascunho", () => {
  it("convite carregado do servidor: manda a versao DO SERVIDOR, nao a do navegador", () => {
    // O bug: o navegador guardava 5, o servidor entregou 7, o editor mandava 5
    // e todo save voltava "alterado em outra aba" — com uma aba so.
    expect(
      versaoInicialDoRascunho({
        initialEventId: "evt_1",
        initialDraftVersion: 7,
        salvo: { eventId: "evt_1", draftVersion: 5 },
      }),
    ).toBe(7);
  });

  it("mesmo com o rascunho local de OUTRO convite, vale a versao do servidor", () => {
    expect(
      versaoInicialDoRascunho({
        initialEventId: "evt_1",
        initialDraftVersion: 3,
        salvo: { eventId: "evt_2", draftVersion: 99 },
      }),
    ).toBe(3);
  });

  it("sem carga do servidor (retomada pelo ponteiro), usa a do navegador", () => {
    expect(
      versaoInicialDoRascunho({
        initialDraftVersion: 0,
        salvo: { eventId: "evt_9", draftVersion: 4 },
      }),
    ).toBe(4);
  });

  it("sem nada guardado, comeca do zero", () => {
    expect(versaoInicialDoRascunho({ initialDraftVersion: 0, salvo: null })).toBe(0);
    expect(versaoInicialDoRascunho({ initialDraftVersion: 0, salvo: { draftVersion: 4 } })).toBe(0);
  });
});
