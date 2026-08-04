"use client";
// Modal de "presentear" — fluxo Pix via plataforma (hoje simulado).
// Passos: 1) valor/cota + nome + recado + consentimento -> 2) Pix (QR + copia e
// cola) -> 3) obrigada. Chama as server actions `iniciarPresente`/`confirmarPresente`.
// Tokens --ev-*/font-evt-*; respeita reduced-motion; acessível (dialog + ESC).
import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import type { PresenteInterativo } from "@/lib/presentesTipos";
import { iniciarPresente, confirmarPresente, checarPagamento } from "@/lib/presentear";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmt = (cents: number) => brl.format(cents / 100);

type Etapa = "form" | "pix" | "ok";

export function PresentearModal({
  item,
  eventId,
  simulado,
  onClose,
}: {
  item: PresenteInterativo;
  eventId: string;
  /** true = provedor simulado (dev): confirmação manual. false = Pix real: aguarda o webhook. */
  simulado: boolean;
  onClose: () => void;
}) {
  const cotaCents =
    item.pricingMode === "COTAS" && item.quotaCount
      ? Math.round(item.priceCents / item.quotaCount)
      : 0;
  const cotasRestantes =
    item.pricingMode === "COTAS" && item.quotaCount
      ? Math.max(0, item.quotaCount - item.cotasVendidas)
      : 0;

  const [etapa, setEtapa] = useState<Etapa>("form");
  const [quotas, setQuotas] = useState(1);
  const [valorReais, setValorReais] = useState("");
  const [nome, setNome] = useState("");
  const [recado, setRecado] = useState("");
  const [consent, setConsent] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pix, setPix] = useState<{ code: string; qr: string; contributionId: string; bruto: number } | null>(null);
  const [enviando, startEnviar] = useTransition();
  const [confirmando, startConfirmar] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const brutoPrevisto =
    item.pricingMode === "FIXO"
      ? item.priceCents
      : item.pricingMode === "COTAS"
        ? cotaCents * quotas
        : Math.round((parseFloat(valorReais.replace(",", ".")) || 0) * 100);

  function gerarPix() {
    setErro(null);
    if (nome.trim().length < 2) return setErro("Informe seu nome.");
    if (!consent) return setErro("É preciso aceitar o compartilhamento dos dados.");
    if (item.pricingMode === "LIVRE" && brutoPrevisto < item.priceCents) {
      return setErro(`O valor mínimo é ${fmt(item.priceCents)}.`);
    }
    if (item.pricingMode === "COTAS" && (quotas < 1 || quotas > cotasRestantes)) {
      return setErro("Escolha uma quantidade de cotas válida.");
    }
    startEnviar(async () => {
      const r = await iniciarPresente({
        eventId,
        giftItemId: item.id,
        buyerName: nome.trim(),
        message: recado.trim() || undefined,
        quotas: item.pricingMode === "COTAS" ? quotas : undefined,
        valorCustomCents: item.pricingMode === "LIVRE" ? brutoPrevisto : undefined,
        consentimento: true,
      });
      if (!r.ok) return setErro(r.erro);
      setPix({ code: r.pixCode, qr: r.pixQrUrl, contributionId: r.contributionId, bruto: r.brutoCents });
      setEtapa("pix");
    });
  }

  // Modo simulado (dev): confirma na mão.
  function confirmarSimulado() {
    if (!pix) return;
    startConfirmar(async () => {
      const r = await confirmarPresente(pix.contributionId);
      if (r.ok) setEtapa("ok");
      else setErro("Não conseguimos confirmar. Tente de novo.");
    });
  }

  // Pix real: consulta o status agora ("Já paguei"). O webhook confirma sozinho.
  function verificarAgora() {
    if (!pix) return;
    setErro(null);
    startConfirmar(async () => {
      const r = await checarPagamento(pix.contributionId);
      if (r.status === "PAID") setEtapa("ok");
      else if (r.status === "FAILED") setErro("O pagamento não foi identificado. Tente de novo.");
      else setErro("Ainda não identificamos seu Pix. Assim que cair, esta tela confirma sozinha.");
    });
  }

  // Pix real: enquanto o QR está na tela, consulta o status a cada 4s até cair.
  useEffect(() => {
    if (etapa !== "pix" || simulado || !pix) return;
    const t = setInterval(async () => {
      const r = await checarPagamento(pix.contributionId);
      if (r.status === "PAID") setEtapa("ok");
    }, 4000);
    return () => clearInterval(t);
  }, [etapa, simulado, pix]);

  async function copiar() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.code);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      /* clipboard indisponível */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Presentear: ${item.titulo}`}
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-[460px] overflow-y-auto rounded-t-[24px] bg-white p-6 shadow-[0_28px_60px_-24px_rgba(46,26,32,0.5)] sm:rounded-[24px] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-evt-ink-soft transition-colors hover:bg-black/5"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* ── Passo 1: form ── */}
        {etapa === "form" && (
          <div>
            <p className="eyebrow text-evt-rosa-ink">Presentear</p>
            <h3 className="mt-1 font-evt-display text-[clamp(1.6rem,6vw,2rem)] leading-tight text-evt-ink">
              {item.titulo}
            </h3>

            {item.pricingMode === "FIXO" && (
              <p className="mt-2 font-evt-display text-[1.5rem] text-evt-ink">{fmt(item.priceCents)}</p>
            )}

            {item.pricingMode === "COTAS" && (
              <div className="mt-4">
                <p className="font-evt-body text-[1rem] text-evt-ink-soft">
                  {fmt(cotaCents)} por cota · {cotasRestantes} de {item.quotaCount} disponíveis
                </p>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex items-center rounded-full border border-[var(--line)]">
                    <button type="button" onClick={() => setQuotas((q) => Math.max(1, q - 1))} className="h-11 w-11 text-evt-ink" aria-label="Menos uma cota">−</button>
                    <span className="min-w-[2.5rem] text-center font-evt-display text-[1.2rem] text-evt-ink">{quotas}</span>
                    <button type="button" onClick={() => setQuotas((q) => Math.min(cotasRestantes, q + 1))} className="h-11 w-11 text-evt-ink" aria-label="Mais uma cota">+</button>
                  </div>
                  <span className="font-evt-display text-[1.3rem] text-evt-ink">{fmt(brutoPrevisto)}</span>
                </div>
              </div>
            )}

            {item.pricingMode === "LIVRE" && (
              <div className="mt-4">
                <label className="block font-evt-util text-[0.7rem] uppercase tracking-[0.18em] text-evt-rosa-ink">
                  Valor (mínimo {fmt(item.priceCents)})
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorReais}
                  onChange={(e) => setValorReais(e.target.value)}
                  placeholder="0,00"
                  className="mt-1 w-full rounded-[12px] border border-[var(--line)] bg-ivory/97 px-4 py-3 font-evt-body text-[1.15rem] text-evt-ink outline-none focus:border-evt-rosa-ink"
                />
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3">
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                className="w-full rounded-[12px] border border-[var(--line)] bg-ivory/97 px-4 py-3 font-evt-body text-[1.05rem] text-evt-ink outline-none focus:border-evt-rosa-ink"
              />
              <textarea
                value={recado}
                onChange={(e) => setRecado(e.target.value)}
                placeholder="Deixe um recado (opcional)"
                rows={2}
                className="w-full resize-none rounded-[12px] border border-[var(--line)] bg-ivory/97 px-4 py-3 font-evt-body text-[1.05rem] text-evt-ink outline-none focus:border-evt-rosa-ink"
              />
              <label className="flex items-start gap-2 font-evt-body text-[0.9rem] text-evt-ink-soft">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
                <span>Aceito compartilhar meu nome e recado com quem vai receber o presente.</span>
              </label>
            </div>

            {erro && <p className="mt-3 font-evt-body text-[0.95rem] text-red-600">{erro}</p>}

            <button
              type="button"
              onClick={gerarPix}
              disabled={enviando}
              className="mt-5 w-full rounded-full bg-evt-framboesa px-6 py-3.5 font-evt-util text-[0.72rem] font-medium uppercase tracking-[0.22em] text-white transition-[transform,background-color] duration-200 hover:bg-evt-framboesa-deep disabled:opacity-60"
            >
              {enviando ? "Gerando Pix…" : `Gerar Pix · ${fmt(brutoPrevisto)}`}
            </button>
          </div>
        )}

        {/* ── Passo 2: Pix ── */}
        {etapa === "pix" && pix && (
          <div className="text-center">
            <p className="eyebrow text-evt-rosa-ink">Pague com Pix</p>
            <p className="mt-1 font-evt-display text-[1.5rem] text-evt-ink">{fmt(pix.bruto)}</p>
            <div className="relative mx-auto mt-4 aspect-square w-[min(200px,64%)] overflow-hidden rounded-[12px] border border-[var(--line)]">
              <Image src={pix.qr} alt="QR Code do Pix" fill sizes="200px" className="object-contain" unoptimized />
            </div>
            <p className="mx-auto mt-4 max-w-full truncate rounded-[10px] bg-ivory/97 px-3 py-2 font-mono text-[0.8rem] text-evt-ink-soft" title={pix.code}>
              {pix.code}
            </p>
            <button
              type="button"
              onClick={copiar}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-evt-rosa-ink px-6 py-2.5 font-evt-util text-[0.7rem] font-medium uppercase tracking-[0.2em] text-evt-rosa-ink"
            >
              {copiado ? "Copiado!" : "Copiar código Pix"}
            </button>

            {simulado ? (
              <>
                <button
                  type="button"
                  onClick={confirmarSimulado}
                  disabled={confirmando}
                  className="mt-6 w-full rounded-full bg-evt-framboesa px-6 py-3.5 font-evt-util text-[0.72rem] font-medium uppercase tracking-[0.22em] text-white transition-[transform,background-color] duration-200 hover:bg-evt-framboesa-deep disabled:opacity-60"
                >
                  {confirmando ? "Confirmando…" : "Confirmar pagamento"}
                </button>
                <p className="mt-3 font-evt-util text-[0.66rem] uppercase tracking-[0.16em] text-evt-ink-soft">
                  Pagamento simulado (teste)
                </p>
              </>
            ) : (
              <>
                <p className="mt-5 font-evt-body text-[0.95rem] text-evt-ink-soft">
                  Pague o Pix no app do seu banco. Assim que cair, esta tela confirma sozinha.
                </p>
                <button
                  type="button"
                  onClick={verificarAgora}
                  disabled={confirmando}
                  className="mt-3 w-full rounded-full border border-evt-rosa-ink px-6 py-3 font-evt-util text-[0.7rem] font-medium uppercase tracking-[0.2em] text-evt-rosa-ink transition-colors hover:bg-evt-rosa-ink/5 disabled:opacity-60"
                >
                  {confirmando ? "Verificando…" : "Já paguei"}
                </button>
              </>
            )}
            {erro && <p className="mt-2 font-evt-body text-[0.95rem] text-red-600">{erro}</p>}
          </div>
        )}

        {/* ── Passo 3: obrigada ── */}
        {etapa === "ok" && (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-evt-framboesa/12 text-evt-framboesa">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h3 className="mt-4 font-evt-script text-[calc(clamp(2.2rem,8vw,2.8rem)*var(--ev-fonte-fator,1))] leading-tight text-evt-ink">
              Presente confirmado!
            </h3>
            <p className="mt-2 font-evt-body text-[1.05rem] text-evt-ink-soft">
              Muito obrigada pelo carinho 💝
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-full bg-evt-framboesa px-8 py-3 font-evt-util text-[0.72rem] font-medium uppercase tracking-[0.22em] text-white"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
