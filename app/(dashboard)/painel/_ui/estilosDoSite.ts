// Combinações CURADAS de estilo do site (passo 2 do wizard + tela "Trocar o
// estilo"): paleta + dupla de letras aplicadas ao template Clássico.
// Curadoria total: o cliente nunca monta fonte/cor solta.

export const ESTILOS_SITE = [
  { id: "classico", nome: "Clássico", tag: "Cursiva e elegante", tema: "rose", fontes: "classica" },
  { id: "editorial", nome: "Editorial", tag: "Ar de revista", tema: "dourado", fontes: "moderna" },
  { id: "boho", nome: "Boho", tag: "Romântico e leve", tema: "terracota", fontes: "romantica" },
  { id: "noite", nome: "Noite", tag: "Profundo e festivo", tema: "azul", fontes: "festiva" },
  { id: "minimal", nome: "Minimal", tag: "Só tipografia", tema: "lavanda", fontes: "minimalista" },
  { id: "jardim", nome: "Jardim", tag: "Botânico e fresco", tema: "verde", fontes: "romantica" },
] as const;

export type EstiloSite = (typeof ESTILOS_SITE)[number];

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
