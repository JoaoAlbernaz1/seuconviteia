"use client";

// Formulário "Fotos do site" com prévia AO VIVO. Cada card cuida de um pedaço
// (capa · álbum · foto da lista de presentes); o upload usa a mecânica provada
// (`useEnvio` -> POST /api/upload) e o estado alimenta tanto os hidden inputs
// que a server action `salvarFotos` grava quanto o JSON do preview do site.
import Link from "next/link";
import Image from "next/image";
import { useActionState, useState } from "react";
import { salvarFotos, type AcaoEventoState } from "../../acoes";
import type { RascunhoPreview } from "@/lib/previewEvento";
import { TEMAS } from "@/lib/temas";
import { PreviewSite } from "../../_ui/PreviewSite";
import {
  EscolherFoto,
  FotoComRemover,
  useEnvio,
} from "../../_ui/Uploads";
import {
  BTN_CARD,
  BTN_PRIMARIO,
  BTN_VOLTAR,
  CARD,
  COLUNA,
  SUB,
  TITULO,
} from "../../_ui/estilos";

/** Placeholder gradiente da paleta do evento (espelha `_ui/CapaEvento.tsx`). */
function fundoDoTema(tema: string): React.CSSProperties {
  const v = (TEMAS[tema] ?? TEMAS.rose).vars;
  return {
    backgroundImage: `radial-gradient(120% 90% at 50% 0%, ${v["--ev-rosa"]}59, transparent 62%), linear-gradient(180deg, ${v["--ev-ink"]}, ${v["--ev-framboesa-deep"]})`,
  };
}

const BTN_VIOLETA =
  "inline-flex items-center gap-2 rounded-[10px] bg-violeta px-4 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110";

export function FotosCliente({
  eventId,
  voltar,
  host,
  tema,
  rascunhoBase,
  fotoUrlInicial,
  presentesFotoUrlInicial,
  fotosIniciais,
}: {
  eventId: string;
  voltar: string;
  host: string;
  tema: string;
  rascunhoBase: RascunhoPreview;
  fotoUrlInicial: string;
  presentesFotoUrlInicial: string;
  fotosIniciais: string[];
}) {
  const [fotoUrl, setFotoUrl] = useState(fotoUrlInicial);
  const [presentesFotoUrl, setPresentesFotoUrl] = useState(presentesFotoUrlInicial);
  const [fotos, setFotos] = useState<string[]>(fotosIniciais);

  const [state, formAction, pending] = useActionState<AcaoEventoState, FormData>(
    salvarFotos,
    {},
  );
  const { enviando, erro, enviarUma, enviarVarias } = useEnvio();

  const rascunhoJson = JSON.stringify({
    ...rascunhoBase,
    fotoUrl: fotoUrl || undefined,
    presentesFotoUrl: presentesFotoUrl || undefined,
    fotos,
  });

  return (
    <div className={`${COLUNA} scv-fade py-9 pb-20`}>
      <div className="flex items-center gap-3.5">
        <Link href={voltar} aria-label="Voltar" className={BTN_VOLTAR}>
          <i className="bi bi-chevron-left" aria-hidden />
        </Link>
        <div>
          <h1 className={TITULO}>Fotos do site</h1>
          <p className={`mt-1 ${SUB}`}>
            Uma foto boa muda tudo. Pode trocar quando quiser.
          </p>
        </div>
      </div>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_0.82fr] lg:gap-7">
        <form action={formAction} className={`${CARD} flex flex-col overflow-hidden`}>
          <div className="relative p-4">
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg,#6D28D9 0%,#9B4DCA 46%,#E27D96 100%)" }}
            />
            <i className="bi bi-camera absolute right-4 top-3.5 text-[20px] text-white/35" aria-hidden />
            <div className="relative">
              <div className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-white/70">
                As fotos do convite
              </div>
              <div className="mt-1 font-display text-[19px] font-semibold leading-tight text-white">
                Fotos do site
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-5 sm:p-6">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="voltar" value={voltar} />
          <input type="hidden" name="fotoUrl" value={fotoUrl} />
          <input type="hidden" name="presentesFotoUrl" value={presentesFotoUrl} />
          {fotos.map((u) => (
            <input key={u} type="hidden" name="fotos" value={u} />
          ))}

          {/* a. Foto de capa */}
          <div className="rounded-[13px] border border-scv-line p-4 sm:p-5">
            <h2 className="text-[15px] font-semibold text-scv-ink">Foto de capa</h2>
            <p className="mt-0.5 text-[12.5px] text-scv-muted">
              É o fundo da primeira tela do site.
            </p>
            <div className="mt-4 flex items-start gap-4">
              <div
                className="relative h-[200px] w-[150px] shrink-0 overflow-hidden rounded-[14px] ring-1 ring-scv-line"
                style={fotoUrl ? undefined : fundoDoTema(tema)}
              >
                {fotoUrl ? (
                  <Image
                    src={fotoUrl}
                    alt="Foto de capa"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1.5 text-white/85">
                    <i className="bi bi-image text-2xl" aria-hidden />
                    <span className="text-[12px] font-medium">Sua foto aqui</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-start gap-2 pt-1">
                <EscolherFoto
                  enviando={enviando}
                  onFile={(files) => enviarUma(files[0], setFotoUrl)}
                  className={BTN_VIOLETA}
                >
                  <i className="bi bi-upload" aria-hidden />
                  {enviando ? "Enviando…" : fotoUrl ? "Trocar foto" : "Enviar foto"}
                </EscolherFoto>
                <p className="text-[12px] leading-relaxed text-scv-faint">
                  Melhor em pé (retrato), como as do celular.
                </p>
                {fotoUrl ? (
                  <button
                    type="button"
                    onClick={() => setFotoUrl("")}
                    className="text-[12.5px] font-medium text-scv-faint transition hover:text-red-600"
                  >
                    Remover
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* b. Álbum */}
          <div className="rounded-[13px] border border-scv-line p-4 sm:p-5">
            <h2 className="text-[15px] font-semibold text-scv-ink">Álbum</h2>
            <p className="mt-0.5 text-[12.5px] text-scv-muted">
              A galeria do site. Pode enviar várias de uma vez.
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2.5">
              {fotos.map((u) => (
                <FotoComRemover
                  key={u}
                  url={u}
                  alt="Foto do álbum"
                  onRemove={() => setFotos((xs) => xs.filter((x) => x !== u))}
                />
              ))}
              <EscolherFoto
                multiple
                enviando={enviando}
                onFile={(files) =>
                  enviarVarias(files, (url) =>
                    setFotos((xs) => (xs.includes(url) ? xs : [...xs, url])),
                  )
                }
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-scv-dash text-scv-faint transition hover:border-violeta hover:text-scv-violet"
              >
                <i className="bi bi-plus-lg text-lg" aria-hidden />
                <span className="text-[11px] font-medium">Adicionar</span>
              </EscolherFoto>
            </div>
          </div>

          {/* c. Foto da lista de presentes */}
          <div className="rounded-[13px] border border-scv-line p-4 sm:p-5">
            <h2 className="text-[15px] font-semibold text-scv-ink">
              Foto da lista de presentes
            </h2>
            <p className="mt-0.5 text-[12.5px] text-scv-muted">
              Aparece ao lado da lista. Uma foto sorrindo funciona super bem.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div
                className="relative size-[76px] shrink-0 overflow-hidden rounded-full ring-1 ring-scv-line"
                style={presentesFotoUrl ? undefined : fundoDoTema(tema)}
              >
                {presentesFotoUrl ? (
                  <Image
                    src={presentesFotoUrl}
                    alt="Foto da lista de presentes"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/85">
                    <i className="bi bi-image text-lg" aria-hidden />
                  </div>
                )}
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <EscolherFoto
                  enviando={enviando}
                  onFile={(files) => enviarUma(files[0], setPresentesFotoUrl)}
                  className={BTN_CARD}
                >
                  {enviando
                    ? "Enviando…"
                    : presentesFotoUrl
                      ? "Trocar foto"
                      : "Escolher foto"}
                </EscolherFoto>
                {presentesFotoUrl ? (
                  <button
                    type="button"
                    onClick={() => setPresentesFotoUrl("")}
                    className="text-[12.5px] font-medium text-scv-faint transition hover:text-red-600"
                  >
                    Remover
                  </button>
                ) : (
                  <span className="text-[12px] text-scv-faint">
                    Se vazia, usa a capa.
                  </span>
                )}
              </div>
            </div>
          </div>

          {erro ? (
            <p role="alert" className="text-sm text-red-600">
              {erro}
            </p>
          ) : null}
          {state.error ? (
            <p role="alert" className="text-sm text-red-600">
              {state.error}
            </p>
          ) : null}

          <div className="mt-1 flex items-center justify-end gap-3 border-t border-scv-line pt-4">
            <Link href={voltar} className="text-[13.5px] font-semibold text-scv-muted transition hover:text-scv-ink">
              Cancelar
            </Link>
            <button type="submit" disabled={pending} className={BTN_PRIMARIO}>
              {pending ? "Salvando…" : "Salvar fotos"}
            </button>
          </div>
          </div>
        </form>

        <div className="lg:sticky lg:top-[86px]">
          <PreviewSite
            rascunhoJson={rascunhoJson}
            pagina="inicio"
            host={host}
            rotulo="A foto entra aqui"
          />
        </div>
      </div>
    </div>
  );
}
