/**
 * Classes compartilhadas do painel DARK (mockup "SaaS seuconviteia DARK").
 * Tokens `scv-*` vem do globals.css (tema escuro padrao + claro por atributo).
 * Centralizadas aqui para as ~15 telas ficarem consistentes e enxutas.
 */

/** Coluna central padrao das telas. */
export const COLUNA = "mx-auto w-full max-w-[1080px] px-4 sm:px-7";

/** Coluna estreita (perfil, convidados, login). */
export const COLUNA_ESTREITA = "mx-auto w-full max-w-[640px] px-4 sm:px-7";

/** Card de superficie padrao. */
export const CARD =
  "rounded-2xl border border-black/5 bg-scv-card shadow-[0_18px_44px_-32px_rgba(15,23,42,0.22)]";

/** Input padrao. */
export const INPUT =
  "w-full rounded-[11px] border border-scv-line bg-scv-field px-3.5 py-3 text-[14.5px] text-scv-ink outline-none transition placeholder:text-scv-faint focus:border-violeta focus:ring-2 focus:ring-violeta/15";

/** Rotulo de campo. */
export const LABEL = "mb-1.5 block text-[13px] font-semibold text-scv-ink";

/** Botao primario (violeta cheio, como no mockup). */
export const BTN_PRIMARIO =
  "cursor-pointer rounded-xl bg-violeta px-6 py-3.5 text-[14.5px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(122,64,237,0.45)] transition-[filter,box-shadow] duration-200 hover:brightness-110 hover:shadow-[0_14px_30px_-12px_rgba(122,64,237,0.5)] disabled:cursor-not-allowed disabled:opacity-50";

/** Botao secundario (card com borda). */
export const BTN_GHOST =
  "cursor-pointer rounded-xl border border-scv-line bg-scv-card px-5 py-3 text-[13.5px] font-semibold text-scv-ink transition-colors duration-200 hover:border-scv-dash hover:bg-scv-field";

/** Botao neutro forte (inverte com o tema — claro no escuro / escuro no claro). */
export const BTN_FORTE =
  "cursor-pointer rounded-[10px] bg-scv-btn px-4 py-2.5 text-[12.5px] font-semibold text-scv-btn-ink transition-opacity duration-200 hover:opacity-90";

/** Botao pequeno de card. */
export const BTN_CARD =
  "cursor-pointer rounded-[10px] border border-scv-line bg-scv-card px-4 py-2.5 text-[13px] font-semibold text-scv-ink transition-colors duration-200 hover:border-scv-dash hover:bg-scv-field";

/** Titulo de pagina (Fraunces). */
export const TITULO = "font-display text-[28px] font-semibold tracking-tight text-scv-ink";

/** Subtitulo/descricao de pagina. */
export const SUB = "text-[13.5px] text-scv-muted";

/** Pill de status "No ar". */
export const PILL_NO_AR =
  "rounded-full bg-scv-teal/10 px-3 py-1 text-[10.5px] font-bold text-scv-teal";

/** Pill de status "Em preparação". */
export const PILL_PREPARO =
  "rounded-full bg-scv-warn-bg px-3 py-1 text-[10.5px] font-bold text-scv-warn-ink";

/** Botao de voltar (quadrado com chevron). */
export const BTN_VOLTAR =
  "grid size-9 shrink-0 cursor-pointer place-items-center rounded-[11px] border border-scv-line bg-scv-card text-scv-ink transition-colors duration-200 hover:border-scv-dash hover:bg-scv-field";
