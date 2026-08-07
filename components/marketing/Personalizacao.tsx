"use client";

import { useState, type CSSProperties } from "react";

/**
 * Personalização — versão ENXUTA (o João achou a anterior "bagunçada e com
 * informação demais"). Guiado pela skill ui-ux-pro-max, padrão "Product Demo":
 * um mockup no centro da atenção, poucos controles e estado ativo evidente.
 *
 * Ficaram só DUAS escolhas (ocasião e cor) e UMA frase; a prévia mostra o
 * resto — os blocos de cada ocasião aparecem nela em vez de virarem mais
 * caixinhas de texto. Saíram: o card de 8 chips, dois títulos internos, três
 * parágrafos e os quatro cards de nicho (viraram as abas).
 */

const OCASIOES = [
  {
    id: "15anos",
    aba: "15 anos",
    kicker: "15 anos",
    nome: "Helena",
    data: "21 · 11 · 2026",
    url: "helena.seuconvite.com",
    frase: "Contagem regressiva em destaque e confirmação pelo WhatsApp.",
    blocos: ["Contagem regressiva", "RSVP", "Playlist", "Galeria"],
  },
  {
    id: "casamento",
    aba: "Casamento",
    kicker: "Casamento",
    nome: "Ana & João",
    data: "09 · 05 · 2026",
    url: "anaejoao.seuconvite.com",
    frase: "Lista de presentes com Pix, recados e detalhes da cerimônia.",
    blocos: ["RSVP", "Lista de presentes", "Mapa e rota", "Recados"],
  },
  {
    id: "aniversario",
    aba: "Aniversário",
    kicker: "40 anos",
    nome: "Bruno",
    data: "02 · 08 · 2026",
    url: "bruno40.seuconvite.com",
    frase: "Galeria, playlist colaborativa e dress code em um só lugar.",
    blocos: ["Galeria", "Playlist", "Dress code", "RSVP"],
  },
  {
    id: "corporativo",
    aba: "Corporativo",
    kicker: "Encontro anual",
    nome: "Orivya 2026",
    data: "14 · 10 · 2026",
    url: "orivya2026.seuconvite.com",
    frase: "Agenda, lista de participantes e credenciamento por QR Code.",
    blocos: ["Agenda", "Credenciamento", "Mapa e rota", "Participantes"],
  },
] as const;

const CORES = [
  { id: "roxo", nome: "Roxo", acc: "#8B5CF6", deep: "#1F1F23", grad: "linear-gradient(160deg,#1F1F23,#4C1D95)" },
  { id: "neon", nome: "Neon", acc: "#FF2D8D", deep: "#2A0F2A", grad: "linear-gradient(160deg,#2A0F2A,#FF2D8D)" },
  { id: "grafite", nome: "Grafite", acc: "#9AA0AE", deep: "#141416", grad: "linear-gradient(160deg,#141416,#2B2B33)" },
  { id: "azul", nome: "Azul", acc: "#3B82F6", deep: "#0F1420", grad: "linear-gradient(160deg,#0F1420,#1E3A8A)" },
  { id: "ambar", nome: "Âmbar", acc: "#F59E0B", deep: "#1A1206", grad: "linear-gradient(160deg,#1A1206,#B45309)" },
] as const;

export function Personalizacao() {
  const [oc, setOc] = useState(0);
  const [cor, setCor] = useState(0);

  const o = OCASIOES[oc];
  const c = CORES[cor];
  const estilo = { "--demo-acc": c.acc, "--demo-deep": c.deep } as CSSProperties;

  return (
    <div className="demo" style={estilo}>
      {/* ── controles: duas escolhas, só isso ─────────────────── */}
      <div className="demo-ctrl" data-rv="left">
        <span className="demo-rot">Ocasião</span>
        <div className="abas" role="tablist" aria-label="Ocasião do evento">
          {OCASIOES.map((x, i) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={i === oc}
              className={i === oc ? "aba on" : "aba"}
              onClick={() => setOc(i)}
            >
              {x.aba}
            </button>
          ))}
        </div>

        <p key={o.id} className="demo-frase">{o.frase}</p>

        <span className="demo-rot" style={{ marginTop: 34 }}>Cor</span>
        <div className="cores" role="group" aria-label="Paleta de cores">
          {CORES.map((x, i) => (
            <button
              key={x.id}
              type="button"
              className={i === cor ? "cor on" : "cor"}
              style={{ background: x.grad }}
              aria-pressed={i === cor}
              aria-label={`Cor ${x.nome}`}
              onClick={() => setCor(i)}
            />
          ))}
        </div>
      </div>

      {/* ── prévia: o resto da informação mora aqui ───────────── */}
      <div className="demo-preview" data-rv="right">
        <div className="pv">
          <div className="pv-glow" aria-hidden />
          <div key={o.id} className="pv-in">
            <span className="pv-kicker">{o.kicker}</span>
            <span className="pv-nome">{o.nome}</span>
            <span className="pv-data">{o.data}</span>

            <div className="pv-pills" aria-hidden>
              {o.blocos.map((b) => (
                <span key={b} className="pv-pill">{b}</span>
              ))}
            </div>

            <div className="pv-cta" aria-hidden>Confirmar presença</div>
            <div className="pv-url" aria-hidden>{o.url}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
