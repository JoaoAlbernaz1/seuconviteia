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
import { templatesPorOcasiao, ocasiaoDoNicho } from "@/lib/templates";
import { capaDemo } from "@/lib/demoFotos";
import { CardTemplate } from "../../_ui/CardTemplate";
import { SeletorFontes } from "../../_ui/SeletorFontes";
import { PreviewSite } from "../../_ui/PreviewSite";
import { salvarEstilo } from "../../acoes";
import { BTN_PRIMARIO, CARD } from "../../_ui/estilos";
import { TopoCartao } from "../../_ui/TopoCartao";

/** Multiplicador do tamanho do lockup da capa (mesmos passos do wizard). */
const ESCALAS_CAPA = [0.9, 1, 1.15] as const;
const TAMANHOS = ["Pequeno", "Médio", "Grande"];

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
  const [capaEscala, setCapaEscala] = useState<number>(rascunhoBase.capaEscala ?? 1);

  const ocasiao = ocasiaoDoNicho(nicho);
  const templates = templatesPorOcasiao(nicho);
  const fotoDemo = capaDemo(ocasiao);

  const rascunhoJson = JSON.stringify({ ...rascunhoBase, tema, fontes, template, capaEscala });

  return (
    <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_0.82fr] lg:gap-7">
      <form action={salvarEstilo} className={`${CARD} flex flex-col overflow-hidden`}>
        <TopoCartao icone="bi-palette" chapeu="O visual do site" titulo="Estilo do convite" />

        <div className="flex flex-col gap-5 p-5 sm:p-6">
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="voltar" value={voltar} />
        <input type="hidden" name="tema" value={tema} />
        <input type="hidden" name="fontes" value={fontes} />
        <input type="hidden" name="template" value={template} />
        <input type="hidden" name="capaEscala" value={capaEscala} />

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
        <div className="flex flex-wrap items-center gap-3 rounded-[13px] border border-scv-line px-4 py-3.5">
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
                      ? "0 0 0 2px var(--scv-card), 0 0 0 4px #6D28D9"
                      : "0 0 0 1px rgba(0,0,0,0.12)",
                  }}
                />
              );
            })}
          </span>
        </div>

        {/* 3 · LETRAS (dupla de fontes) — seletor visual compartilhado. */}
        <div>
          <p className="mb-1 text-[12.5px] font-semibold text-scv-ink">Letras do convite</p>
          <p className="mb-3 text-[11.5px] text-scv-muted">
            Toque para ver o nome em cada estilo.
          </p>
          <SeletorFontes nome={nome} value={fontes} onChange={setFontes} />
        </div>

        {/* 4 · TAMANHO das letras (escala do lockup da capa) */}
        <div>
          <p className="mb-1 text-[12.5px] font-semibold text-scv-ink">Tamanho das letras</p>
          <p className="mb-3 text-[11.5px] text-scv-muted">
            Deixa o nome e a idade maiores ou menores na capa.
          </p>
          <div className="inline-flex gap-0.5 rounded-[11px] border border-scv-line bg-scv-soft p-[3px]">
            {TAMANHOS.map((l, i) => {
              const on = capaEscala === ESCALAS_CAPA[i];
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setCapaEscala(ESCALAS_CAPA[i])}
                  className={`cursor-pointer rounded-lg px-4 py-1.5 text-[12.5px] transition-colors ${
                    on
                      ? "bg-scv-card font-semibold text-scv-ink shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                      : "text-scv-muted hover:text-scv-ink"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        <button type="submit" className={`${BTN_PRIMARIO} mt-1 w-full`}>
          Salvar estilo
        </button>
        </div>
      </form>

      <div className="lg:sticky lg:top-[86px]">
        <PreviewSite rascunhoJson={rascunhoJson} pagina="inicio" host={host} />
      </div>
    </div>
  );
}
