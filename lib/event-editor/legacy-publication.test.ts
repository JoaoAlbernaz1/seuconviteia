import { describe, expect, it } from "vitest";
import { createDefaultEventDocument } from "./document";
import { initializeLegacyPublishedEvent, publishDraftSnapshot, publicSnapshot } from "./legacy-publication";

describe("bootstrap de publicação legada", () => {
  it("congela A antes da primeira edição e só publica B explicitamente", () => {
    const legacyA = createDefaultEventDocument({ basic: { name: "A" } });
    const draftB = createDefaultEventDocument({ basic: { name: "B" } });
    const initialized = initializeLegacyPublishedEvent({ status: "PUBLISHED", draftData: null, publishedData: null, draftVersion: 0, publishedVersion: 0 }, legacyA);

    expect(initialized.changed).toBe(true);
    expect(publicSnapshot(initialized.state)?.basic.name).toBe("A");

    const edited = { ...initialized.state, draftData: draftB, draftVersion: 1 };
    expect(publicSnapshot(edited)?.basic.name).toBe("A");
    expect(publicSnapshot(publishDraftSnapshot(edited))?.basic.name).toBe("B");
  });

  it("é idempotente e não substitui snapshots existentes", () => {
    const legacy = createDefaultEventDocument({ basic: { name: "Legado" } });
    const published = createDefaultEventDocument({ basic: { name: "Publicado" } });
    const current = { status: "PUBLISHED", draftData: published, publishedData: published, draftVersion: 3, publishedVersion: 3 };
    expect(initializeLegacyPublishedEvent(current, legacy)).toEqual({ changed: false, state: current });
  });
});
