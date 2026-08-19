/**
 * Quando o site de um convite pode ser MEXIDO.
 *
 * Decisao do Joao (18/08/2026): publicou, fecha. O que continua livre e o
 * movimento da festa (confirmacoes, recados, presentes recebidos) — o SITE em
 * si so reabre dentro de uma janela: a cortesia de 1h logo apos a primeira
 * publicacao, uma liberacao incluida no plano ou o passe pago.
 *
 * Helper PURO (recebe o "agora"), como `lib/event.ts`: a decisao mora aqui e as
 * tres portas do servidor (abrir editor, salvar documento, publicar) so
 * perguntam.
 */
import { conviteEncerrado, type StatusEvento } from "./event";
import type { Plan } from "./plans";

/** Preco do passe de edicao, em centavos. */
export const PASSE_PRECO_CENTS = 1990;
/** Quanto tempo o passe pago mantem a edicao aberta. */
export const PASSE_HORAS = 48;
/** Cortesia logo depois da PRIMEIRA publicacao — a rede do erro de digitacao. */
export const CORTESIA_MINUTOS = 60;

/**
 * A resposta para quem tenta mexer numa festa que ja aconteceu.
 *
 * Mora aqui porque e a MESMA frase em toda porta que recusa por data vencida:
 * as actions do passe, as de salvar e publicar, e a tela — que a diz antes do
 * clique, para nao oferecer um botao que so da erro. Copiada a mao, viraria uma
 * frase diferente por porta no primeiro ajuste de texto.
 */
export const RECUSA_FESTA_PASSOU = "Esta festa já passou. Crie um convite novo para a próxima.";

/** Subconjunto do Event necessario para decidir se o endereco ja congelou. */
export type EventoEndereco = {
  status: StatusEvento;
  publishedAt: Date | null;
};

/**
 * O endereco (subdominio) deste convite ja esta CONGELADO?
 *
 * Trava a partir da SEGUNDA publicacao: na primeira o servidor ainda sorteia o
 * subdominio (`gerarSlugUnico`); depois dela o link ja foi para o WhatsApp dos
 * convidados e mudar o nome da debutante nao pode derrubar quem guardou o
 * convite.
 *
 * `status` sozinho so seria seguro porque hoje "tirar do ar" mantem PUBLISHED;
 * `publishedAt` continua honesto se alguem reintroduzir um "despublicar" que
 * volte para DRAFT. Os dois juntos porque convite legado publicado pelo painel
 * antigo tem `publishedAt` nulo — sozinho, ele recalcularia o endereco de um
 * convite que JA esta no ar.
 *
 * Mora aqui porque a regra tem DOIS leitores que precisam concordar: a action
 * que decide se recalcula o subdominio e a tela que decide se mostra o campo
 * como editavel. Copiada, elas divergem no primeiro ajuste — e a divergencia
 * seria a tela deixando editar um endereco que o servidor ignora.
 */
export function enderecoTravado(ev: EventoEndereco): boolean {
  return !(ev.status !== "PUBLISHED" && ev.publishedAt === null);
}

/** Subconjunto do Event necessario para decidir a edicao. */
export type EventoEdicao = {
  status: StatusEvento;
  expiresAt: Date;
  edicaoAte: Date | null;
};

/**
 * O site deste convite pode ser mexido agora?
 *
 * O fim da festa e perguntado a `conviteEncerrado` — a MESMA funcao que tira o
 * site do ar. Deixar cada chamador lembrar de combinar as duas e armadilha: quem
 * esquecer vende um passe de R$ 19,90 para um convite morto.
 */
export function edicaoAberta(ev: EventoEdicao, agora: Date): boolean {
  // Rascunho edita sempre, e a ORDEM aqui e a regra: `conviteEncerrado` tambem
  // reprova por data vencida, e o rascunho e justamente onde se conserta a data
  // errada. Perguntar primeiro trancaria a pessoa para fora do proprio conserto.
  if (ev.status === "DRAFT") return true;
  if (conviteEncerrado(ev, agora)) return false;
  return ev.edicaoAte !== null && ev.edicaoAte.getTime() > agora.getTime();
}

/** Fim da cortesia contado a partir da primeira publicacao. */
export function fimDaCortesia(agora: Date): Date {
  return new Date(agora.getTime() + CORTESIA_MINUTOS * 60_000);
}

/** Fim da janela que o passe (pago ou incluido no plano) abre. */
export function fimDoPasse(agora: Date): Date {
  return new Date(agora.getTime() + PASSE_HORAS * 60 * 60_000);
}

/** Liberacoes incluidas no plano, POR CONVITE (decisao do Joao: assinante tem teto). */
export function passesIncluidos(plan: Plan): number {
  switch (plan) {
    case "PREMIUM":
      return 3;
    case "CLASSICO":
      return 1;
    case "BASICO":
    default:
      return 0;
  }
}

/**
 * Ainda sobra liberacao incluida neste convite?
 *
 * `passesGratisUsados` e quanto ja foi CONSUMIDO neste convite, nao o saldo —
 * `number` contra `number` nao acusa quem inverter.
 */
export function temPasseIncluido(plan: Plan, passesGratisUsados: number): boolean {
  return passesGratisUsados < passesIncluidos(plan);
}
