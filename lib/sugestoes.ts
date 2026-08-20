/**
 * Programacao sugerida por nicho — alimenta o "✨ Sugerir" do passo de
 * programacao do editor. Objetivo: o profissional nunca encara um campo em
 * branco sem saber o que pôr.
 *
 * As sugestoes de PRESENTES e as dicas de preenchimento (como escrever,
 * dimensoes de foto) sairam na Task 11 junto com as telas do painel antigo, que
 * eram quem as mostrava — o editor de 6 passos tem os proprios textos.
 *
 * PURO e testavel (sem DOM/Date).
 */
import type { NichoEvento } from "@/lib/convite";

export type ItemProgramacao = { hora: string; titulo: string };

const PROGRAMACAO: Record<NichoEvento, ItemProgramacao[]> = {
  CASAMENTO: [
    { hora: "16h00", titulo: "Recepção dos convidados" },
    { hora: "16h30", titulo: "Cerimônia" },
    { hora: "18h00", titulo: "Coquetel" },
    { hora: "20h00", titulo: "Jantar" },
    { hora: "22h00", titulo: "Festa" },
  ],
  QUINZE_ANOS: [
    { hora: "20h00", titulo: "Recepção" },
    { hora: "21h00", titulo: "Entrada da debutante" },
    { hora: "21h30", titulo: "Valsa" },
    { hora: "22h00", titulo: "Jantar" },
    { hora: "23h00", titulo: "Balada" },
  ],
  SESSENTA_ANOS: [
    { hora: "19h00", titulo: "Recepção" },
    { hora: "20h00", titulo: "Jantar" },
    { hora: "21h30", titulo: "Homenagens" },
    { hora: "22h00", titulo: "Música e dança" },
  ],
  BODAS: [
    { hora: "19h00", titulo: "Recepção" },
    { hora: "19h30", titulo: "Renovação de votos" },
    { hora: "20h30", titulo: "Jantar" },
    { hora: "22h00", titulo: "Festa" },
  ],
  ANIVERSARIO: [
    { hora: "19h00", titulo: "Recepção" },
    { hora: "20h00", titulo: "Jantar" },
    { hora: "21h00", titulo: "Parabéns e bolo" },
    { hora: "22h00", titulo: "Festa" },
  ],
};

export function programacaoSugerida(type: NichoEvento | string): ItemProgramacao[] {
  return (PROGRAMACAO[type as NichoEvento] ?? PROGRAMACAO.ANIVERSARIO).map((i) => ({
    ...i,
  }));
}
