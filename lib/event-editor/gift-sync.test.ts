import { describe, expect, it } from "vitest";
import { planGiftSync } from "./gift-sync";

describe("proteção do ledger de presentes", () => {
  it("não apaga, recria nem altera presente quando existe contribuição paga", () => {
    const gift = { id: "gift-1", title: "Vestido", priceCents: 120000 };
    const contribution = { giftItemId: gift.id, status: "PAID", grossCents: 120000, feeCents: 6000, netCents: 114000 };

    const plan = planGiftSync({
      existingIds: [gift.id],
      incomingIds: [gift.id],
      contributionCount: 1,
    });

    expect(plan).toEqual({ protectedByLedger: true, upsertIds: [], removeIds: [] });
    expect(gift).toEqual({ id: "gift-1", title: "Vestido", priceCents: 120000 });
    expect(contribution).toEqual({ giftItemId: "gift-1", status: "PAID", grossCents: 120000, feeCents: 6000, netCents: 114000 });
  });

  it("mantém ids estáveis quando a sincronização é permitida", () => {
    expect(planGiftSync({ existingIds: ["gift-1"], incomingIds: ["gift-1", "gift-2"], contributionCount: 0 }))
      .toEqual({ protectedByLedger: false, upsertIds: ["gift-1", "gift-2"], removeIds: [] });
  });
});
