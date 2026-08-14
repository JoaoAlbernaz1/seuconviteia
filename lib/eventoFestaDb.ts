import "server-only";
import { cache } from "react";
import { prisma } from "./db";
import { publishedEventProjection } from "./event-editor/public-document";

/** Query server-only separada do adapter puro, permitindo usar o renderer no cliente. */
export const carregarEventoFesta = cache(async (sub: string) => {
  const event = await prisma.event.findUnique({
    where: { subdomain: sub },
    include: { professional: true, template: true, gifts: { orderBy: { id: "asc" } }, photos: true },
  });
  return event ? publishedEventProjection(event) : null;
});
