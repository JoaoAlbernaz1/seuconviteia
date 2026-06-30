/**
 * Textos prontos por nicho de evento (copy padrao). O template da festa tinha
 * copy fixa de "15 anos" (ex.: "Há quinze anos... em forma de menina"), que
 * aparecia ERRADA num casamento/bodas. Aqui cada nicho tem seus textos; o
 * profissional ainda pode sobrescrever a mensagem principal pelo formulario.
 *
 * PURO e testavel (sem DOM/Date). Usado pelos sites do evento (home + /evento)
 * e pelo formulario do painel (pre-preenche a mensagem).
 */
import type { NichoEvento } from "@/lib/convite";

export type TextosEvento = {
  /** Titulo da secao "O convite" (home + /evento). */
  conviteTitulo: string;
  /** Paragrafo curto do convite (home, com capitular). */
  conviteTeaser: string;
  /** Prefixo da assinatura ("Com carinho," / "Com amor,") — segue o nome. */
  assinaturaPrefixo: string;
  /** Linha acima do botao Confirmar presenca (home). */
  ctaConvite: string;
  /** Frase de fecho (home, antes do rodape). */
  fecho: string;
  /** Mensagem principal do convite (/evento) quando o profissional nao escreveu. */
  mensagemPadrao: string;
  /** Teasers da home (cartoes presentes/galeria/recados). */
  teaserPresentes: string;
  teaserGaleria: string;
  teaserRecados: string;
};

const TEXTOS: Record<NichoEvento, TextosEvento> = {
  QUINZE_ANOS: {
    conviteTitulo: "Vem comemorar comigo",
    conviteTeaser:
      "Há quinze anos, o sonho mais bonito da nossa vida chegou em forma de menina. Hoje esse sonho floresce — e não existe celebração completa sem as pessoas que fizeram parte dessa história.",
    assinaturaPrefixo: "Com carinho,",
    ctaConvite: "Faça parte dessa noite",
    fecho: "Mal posso esperar para viver essa noite com você.",
    mensagemPadrao:
      "Há quinze anos, o sonho mais bonito da nossa vida chegou em forma de menina. Hoje esse sonho floresce, e celebrar essa noite ao seu lado vai tornar tudo ainda mais especial. Será uma alegria imensa ter você comigo para rir, dançar e guardar para sempre a lembrança dos meus 15 anos.",
    teaserPresentes:
      "Se quiser deixar um carinho a mais, minha chave Pix está aqui.",
    teaserGaleria:
      "Um cantinho com as fotos que contam um pouco dessa história.",
    teaserRecados: "Escreva uma mensagem carinhosa — vou amar ler cada palavra.",
  },

  CASAMENTO: {
    conviteTitulo: "Vamos nos casar",
    conviteTeaser:
      "Depois de tantos caminhos, encontramos um no outro o nosso lugar. Agora queremos dividir a alegria de começar essa nova história ao lado das pessoas que amamos.",
    assinaturaPrefixo: "Com amor,",
    ctaConvite: "Faça parte desse dia",
    fecho: "Mal podemos esperar para celebrar esse dia com você.",
    mensagemPadrao:
      "É com o coração transbordando que convidamos você para celebrar o nosso casamento. Queremos você ao nosso lado neste dia tão especial, para dividir sorrisos, lágrimas de alegria e o começo da nossa vida a dois.",
    teaserPresentes:
      "Sua presença já é tudo. Mas, se quiser nos presentear, deixamos nossa chave Pix aqui.",
    teaserGaleria:
      "Um cantinho com as fotos que contam um pouco da nossa história.",
    teaserRecados: "Deixe uma mensagem para os noivos — vamos amar ler cada palavra.",
  },

  BODAS: {
    conviteTitulo: "Vamos celebrar",
    conviteTeaser:
      "São muitos anos de mãos dadas, de uma história construída dia após dia. Queremos celebrar esse amor que só fez crescer ao lado de quem caminhou junto com a gente.",
    assinaturaPrefixo: "Com amor,",
    ctaConvite: "Faça parte dessa celebração",
    fecho: "Será uma alegria celebrar mais esse capítulo com você.",
    mensagemPadrao:
      "Comemorar nossas bodas é olhar para trás com gratidão e para frente com esperança. Convidamos você para celebrar conosco essa história de amor que o tempo só fez fortalecer.",
    teaserPresentes:
      "Sua presença é o nosso maior presente. Se quiser nos presentear, a chave Pix está aqui.",
    teaserGaleria:
      "Um cantinho com as fotos que contam um pouco da nossa história.",
    teaserRecados: "Deixe uma mensagem para o casal — vamos amar ler cada palavra.",
  },

  SESSENTA_ANOS: {
    conviteTitulo: "Vem celebrar comigo",
    conviteTeaser:
      "Seis décadas de histórias, risadas e conquistas. Chegou a hora de celebrar uma vida bem vivida — e nada como fazer isso ao lado de quem eu amo.",
    assinaturaPrefixo: "Com carinho,",
    ctaConvite: "Faça parte dessa festa",
    fecho: "Vai ser uma alegria comemorar mais essa ao seu lado.",
    mensagemPadrao:
      "Chegar aos 60 é motivo de festa e de gratidão. Convido você para celebrar comigo essa data tão especial, cercado das pessoas que tornaram cada um desses anos mais felizes.",
    teaserPresentes:
      "Sua presença já é o melhor presente. Se quiser, a chave Pix está aqui.",
    teaserGaleria:
      "Um cantinho com as fotos que contam um pouco dessa história.",
    teaserRecados: "Deixe uma mensagem carinhosa — vou amar ler cada palavra.",
  },

  ANIVERSARIO: {
    conviteTitulo: "Vem comemorar comigo",
    conviteTeaser:
      "Mais um ano de vida para comemorar, e a vontade de fazer isso cercado das pessoas que tornam tudo mais especial. Vem celebrar com a gente.",
    assinaturaPrefixo: "Com carinho,",
    ctaConvite: "Faça parte da festa",
    fecho: "Mal posso esperar para comemorar com você.",
    mensagemPadrao:
      "É hora de comemorar! Convido você para a minha festa de aniversário, para rir, dançar e celebrar mais um ano de vida ao lado de quem eu amo.",
    teaserPresentes: "Sua presença já é o presente. Se quiser, a chave Pix está aqui.",
    teaserGaleria:
      "Um cantinho com as fotos que contam um pouco dessa história.",
    teaserRecados: "Deixe uma mensagem carinhosa — vou amar ler cada palavra.",
  },
};

/** Textos prontos do nicho (cai para Aniversário, o mais neutro, se desconhecido). */
export function textosDoNicho(type: NichoEvento | string): TextosEvento {
  return TEXTOS[type as NichoEvento] ?? TEXTOS.ANIVERSARIO;
}
