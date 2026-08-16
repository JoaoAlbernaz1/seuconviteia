"use client";

// Preview AO VIVO das telas do painel — o SITE DE VERDADE (`/preview-evento`,
// mesmos componentes do site publicado) dentro de uma MOLDURA REALISTA de
// aparelho, com um seletor iPhone <-> Mac.
//
// - iPhone: bezel escuro, Dynamic Island, botoes laterais e barra de "home".
//   O site aparece em tela cheia (layout de CELULAR, viewport 390px).
// - Mac: MacBook (bezel + notch + base de aluminio) com uma janela do Safari
//   (bolinhas de transito + endereco). O site cai no layout de COMPUTADOR
//   (viewport 1280px) — o que o preview de celular nunca mostra.
//
// Tecnica:
// - `rascunhoJson` muda -> debounce -> iframe com DOUBLE-BUFFER (o novo carrega
//   invisivel e so aparece pronto; nunca pisca em branco).
// - O APARELHO INTEIRO (moldura + tela) e desenhado em px "de projeto" e
//   escalado por um unico `transform: scale(fit)` para caber na coluna, entao
//   as proporcoes ficam perfeitas em qualquer largura. Trocar de aparelho so
//   muda o tamanho do iframe (mesmo `src`): o conteudo reflui, sem recarregar.
//   As molduras vivem em `components/device-frame` (a previa do editor usa as
//   MESMAS); aqui a tela e o double-buffer.
import { useEffect, useRef, useState } from "react";
import { dimensoesDoAparelho, IphoneFrame, MacFrame, type Aparelho } from "@/components/device-frame/DeviceFrame";

/** Debounce simples de valor (nao recarrega o preview a cada tecla). */
export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** URL do iframe da prévia (rota /preview-evento) a partir de página, foco e rascunho. */
function montarSrc(pagina: string, foco: string | undefined, rascunho: string): string {
  return `/preview-evento?p=${pagina}${foco ? `&f=${foco}` : ""}&s=${encodeURIComponent(rascunho)}`;
}

/**
 * Tela com DOUBLE-BUFFER: dois iframes empilhados; quando o `src` muda, o novo
 * carrega no slot de tras (invisivel) e so vira frente quando termina. Assim a
 * previa nunca pisca em branco enquanto o profissional digita.
 * Preenche 100% do pai — quem define tamanho e cantos e a moldura.
 */
function ScreenBuffer({ src }: { src: string }) {
  const [front, setFront] = useState<"a" | "b">("a");
  const [srcA, setSrcA] = useState(src);
  const [srcB, setSrcB] = useState<string | null>(null);

  const frontSrc = front === "a" ? srcA : srcB;
  const backIs: "a" | "b" = front === "a" ? "b" : "a";
  const backSrc = backIs === "a" ? srcA : srcB;

  // Padrao "ajustar estado durante o render": o src desejado mudou -> carrega
  // no slot de tras (o da frente continua visivel ate o novo terminar).
  if (src !== frontSrc && src !== backSrc) {
    if (backIs === "a") setSrcA(src);
    else setSrcB(src);
  }

  function aoCarregarTras() {
    const atras = backIs === "a" ? srcA : srcB;
    if (atras === src) setFront(backIs);
  }

  return (
    <>
      {srcA ? (
        <iframe
          title="Prévia do site do evento"
          src={srcA}
          className={`absolute inset-0 size-full border-0 ${front === "a" ? "" : "invisible"}`}
          onLoad={front !== "a" ? aoCarregarTras : undefined}
        />
      ) : null}
      {srcB ? (
        <iframe
          title="Prévia do site do evento (carregando)"
          src={srcB}
          className={`absolute inset-0 size-full border-0 ${front === "b" ? "" : "invisible"}`}
          onLoad={front !== "b" ? aoCarregarTras : undefined}
        />
      ) : null}
    </>
  );
}

export function PreviewSite({
  rascunhoJson,
  estruturalJson,
  liveRsvpConfig,
  pagina = "inicio",
  foco,
  live,
  host,
  rotulo = "É assim que os convidados vão ver",
  altura = 600,
}: {
  /** JSON do rascunho (string) — vira `?s=` da rota /preview-evento. */
  rascunhoJson: string;
  /** Assinatura só do que EXIGE recarregar (toggles, cores, fotos, fontes,
   *  presentes, config do RSVP). Muda → recarrega. Se ausente, cai no
   *  comportamento antigo (recarrega a cada mudança do rascunho). */
  estruturalJson?: string;
  /** Config do formulário de confirmação enviada AO VIVO pro iframe (postMessage),
   *  pra as opções aparecerem/sumirem NA HORA, sem recarregar. `null` = RSVP off. */
  liveRsvpConfig?: unknown;
  /** Página do site no preview: inicio | evento | presentes | galeria. */
  pagina?: string;
  /** Seção em edição — a prévia rola até `[data-sec=foco]` e destaca (?f=). */
  foco?: string;
  /** Texto AO VIVO: mapa chave→valor aplicado direto no DOM do iframe a cada
   *  tecla (sem recarregar). As chaves batem com `[data-live="<chave>"]` no site. */
  live?: Record<string, string>;
  /** Endereço mostrado na barra do Mac (ex.: maria.seuconviteia.com). */
  host: string;
  rotulo?: string;
  /** Altura útil da tela do iPhone em px de viewport (escala junto). */
  altura?: number;
}) {
  // Recarregar o iframe SÓ quando muda algo ESTRUTURAL (toggles, cores, fotos,
  // fontes, lista de presentes, config do RSVP) ou a página/seção em foco. Os
  // TEXTOS refletem ao vivo pelo patch no DOM (abaixo), sem recarregar — então
  // digitar nome/mensagem/endereço/traje não faz a prévia "pular" nem re-rolar.
  // Ref com o rascunho MAIS novo (atualizado em effect, nunca no render) — o
  // reload lê daqui pra montar o `?s=` com o texto atual no momento em que ocorre.
  const rascunhoRef = useRef(rascunhoJson);
  useEffect(() => {
    rascunhoRef.current = rascunhoJson;
  }, [rascunhoJson]);
  const chaveReload = estruturalJson ?? rascunhoJson;
  const estavel = useDebounced(chaveReload, 300);
  const atualizando = estavel !== chaveReload;
  // `src` (e portanto o reload do iframe) só muda quando o ESTRUTURAL estabiliza,
  // a página ou o foco mudam — nunca por um texto. Textos vão pelo patch ao vivo.
  const [src, setSrc] = useState(() => montarSrc(pagina, foco, rascunhoJson));
  useEffect(() => {
    setSrc(montarSrc(pagina, foco, rascunhoRef.current));
  }, [estavel, pagina, foco]);
  const [device, setDevice] = useState<Aparelho>("iphone");

  // Largura da coluna -> fator de escala do aparelho inteiro.
  const areaRef = useRef<HTMLDivElement>(null);

  // ── ATUALIZAÇÃO AO VIVO (sem recarregar) ──────────────────────────────────
  // A prévia é mesma origem: a cada tecla, escrevemos o texto direto nos
  // elementos `[data-live=<chave>]` do(s) iframe(s). O recarregar debounced
  // (src) segue como rede de segurança p/ mudanças estruturais.
  const liveJson = JSON.stringify(live ?? {});
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const mapa = JSON.parse(liveJson) as Record<string, string>;
    // SÓ o iframe VISÍVEL (já carregado e hidratado). O buffer de trás está
    // carregando/hidratando; mexer nele daria "hydration mismatch". O de trás já
    // nasce com o texto certo (o `src` debounced carrega o rascunho atual).
    const ifr = area.querySelector<HTMLIFrameElement>("iframe:not(.invisible)");
    let doc: Document | null = null;
    try {
      doc = ifr?.contentDocument ?? null;
    } catch {
      doc = null; // cross-origin (não ocorre no mesmo domínio)
    }
    if (!doc) return;
    for (const [chave, valor] of Object.entries(mapa)) {
      doc.querySelectorAll<HTMLElement>(`[data-live="${chave}"]`).forEach((el) => {
        if (el.hasAttribute("data-live-multi")) {
          // texto multi-parágrafo: reconstrói os <p> por bloco (\n\n).
          const cls = el.getAttribute("data-live-class") || "";
          const blocos = valor.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
          const atual = Array.from(el.children).map((c) => c.textContent).join("\n\n");
          if (atual !== blocos.join("\n\n")) {
            el.textContent = "";
            for (const t of blocos) {
              const p = doc!.createElement("p");
              if (cls) p.className = cls;
              p.textContent = t;
              el.appendChild(p);
            }
          }
        } else if (el.textContent !== valor) {
          el.textContent = valor;
        }
      });
    }
  }, [liveJson]);

  // ── CONFIG DO RSVP AO VIVO (sem recarregar) ───────────────────────────────
  // As opções do formulário de confirmação (acompanhantes, telefone, e-mail,
  // restrição, recado, cor, data-limite) vão pro iframe por postMessage. O
  // RsvpConvite (em modo preview) escuta e re-renderiza NA HORA — sem reload.
  const rsvpConfigJson = JSON.stringify(liveRsvpConfig ?? null);
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const ifr = area.querySelector<HTMLIFrameElement>("iframe:not(.invisible)");
    try {
      ifr?.contentWindow?.postMessage(
        { __scPreview: true, rsvpConfig: JSON.parse(rsvpConfigJson) },
        window.location.origin,
      );
    } catch {
      /* iframe ainda não pronto — o `?s=` do reload já traz a config certa */
    }
  }, [rsvpConfigJson]);

  const [colW, setColW] = useState(0);
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setColW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Dimensões "de projeto" do aparelho escolhido (mesmas contas dos frames).
  // `altura` é o ORÇAMENTO de altura da prévia — o aparelho escala pra caber
  // nela E na largura da coluna, mantendo a proporção real (o iPhone fica alto
  // e fino, nunca "gordo pros lados").
  const { largura: deviceW, altura: deviceH } = dimensoesDoAparelho(device);
  // O CELULAR tem orçamento de altura PRÓPRIO (não cresce junto com o Mac): fica
  // no tamanho aprovado, alinhado ao topo. Só o Mac usa a `altura` cheia — assim
  // dá pra deixar o Mac grande e centralizado sem mexer no celular.
  const isMac = device === "mac";
  const budgetH = isMac ? altura : Math.min(altura, 560);
  const fit =
    colW > 0
      ? Math.min(1, colW / deviceW, budgetH / deviceH)
      : Math.min(1, budgetH / deviceH);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-scv-muted">
          <span
            className={`size-[7px] rounded-full ${
              atualizando
                ? "animate-pulse bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.2)]"
                : "bg-teal shadow-[0_0_0_3px_rgba(14,165,166,0.16)]"
            }`}
            aria-hidden
          />
          <span className="truncate">{atualizando ? "Atualizando…" : rotulo}</span>
        </div>
        {/* seletor Celular / Computador */}
        <div
          role="group"
          aria-label="Ver como celular ou computador"
          className="flex shrink-0 rounded-full bg-scv-soft p-0.5 text-xs font-semibold shadow-[inset_0_0_0_1px_var(--scv-line)]"
        >
          {(
            [
              ["iphone", "Celular"],
              ["mac", "Computador"],
            ] as const
          ).map(([val, label]) => {
            const on = device === val;
            return (
              <button
                key={val}
                type="button"
                aria-pressed={on}
                onClick={() => setDevice(val)}
                className={`rounded-full px-3 py-1 transition-colors ${
                  on
                    ? "bg-scv-card text-scv-ink shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                    : "text-scv-muted hover:text-scv-ink"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={areaRef}
        className={`flex w-full justify-center ${isMac ? "items-center" : ""}`}
        style={isMac ? { minHeight: altura } : undefined}
      >
        <div style={{ width: deviceW * fit, height: deviceH * fit }}>
          <div
            style={{
              width: deviceW,
              height: deviceH,
              transform: `scale(${fit})`,
              transformOrigin: "top left",
            }}
          >
            {device === "iphone" ? (
              <IphoneFrame>
                <ScreenBuffer src={src} />
              </IphoneFrame>
            ) : (
              <MacFrame host={host}>
                <ScreenBuffer src={src} />
              </MacFrame>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
