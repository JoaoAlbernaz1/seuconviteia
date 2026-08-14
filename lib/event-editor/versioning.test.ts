import { describe, expect, it } from "vitest";
import { createDefaultEventDocument } from "./document";
import { applyVersionedSave, createPublishedSnapshot } from "./persistence";

describe("concorrência otimista do rascunho", () => {
  it("aceita a versão esperada e incrementa uma vez", () => {
    const current = createDefaultEventDocument({ basic: { name: "Ana" } });
    const incoming = createDefaultEventDocument({ basic: { name: "Ana Clara" } });

    const result = applyVersionedSave({ currentDocument: current, currentVersion: 10, expectedVersion: 10, incomingDocument: incoming });

    expect(result).toEqual({ ok: true, document: incoming, version: 11 });
  });

  it("rejeita a segunda aba sem sobrescrever a versão mais nova", () => {
    const current = createDefaultEventDocument({ basic: { name: "Salvo pela aba A" } });
    const stale = createDefaultEventDocument({ basic: { name: "Conteúdo antigo da aba B" } });

    const result = applyVersionedSave({ currentDocument: current, currentVersion: 11, expectedVersion: 10, incomingDocument: stale });

    expect(result).toEqual({ ok: false, reason: "conflict", currentVersion: 11 });
  });
});

describe("snapshot de publicação", () => {
  it("copia o documento validado e alinha a versão publicada", () => {
    const draft = createDefaultEventDocument({ basic: { name: "Ana Clara" } });
    const snapshot = createPublishedSnapshot(draft, 13, new Date("2026-08-14T15:00:00.000Z"));

    expect(snapshot.publishedDocument).toEqual(draft);
    expect(snapshot.publishedDocument).not.toBe(draft);
    expect(snapshot.publishedVersion).toBe(13);
    expect(snapshot.publishedAt.toISOString()).toBe("2026-08-14T15:00:00.000Z");
  });
});
