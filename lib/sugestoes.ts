/**
 * Sugestoes prontas por nicho para o FORMULARIO de criacao de evento — alimentam
 * os botoes "✨ Sugerir" (programacao, presentes) e as dicas de preenchimento
 * (como escrever, dimensoes de foto). Objetivo: o profissional nunca encara um
 * campo em branco sem saber o que pôr.
 *
 * PURO e testavel (sem DOM/Date). A "IA de verdade" (gerar texto sob medida via
 * Claude API) entra depois; por ora isto da o mesmo UX de sugestao, instantaneo.
 */
import type { NichoEvento } from "@/lib/convite";

export type ItemProgramacao = { hora: string; titulo: string };
export type ItemPresente = { titulo: string; descricao: string; valor: string; foto?: string };

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

const PRESENTES: Record<NichoEvento, ItemPresente[]> = {
  CASAMENTO: [
    { titulo: "Cota da lua de mel", descricao: "Ajude a realizar a viagem dos sonhos.", valor: "150,00", foto: "/presentes-demo/viagem.jpg" },
    { titulo: "Jantar romântico", descricao: "Um presente para os novos começos.", valor: "100,00", foto: "/presentes-demo/festa.jpg" },
    { titulo: "Ensaio fotográfico", descricao: "Memórias do grande dia.", valor: "250,00", foto: "/presentes-demo/foto.jpg" },
    { titulo: "Dia de spa a dois", descricao: "Um respiro depois da festa.", valor: "180,00", foto: "/presentes-demo/spa.jpg" },
  ],
  QUINZE_ANOS: [
    { titulo: "Cota da viagem", descricao: "Uma lembrança para guardar para sempre.", valor: "150,00", foto: "/presentes-demo/viagem.jpg" },
    { titulo: "Vestido de festa", descricao: "O vestido dos sonhos da debutante.", valor: "300,00", foto: "/presentes-demo/vestido.jpg" },
    { titulo: "Kit maquiagem", descricao: "Para brilhar na noite e depois dela.", valor: "120,00", foto: "/presentes-demo/make.jpg" },
    { titulo: "Ensaio fotográfico", descricao: "Fotos profissionais dos 15 anos.", valor: "250,00", foto: "/presentes-demo/foto.jpg" },
    { titulo: "Dia de spa", descricao: "Um dia de princesa antes da festa.", valor: "180,00", foto: "/presentes-demo/spa.jpg" },
    { titulo: "Cota da festa", descricao: "Ajude a realizar essa noite especial.", valor: "100,00", foto: "/presentes-demo/festa.jpg" },
    { titulo: "Sapato dos sonhos", descricao: "Para a valsa e para a vida.", valor: "150,00", foto: "/presentes-demo/sapato.jpg" },
    { titulo: "Fone de ouvido", descricao: "A trilha sonora da nova fase.", valor: "200,00", foto: "/presentes-demo/som.jpg" },
  ],
  SESSENTA_ANOS: [
    { titulo: "Cota da viagem", descricao: "Um presente para uma nova aventura.", valor: "150,00", foto: "/presentes-demo/viagem.jpg" },
    { titulo: "Jantar especial", descricao: "Uma noite para celebrar a vida.", valor: "120,00", foto: "/presentes-demo/festa.jpg" },
    { titulo: "Dia de spa", descricao: "Cuidar de quem sempre cuidou.", valor: "180,00", foto: "/presentes-demo/spa.jpg" },
    { titulo: "Ensaio fotográfico", descricao: "Retratos para guardar.", valor: "250,00", foto: "/presentes-demo/foto.jpg" },
  ],
  BODAS: [
    { titulo: "Cota da viagem", descricao: "Para renovar os votos em grande estilo.", valor: "150,00", foto: "/presentes-demo/viagem.jpg" },
    { titulo: "Jantar a dois", descricao: "Um carinho para o casal.", valor: "100,00", foto: "/presentes-demo/festa.jpg" },
    { titulo: "Ensaio do casal", descricao: "Memórias de uma história linda.", valor: "250,00", foto: "/presentes-demo/foto.jpg" },
    { titulo: "Dia de spa a dois", descricao: "Um presente para relaxar juntos.", valor: "180,00", foto: "/presentes-demo/spa.jpg" },
  ],
  ANIVERSARIO: [
    { titulo: "Cota da festa", descricao: "Ajude a tornar a comemoração ainda melhor.", valor: "80,00", foto: "/presentes-demo/festa.jpg" },
    { titulo: "Cota da viagem", descricao: "Um presente para uma nova aventura.", valor: "120,00", foto: "/presentes-demo/viagem.jpg" },
    { titulo: "Ensaio fotográfico", descricao: "Fotos para marcar a data.", valor: "250,00", foto: "/presentes-demo/foto.jpg" },
    { titulo: "Fone de ouvido", descricao: "Música boa o ano inteiro.", valor: "200,00", foto: "/presentes-demo/som.jpg" },
  ],
};

/** Programacao tipica do nicho (cai para Aniversário se desconhecido). */
export function programacaoSugerida(type: NichoEvento | string): ItemProgramacao[] {
  return (PROGRAMACAO[type as NichoEvento] ?? PROGRAMACAO.ANIVERSARIO).map((i) => ({
    ...i,
  }));
}

/** Lista de presentes tipica do nicho (cai para Aniversário se desconhecido). */
export function presentesSugeridos(type: NichoEvento | string): ItemPresente[] {
  return (PRESENTES[type as NichoEvento] ?? PRESENTES.ANIVERSARIO).map((i) => ({
    ...i,
  }));
}

// ---- Dicas de preenchimento (texto + foto) -------------------------------------

/** Dimensoes/orientacao recomendadas da FOTO DE CAPA (hero, retrato). */
export const DICA_FOTO_CAPA =
  "Use uma foto vertical (retrato), ~1200×1600px (proporção 3:4), nítida e com a pessoa/casal em destaque. JPG, PNG ou WebP, até 6MB.";

/** Dimensoes recomendadas das fotos do ALBUM (galeria). */
export const DICA_FOTO_ALBUM =
  "As melhores do ensaio. Quadradas ou verticais, ~1200×1200px ou maiores. JPG, PNG ou WebP, até 6MB cada.";

/** Dimensoes recomendadas da FOTO ao lado da lista de PRESENTES. */
export const DICA_FOTO_PRESENTES =
  "Aparece ao lado da lista de presentes. Vertical (retrato), ~1200×1500px (proporção 4:5). JPG, PNG ou WebP, até 6MB.";

/** Dica de escrita do TITULO (nome em destaque na capa). */
export const DICA_TITULO =
  'O nome que aparece em destaque na capa. Ex.: "Maria & Léo", "Maria Clara", "Bodas de Ouro do Sr. José".';

/** Dica de escrita da MENSAGEM de boas-vindas. */
export const DICA_MENSAGEM =
  "Uma mensagem curta e afetuosa de boas-vindas — 2 a 4 linhas bastam. Use “✨ Sugerir” para começar com um texto pronto e ajuste do seu jeito.";
