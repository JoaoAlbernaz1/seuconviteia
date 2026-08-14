"use client";

import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { PaginaEvento } from "@/components/evt/paginas/PaginaEvento";
import { PaginaGaleria } from "@/components/evt/paginas/PaginaGaleria";
import { PaginaInicio } from "@/components/evt/paginas/PaginaInicio";
import { PaginaObrigada } from "@/components/evt/paginas/PaginaObrigada";
import { PaginaPresentes } from "@/components/evt/paginas/PaginaPresentes";
import { PaginaRecados } from "@/components/evt/paginas/PaginaRecados";
import { RsvpConvite } from "@/components/evt/RsvpConvite";
import { SiteAtmosphere } from "@/components/evt/SiteAtmosphere";
import { SiteFooter } from "@/components/evt/SiteFooter";
import { SiteNav } from "@/components/evt/SiteNav";
import type { EventEditorDocument } from "@/lib/event-editor/document";
import { documentToRenderModel } from "@/lib/event-editor/render";
import { lerEventoFesta } from "@/lib/eventoFesta";
import { fonteCapsCombinada, fonteTemNegritoNoNome, varsDaFonteCombinada } from "@/lib/fontes";
import { varsDoTema } from "@/lib/temas";

export type InvitationRendererPage = "inicio" | "evento" | "confirmar" | "presentes" | "galeria" | "recados" | "obrigada";

export function InvitationRenderer({
  document,
  mode,
  page = "inicio",
  eventId = "preview",
  accepted = true,
}: {
  document: EventEditorDocument;
  mode: "preview" | "published";
  page?: InvitationRendererPage;
  eventId?: string;
  accepted?: boolean;
}) {
  const model = documentToRenderModel(document);
  const evento = lerEventoFesta(model.event);
  const fontCaps = fonteCapsCombinada(document.appearance.font) ? " evt-fonte-caps" : "";
  const bold = document.appearance.bold
    ? ` evt-negrito${fonteTemNegritoNoNome(document.appearance.font) ? " evt-negrito-nome" : ""}`
    : "";
  const inert = mode === "preview" ? " [&_a]:pointer-events-none [&_button]:pointer-events-none" : "";
  const rsvpConfig = {
    permitirAcompanhantes: document.rsvp.companionsEnabled,
    pedirNomeAcompanhantes: document.rsvp.requestCompanionNames,
    maxAcompanhantes: document.rsvp.maxCompanions,
    pedirTelefone: document.rsvp.requestPhone,
    pedirEmail: document.rsvp.requestEmail,
    pedirRestricao: document.rsvp.requestDietaryRestrictions,
    permitirRecado: document.rsvp.allowMessage,
    corBotao: document.rsvp.buttonColor,
    dataLimite: document.rsvp.deadline || undefined,
    msgConfirma: document.rsvp.confirmationMessage || undefined,
    msgRecusa: document.rsvp.declineMessage || undefined,
  };

  let body: React.ReactNode;
  if (page === "evento") body = <PaginaEvento evento={evento} nicho={model.nicho} recursos={model.resources} />;
  else if (page === "presentes") body = <PaginaPresentes evento={evento} nicho={model.nicho} recursos={model.resources} usarVitrine={document.gifts.listModel === "vitrine"} />;
  else if (page === "galeria") body = <PaginaGaleria evento={evento} nicho={model.nicho} recursos={model.resources} />;
  else if (page === "recados") body = <PaginaRecados evento={evento} nicho={model.nicho} recursos={model.resources} eventId={eventId} preview={mode === "preview"} />;
  else if (page === "confirmar") {
    body = <RsvpConvite eventId={eventId} nome={evento.primeiroNome} fotoUrl={evento.fotoUrl} config={rsvpConfig} preview={mode === "preview"} />;
  } else if (page === "obrigada") body = <PaginaObrigada evento={evento} config={rsvpConfig} vai={accepted} />;
  else body = <PaginaInicio evento={evento} nicho={model.nicho} recursos={model.resources} />;

  return (
    <div
      data-invitation-renderer={mode}
      className={`evt${fontCaps}${bold}${document.appearance.animations ? "" : " evt-sem-anim"}${inert} ${EVT_FONTS_CLASS} font-evt-body text-evt-ink flex min-h-full flex-col`}
      style={{ ...varsDoTema(document.appearance.theme, document.appearance.customColor), ...varsDaFonteCombinada(document.appearance.font) }}
    >
      <SiteAtmosphere fotoUrl={evento.fotoUrl} />
      <SiteNav nome={evento.primeiroNome} logoUrl={evento.logoUrl} monograma={evento.monograma} recursos={model.resources} />
      {body}
      {model.footerEnabled && <SiteFooter nome={evento.primeiroNome} linhaInfo={evento.footerInfo} mensagem={evento.rodapeMsg} whiteLabel={false} />}
    </div>
  );
}
