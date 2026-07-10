"use client";

// Assistente de criação (mockup DARK) — passos 1–3 no cliente:
//   1 Ocasião · 2 Estilo (combinações curadas de paleta+letras) · 3 Detalhes
// "Continuar" no passo 3 chama a server action `criarRascunho`, que grava o
// evento como RASCUNHO e leva ao passo 4 (/painel/<id>/publicar).
// O preview do passo 3 é o SITE DE VERDADE (/preview-evento) na moldura.
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { criarRascunho, type AcaoEventoState } from "../acoes";
import { TEMAS } from "@/lib/temas";
import { textosDoNicho } from "@/lib/textos";
import { slugify } from "@/lib/tenant";
import { TIPO_ICON, TIPO_LABEL } from "@/lib/painelUi";
import { templatesPorOcasiao, ocasiaoDoNicho, type TemplateDefinition } from "@/lib/templates";
import { capaDemo } from "@/lib/demoFotos";
import { EXEMPLO_NOME, NOME_LABEL } from "../_ui/estilosDoSite";
import { CardTemplate } from "../_ui/CardTemplate";
import { PreviewSite } from "../_ui/PreviewSite";
import { Stepper, type PassoStepper } from "../_ui/Stepper";
import {
  BTN_GHOST,
  BTN_PRIMARIO,
  BTN_VOLTAR,
  CARD,
  COLUNA,
  INPUT,
  LABEL,
} from "../_ui/estilos";

const OCASIOES = [
  "CASAMENTO",
  "QUINZE_ANOS",
  "ANIVERSARIO",
] as const;

export function Wizard({ rootDomain }: { rootDomain: string }) {
  const router = useRouter();
  const [passo, setPasso] = useState<1 | 2 | 3>(1);
  const [tipo, setTipo] = useState("");
  const [template, setTemplate] = useState<string | null>(null);
  const [tema, setTema] = useState("rose");
  const [fontes, setFontes] = useState("classica");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("20:00");
  const [local, setLocal] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTocado, setSlugTocado] = useState(false);

  const [state, formAction, pending] = useActionState<AcaoEventoState, FormData>(
    criarRascunho,
    {},
  );

  const exemplo = EXEMPLO_NOME[tipo] ?? "Maria Clara";
  const slugFinal = slugTocado && slug ? slugify(slug) : slugify(title) || "sua-festa";
  const hostRaiz = rootDomain.replace(/:\d+$/, "");

  function escolherOcasiao(t: string) {
    setTipo(t);
    setTemplate(null); // limpa o template (os templates mudam por ocasião)
    setMensagem(textosDoNicho(t).mensagemPadrao);
    setPasso(2);
  }
  function escolherTemplate(tpl: TemplateDefinition) {
    setTemplate(tpl.id);
    setTema(tpl.paletaPadrao);
    setFontes(tpl.fontesPadrao);
  }

  const passos: PassoStepper[] = [
    { label: "Ocasião", estado: passo > 1 ? "feito" : "atual", onClick: () => setPasso(1) },
    {
      label: "Estilo",
      estado: passo > 2 ? "feito" : passo === 2 ? "atual" : "pendente",
      onClick: () => setPasso(2),
    },
    { label: "Detalhes", estado: passo === 3 ? "atual" : "pendente" },
    { label: "Publicar", estado: "pendente" },
  ];

  const rascunhoJson = JSON.stringify({
    type: tipo || "QUINZE_ANOS",
    tema,
    fontes,
    template: template ?? undefined,
    title: title.trim() || exemplo,
    date,
    time,
    mensagem,
    local,
  });

  return (
    <div className={`${COLUNA} py-8 pb-20`}>
      {/* stepper */}
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={() => (passo > 1 ? setPasso((p) => (p - 1) as 1 | 2) : router.push("/painel"))}
          aria-label="Voltar"
          className={BTN_VOLTAR}
        >
          <i className="bi bi-chevron-left" aria-hidden />
        </button>
        <Stepper passos={passos} />
        <span className="w-9 shrink-0" aria-hidden />
      </div>

      {/* PASSO 1 · OCASIÃO */}
      {passo === 1 ? (
        <div className="scv-fade mt-11 text-center">
          <h1 className="font-display text-[32px] font-semibold tracking-tight text-scv-ink">
            Qual é a ocasião?
          </h1>
          <p className="mt-2.5 text-[15px] text-scv-muted">
            Isso define os textos e os estilos que vamos sugerir.
          </p>
          <div className="mx-auto mt-9 flex max-w-[820px] flex-wrap justify-center gap-4">
            {OCASIOES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => escolherOcasiao(t)}
                className="flex w-[150px] flex-col items-center gap-3 rounded-[18px] border border-scv-line bg-scv-card px-3.5 pb-5 pt-6 shadow-[0_10px_30px_-26px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:border-violeta hover:shadow-[0_18px_36px_-22px_rgba(122,64,237,0.45)]"
              >
                <span className="grid size-[50px] place-items-center rounded-[14px] bg-scv-lilac text-scv-violet">
                  <i className={`bi ${TIPO_ICON[t]} text-xl`} aria-hidden />
                </span>
                <span className="text-[14.5px] font-semibold text-scv-ink">
                  {TIPO_LABEL[t]}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* PASSO 2 · MODELO (template) */}
      {passo === 2 ? (
        <div className="scv-fade mt-10">
          <div className="text-center">
            <h1 className="font-display text-[32px] font-semibold tracking-tight text-scv-ink">
              Escolha o modelo
            </h1>
            <p className="mt-2.5 text-[15px] text-scv-muted">
              Cada modelo é um site diferente. A cor e as letras você ajusta depois —
              e pode trocar tudo quando quiser.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templatesPorOcasiao(tipo).map((tpl) => (
              <CardTemplate
                key={tpl.id}
                tpl={tpl}
                nome={title.trim() || exemplo}
                fotoUrl={capaDemo(ocasiaoDoNicho(tipo))}
                altura={150}
                selecionado={template === tpl.id}
                onSelect={() => escolherTemplate(tpl)}
              />
            ))}
          </div>
          <div className="mt-8 flex justify-center gap-2.5">
            <button type="button" onClick={() => setPasso(1)} className={BTN_GHOST}>
              ← Voltar
            </button>
            <button
              type="button"
              disabled={!template}
              onClick={() => setPasso(3)}
              className={`${BTN_PRIMARIO} px-11`}
            >
              Continuar
            </button>
          </div>
        </div>
      ) : null}

      {/* PASSO 3 · DETALHES */}
      {passo === 3 ? (
        <div className="scv-fade mt-10">
          <div className="text-center">
            <h1 className="font-display text-[32px] font-semibold tracking-tight text-scv-ink">
              Conte os detalhes
            </h1>
            <p className="mt-2.5 text-[15px] text-scv-muted">
              A mensagem já vem pronta pra ocasião — é só ajustar. Veja o site{" "}
              <span className="lg:hidden">logo abaixo</span>
              <span className="hidden lg:inline">ao lado</span>.
            </p>
          </div>

          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <form action={formAction} className={`${CARD} flex flex-col gap-4 p-6 sm:p-7`}>
              <input type="hidden" name="type" value={tipo} />
              <input type="hidden" name="tema" value={tema} />
              <input type="hidden" name="fontes" value={fontes} />
              <input type="hidden" name="template" value={template ?? ""} />
              <input type="hidden" name="slug" value={slugFinal} />

              <label className="block">
                <span className={LABEL}>{NOME_LABEL[tipo] ?? "Nome do evento"}</span>
                <input
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Ex.: ${exemplo}`}
                  className={INPUT}
                />
                {state.fieldErrors?.title ? (
                  <span className="mt-1 block text-xs text-red-600">
                    {state.fieldErrors.title}
                  </span>
                ) : null}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={LABEL}>Data da festa</span>
                  <input
                    name="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={INPUT}
                  />
                  {state.fieldErrors?.date ? (
                    <span className="mt-1 block text-xs text-red-600">
                      {state.fieldErrors.date}
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className={LABEL}>Horário</span>
                  <input
                    name="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={INPUT}
                  />
                </label>
              </div>

              <label className="block">
                <span className={LABEL}>Local</span>
                <input
                  name="local"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  placeholder="Ex.: Buffet Jardim das Flores"
                  className={INPUT}
                />
              </label>

              <label className="block">
                <span className={LABEL}>Mensagem de boas-vindas</span>
                <textarea
                  name="mensagem"
                  rows={3}
                  maxLength={2000}
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  className={`${INPUT} resize-y leading-relaxed`}
                />
                <span className="mt-1.5 block text-xs text-scv-faint">
                  Dica: fale como você falaria com os convidados.
                </span>
              </label>

              <label className="block">
                <span className={LABEL}>Endereço do site</span>
                <div className="flex items-center overflow-hidden rounded-[11px] border border-scv-line bg-scv-field focus-within:border-violeta focus-within:ring-2 focus-within:ring-violeta/15">
                  <input
                    value={slugTocado ? slug : slugFinal}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugTocado(true);
                    }}
                    aria-label="Endereço do site"
                    className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-[14.5px] text-scv-ink outline-none"
                  />
                  <span className="whitespace-nowrap px-3.5 text-[13px] text-scv-faint">
                    .{hostRaiz}
                  </span>
                </div>
                <span className="mt-1.5 block text-xs text-scv-faint">
                  Se já estiver em uso, ajustamos com um número no final.
                </span>
              </label>

              {state.error ? (
                <p role="alert" className="text-sm text-red-600">
                  {state.error}
                </p>
              ) : null}

              <div className="mt-1 flex gap-2.5">
                <button type="button" onClick={() => setPasso(2)} className={BTN_GHOST}>
                  ← Voltar
                </button>
                <button
                  type="submit"
                  disabled={pending || !title.trim() || !date}
                  className={`${BTN_PRIMARIO} flex-1`}
                >
                  {pending ? "Salvando…" : "Continuar"}
                </button>
              </div>
              {!pending && (!title.trim() || !date) ? (
                <p className="text-center text-xs text-scv-faint">
                  Pra continuar, preencha{" "}
                  {!title.trim() && !date
                    ? "o nome e a data da festa"
                    : !title.trim()
                      ? "o nome"
                      : "a data da festa"}
                  .
                </p>
              ) : null}
            </form>

            <div className="lg:sticky lg:top-[86px]">
              <div className={`${CARD} mb-3 flex flex-wrap items-center gap-3 px-4 py-3`}>
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
                            ? "0 0 0 2px var(--scv-card), 0 0 0 4px #7A40ED"
                            : "0 0 0 1px rgba(0,0,0,0.12)",
                        }}
                      />
                    );
                  })}
                </span>
              </div>
              <PreviewSite
                rascunhoJson={rascunhoJson}
                host={`${slugFinal}.${hostRaiz}`}
                altura={560}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
