// Combinações CURADAS de estilo do site (passo 2 do wizard + tela "Trocar o
// estilo"): paleta + dupla de letras aplicadas ao template Clássico.
// Curadoria total: o cliente nunca monta fonte/cor solta.
//
// Agora POR OCASIÃO — 3 templates afinados ao clima de cada nicho (casamento
// atemporal, 15 anos glam/festivo, aniversário versátil). Só paletas (`lib/temas`)
// e duplas de fontes (`lib/fontes`) reais do projeto.

export type EstiloSite = {
  id: string;
  nome: string;
  tag: string;
  tema: string;
  fontes: string;
};

/** 3 templates curados por ocasião. */
export const TEMPLATES_POR_NICHO: Record<string, readonly EstiloSite[]> = {
  CASAMENTO: [
    { id: "cas-classico", nome: "Clássico", tag: "Cursiva e atemporal", tema: "rose", fontes: "classica" },
    { id: "cas-editorial", nome: "Editorial", tag: "Sofisticado, ar de revista", tema: "dourado", fontes: "moderna" },
    { id: "cas-jardim", nome: "Jardim", tag: "Botânico e romântico", tema: "verde", fontes: "romantica" },
  ],
  QUINZE_ANOS: [
    { id: "q15-noite", nome: "Noite", tag: "Glam e festivo", tema: "azul", fontes: "festiva" },
    { id: "q15-encanto", nome: "Encanto", tag: "Rosé, doce e vibrante", tema: "rose", fontes: "festiva" },
    { id: "q15-moderno", nome: "Moderno", tag: "Clean e atual", tema: "lavanda", fontes: "moderna" },
  ],
  ANIVERSARIO: [
    { id: "ani-boho", nome: "Boho", tag: "Quente e aconchegante", tema: "terracota", fontes: "romantica" },
    { id: "ani-fresco", nome: "Fresco", tag: "Natural e clean", tema: "verde", fontes: "minimalista" },
    { id: "ani-festa", nome: "Festa", tag: "Dourado e celebrativo", tema: "dourado", fontes: "festiva" },
  ],
};

/** Trio de fallback para nichos legados (bodas/60 anos) ou desconhecidos. */
const TEMPLATES_PADRAO = TEMPLATES_POR_NICHO.CASAMENTO;

/** Templates da ocasião (3), com fallback seguro para qualquer nicho. */
export function estilosDoNicho(tipo: string | undefined): readonly EstiloSite[] {
  return (tipo && TEMPLATES_POR_NICHO[tipo]) || TEMPLATES_PADRAO;
}

/** Lista achatada de TODOS os templates (para casar a combinação atual). */
export const ESTILOS_SITE: readonly EstiloSite[] = Object.values(
  TEMPLATES_POR_NICHO,
).flat();

/** Nome de exemplo por ocasião (placeholders e capas de amostra). */
export const EXEMPLO_NOME: Record<string, string> = {
  CASAMENTO: "Ana & Léo",
  QUINZE_ANOS: "Maria Clara",
  BODAS: "Ana & Carlos",
  SESSENTA_ANOS: "Seu Antônio",
  ANIVERSARIO: "Lara",
};

/** Rótulo do campo de nome por ocasião. */
export const NOME_LABEL: Record<string, string> = {
  CASAMENTO: "Nome dos noivos",
  QUINZE_ANOS: "Nome da debutante",
  BODAS: "Nome do casal",
  SESSENTA_ANOS: "Nome do aniversariante",
  ANIVERSARIO: "Nome do aniversariante",
};

/** Estilo cuja combinação bate com o tema+fontes atuais (ou undefined). */
export function estiloAtual(tema: string, fontes: string): EstiloSite | undefined {
  return ESTILOS_SITE.find((e) => e.tema === tema && e.fontes === fontes);
}
