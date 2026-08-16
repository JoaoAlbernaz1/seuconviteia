import { describe, expect, it } from "vitest";
import { activeDraftPointerKey, localDraftKey } from "./local-draft";

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
