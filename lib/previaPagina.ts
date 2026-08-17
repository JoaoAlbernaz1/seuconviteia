/**
 * Qual pagina do site a PREVIA do editor deve mostrar.
 *
 * O passo (e o campo em foco) definem o ALVO; os liga/desliga do convite dizem
 * se aquela pagina existe pro convidado. Desligou o mural, a galeria, os
 * presentes ou a confirmacao? A previa cai no INICIO — mostrar a pagina
 * "indisponivel" deixa a telinha praticamente vazia e parece que a previa
 * quebrou (foi exatamente o que aconteceu com o Joao em 11/08).
 *
 * PURO e testavel: so recebe passo, foco e os toggles.
 */
export type TogglesPrevia = {
  /** Confirmacao de presenca (RSVP). */
  rsvp: boolean;
  /** Lista de presentes. */
  presentes: boolean;
  /** Galeria de fotos. */
  galeria: boolean;
  /** Mural de recados. */
  recados: boolean;
};

/** Pagina do site pedida pelo passo/foco, ANTES de checar o que esta ligado. */
export function paginaAlvo(step: number, foco?: string): string {
  if (step === 2) return "evento";
  if (step === 3) return foco === "obrigada-sim" || foco === "obrigada-nao" ? "obrigada" : "confirmar";
  if (step === 4) return "presentes";
  if (step === 5) return foco === "recados" ? "recados" : "galeria";
  return "inicio";
}

/**
 * Na tela de "Obrigada", QUAL das duas respostas a previa mostra.
 *
 * `paginaAlvo` devolve "obrigada" tanto para quem confirma quanto para quem
 * nao vai — o que separa as duas e SO o foco. Sem consultar o foco aqui, a
 * previa cai no padrao (confirmou) e a "Mensagem para quem nao pode ir" nunca
 * aparece, por mais que se clique em "Ver: quem nao vai".
 *
 * No site publicado quem decide e a query `?vai=0`; aqui e o foco.
 */
export function confirmouNaPrevia(foco?: string): boolean {
  return foco !== "obrigada-nao";
}

/** A pagina depende de um recurso desligado? (aí ela nao existe pro convidado) */
function indisponivel(pagina: string, on: TogglesPrevia): boolean {
  if (pagina === "confirmar" || pagina === "obrigada") return !on.rsvp;
  if (pagina === "presentes") return !on.presentes;
  if (pagina === "galeria") return !on.galeria;
  if (pagina === "recados") return !on.recados;
  return false;
}

/**
 * Pagina que a previa deve carregar: o alvo do passo, ou `"inicio"` quando o
 * alvo depende de uma secao desligada.
 */
export function paginaDaPrevia(step: number, foco: string | undefined, on: TogglesPrevia): string {
  const alvo = paginaAlvo(step, foco);
  if (!indisponivel(alvo, on)) return alvo;
  // No passo "Galeria e recados" as duas paginas moram juntas: se a que ele
  // olhava foi desligada, mostra a irma antes de sair do passo.
  if (step === 5) {
    const irma = alvo === "recados" ? "galeria" : "recados";
    if (!indisponivel(irma, on)) return irma;
  }
  return "inicio";
}
