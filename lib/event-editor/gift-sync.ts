export function planGiftSync({
  existingIds,
  incomingIds,
  contributionCount,
}: {
  existingIds: string[];
  incomingIds: string[];
  contributionCount: number;
}) {
  if (contributionCount > 0) {
    return { protectedByLedger: true as const, upsertIds: [] as string[], removeIds: [] as string[] };
  }
  const incoming = new Set(incomingIds);
  return {
    protectedByLedger: false as const,
    upsertIds: [...incomingIds],
    removeIds: existingIds.filter((id) => !incoming.has(id)),
  };
}
