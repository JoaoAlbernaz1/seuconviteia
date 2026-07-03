"use client";

// Escolha do estilo (cliente): cards das combinações curadas (paleta + letras,
// mesmo visual do passo 2 do wizard) + seletor de cor solta. Trocar qualquer um
// re-tinge o preview AO VIVO. Salvar chama a server action `salvarEstilo`.
import { useState } from "react";
import type { RascunhoPreview } from "@/lib/previewEvento";
import { TEMAS } from "@/lib/temas";
import { CapaEvento } from "../../_ui/CapaEvento";
import { PreviewSite } from "../../_ui/PreviewSite";
import { ESTILOS_SITE, estiloAtual } from "../../_ui/estilosDoSite";
import { salvarEstilo } from "../../acoes";
import { BTN_PRIMARIO, CARD } from "../../_ui/estilos";

export function EscolherEstilo({
  eventId,
  voltar,
  host,
  nome,
  kicker,
  temaAtual,
  fonteAtual,
  rascunhoBase,
}: {
  eventId: string;
  voltar: string;
  host: string;
  nome: string;
  kicker: string;
  temaAtual: string;
  fonteAtual: string;
  rascunhoBase: RascunhoPreview;
}) {
  const [tema, setTema] = useState(temaAtual);
  const [fontes, setFontes] = useState(fonteAtual);

  // Estilo curado que bate com a combinação atual (ou nenhum, quando a cor foi
  // trocada solta — aí nenhum card fica marcado).
  const selId = estiloAtual(tema, fontes)?.id;

  const rascunhoJson = JSON.stringify({ ...rascunhoBase, tema, fontes });

  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form action={salvarEstilo} className="flex flex-col gap-4">
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="voltar" value={voltar} />
        <input type="hidden" name="tema" value={tema} />
        <input type="hidden" name="fontes" value={fontes} />

        <div className="grid grid-cols-2 gap-3.5">
          {ESTILOS_SITE.map((e) => {
            const sel = selId === e.id;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  setTema(e.tema);
                  setFontes(e.fontes);
                }}
                className={`overflow-hidden rounded-[18px] bg-scv-card text-left transition ${
                  sel
                    ? "border-2 border-violeta shadow-[0_18px_40px_-24px_rgba(109,40,217,0.5)]"
                    : "border border-scv-line shadow-[0_12px_32px_-28px_rgba(0,0,0,0.5)] hover:border-scv-dash"
                }`}
              >
                <CapaEvento
                  tema={e.tema}
                  fontes={e.fontes}
                  nome={nome}
                  kicker={kicker}
                  altura={128}
                />
                <span className="flex w-full items-center justify-between px-4 py-3">
                  <span>
                    <span className="block font-display text-base font-semibold text-scv-ink">
                      {e.nome}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] text-scv-muted">
                      {e.tag}
                    </span>
                  </span>
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full ${
                      sel ? "bg-violeta text-white" : "bg-scv-soft text-transparent"
                    }`}
                  >
                    <i className="bi bi-check-lg text-[13px]" aria-hidden />
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className={`${CARD} flex flex-wrap items-center gap-3 px-4 py-3.5`}>
          <span className="shrink-0 text-[12.5px] font-semibold text-scv-ink">
            Cor do site
          </span>
          <span className="flex flex-wrap gap-2">
            {Object.values(TEMAS).map((t) => {
              const sel = tema === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  title={t.label}
                  aria-label={`Cor ${t.label}`}
                  aria-pressed={sel}
                  onClick={() => setTema(t.key)}
                  className="size-[26px] shrink-0 rounded-full transition"
                  style={{
                    background: `linear-gradient(135deg, ${t.vars["--ev-rosa"]}, ${t.vars["--ev-framboesa-deep"]})`,
                    boxShadow: sel
                      ? "0 0 0 2px var(--scv-card), 0 0 0 4px #6D28D9"
                      : "0 0 0 1px rgba(0,0,0,0.12)",
                  }}
                />
              );
            })}
          </span>
        </div>

        <button type="submit" className={`${BTN_PRIMARIO} mt-1 w-full`}>
          Salvar estilo
        </button>
      </form>

      <div className="lg:sticky lg:top-[86px]">
        <PreviewSite rascunhoJson={rascunhoJson} pagina="inicio" host={host} />
      </div>
    </div>
  );
}
