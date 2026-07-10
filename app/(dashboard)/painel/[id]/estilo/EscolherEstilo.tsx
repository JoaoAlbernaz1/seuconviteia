"use client";

// Escolha do ESTILO do site (cliente): 3 eixos independentes —
//   1. TEMPLATE (layout real do site) — cards por ocasião;
//   2. COR (qualquer paleta);
//   3. LETRAS (qualquer dupla de fontes).
// Escolher um template aplica a paleta/fonte padrão dele como ponto de partida
// (a pessoa ajusta cor/letras logo abaixo). Trocar qualquer eixo re-tinge o
// preview AO VIVO. Salvar chama `salvarEstilo` (merge parcial no customization —
// o conteúdo do evento é preservado).
import { useState } from "react";
import type { RascunhoPreview } from "@/lib/previewEvento";
import { TEMAS } from "@/lib/temas";
import { FONTES } from "@/lib/fontes";
import { templatesPorOcasiao, ocasiaoDoNicho } from "@/lib/templates";
import { capaDemo } from "@/lib/demoFotos";
import { CardTemplate } from "../../_ui/CardTemplate";
import { PreviewSite } from "../../_ui/PreviewSite";
import { salvarEstilo } from "../../acoes";
import { BTN_PRIMARIO, CARD } from "../../_ui/estilos";

export function EscolherEstilo({
  eventId,
  voltar,
  host,
  nicho,
  nome,
  temaAtual,
  fonteAtual,
  templateAtual,
  rascunhoBase,
}: {
  eventId: string;
  voltar: string;
  host: string;
  nicho: string;
  nome: string;
  kicker?: string;
  temaAtual: string;
  fonteAtual: string;
  templateAtual: string;
  rascunhoBase: RascunhoPreview;
}) {
  const [tema, setTema] = useState(temaAtual);
  const [fontes, setFontes] = useState(fonteAtual);
  const [template, setTemplate] = useState(templateAtual);

  const ocasiao = ocasiaoDoNicho(nicho);
  const templates = templatesPorOcasiao(nicho);
  const fotoDemo = capaDemo(ocasiao);

  const rascunhoJson = JSON.stringify({ ...rascunhoBase, tema, fontes, template });

  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form action={salvarEstilo} className="flex flex-col gap-5">
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="voltar" value={voltar} />
        <input type="hidden" name="tema" value={tema} />
        <input type="hidden" name="fontes" value={fontes} />
        <input type="hidden" name="template" value={template} />

        {/* 1 · TEMPLATE (layout do site) */}
        <div>
          <p className="mb-3 text-[12.5px] font-semibold text-scv-ink">Template do site</p>
          <div className="grid grid-cols-2 gap-3.5">
            {templates.map((tpl) => (
              <CardTemplate
                key={tpl.id}
                tpl={tpl}
                nome={nome}
                fotoUrl={fotoDemo}
                altura={128}
                selecionado={template === tpl.id}
                onSelect={() => {
                  setTemplate(tpl.id);
                  setTema(tpl.paletaPadrao);
                  setFontes(tpl.fontesPadrao);
                }}
              />
            ))}
          </div>
        </div>

        {/* 2 · COR (qualquer paleta) */}
        <div className={`${CARD} flex flex-wrap items-center gap-3 px-4 py-3.5`}>
          <span className="shrink-0 text-[12.5px] font-semibold text-scv-ink">Cor do site</span>
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
                      ? "0 0 0 2px var(--scv-card), 0 0 0 4px #7A40ED"
                      : "0 0 0 1px rgba(0,0,0,0.12)",
                  }}
                />
              );
            })}
          </span>
        </div>

        {/* 3 · LETRAS (qualquer dupla) */}
        <div className={`${CARD} flex flex-wrap items-center gap-3 px-4 py-3.5`}>
          <span className="shrink-0 text-[12.5px] font-semibold text-scv-ink">Letras</span>
          <span className="flex flex-wrap gap-2">
            {Object.values(FONTES).map((f) => {
              const sel = fontes === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={sel}
                  onClick={() => setFontes(f.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    sel
                      ? "bg-violeta text-white"
                      : "bg-scv-soft text-scv-muted hover:text-scv-ink"
                  }`}
                >
                  {f.label}
                </button>
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
