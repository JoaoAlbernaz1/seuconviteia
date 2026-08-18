// O "roteirista" da foto do presente.
//
// PROBLEMA: o nome do presente vira o pedido da imagem sem tradução nenhuma, e
// boa parte dos presentes de festa NÃO É OBJETO. "Valsa da debutante" é um
// momento; "Cota da festa" é uma abstração; "Buffet" é um serviço. Pedir
// "fotografia de produto de uma valsa" faz o modelo inventar qualquer coisa —
// foi o que o João viu.
//
// SOLUÇÃO: antes de desenhar, alguém escreve a CENA. Um modelo de texto barato
// transforma o nome em uma descrição visual concreta, e só ela vai para o
// modelo de imagem.
//
// Este módulo é a parte PURA (as instruções e a limpeza da resposta), separada
// da chamada de rede para poder ser testada.

/** Descrição do que desenhar quando o roteirista não responde. */
export function promptDeReserva(titulo: string): string {
  return (
    `Fotografia profissional de produto para lista de presentes de festa: ${titulo}. ` +
    "Fundo elegante e suave, iluminação de estúdio, sem texto, sem pessoas identificáveis."
  );
}

/** As instruções do roteirista. Em português: o nome do presente vem em pt-BR. */
export function instrucoesDoRoteirista(): string {
  return [
    "Você escreve descrições de imagem para a lista de presentes de um site de festa de 15 anos.",
    "Recebe o NOME do presente, do jeito que a pessoa escreveu, e devolve UMA cena fotografável.",
    "",
    "Regras:",
    "- Presente que não é objeto (um momento, um serviço, uma cota em dinheiro) vira o OBJETO ou o AMBIENTE que o representa. Ex.: 'Valsa da debutante' -> sapatos de salto prateados no piso de um salão iluminado.",
    "- Descreva enquadramento, luz e fundo. Nada de texto, letras, números, logotipos, marcas ou rostos.",
    "- Uma frase, no máximo 45 palavras, em inglês (o modelo de imagem entende melhor).",
    "- Responda SÓ a descrição, sem aspas e sem explicação.",
  ].join("\n");
}

/**
 * O pedido enviado ao roteirista: o nome, a descrição que a pessoa escreveu e a
 * cor do convite. A DESCRIÇÃO é o melhor contexto que existe — "Cota da festa"
 * não diz nada, mas "Cota da festa · ajude com o buffet da noite" diz tudo.
 */
export function pedidoAoRoteirista(titulo: string, cor?: string, descricao?: string): string {
  const detalhe = descricao?.trim() ? ` O anfitrião descreveu assim: "${descricao.trim()}".` : "";
  const paleta = cor ? ` Paleta do convite: ${cor} — use como cor de apoio no fundo ou nos detalhes.` : "";
  return `Presente: "${titulo}".${detalhe}${paleta}`;
}

/**
 * Limpa a resposta do roteirista. Modelo devolve aspas, quebra de linha e às
 * vezes um "Sure, here's...": nada disso pode ir para o modelo de imagem.
 * Resposta vazia ou curta demais devolve `null` — quem chama usa a reserva.
 */
export function descricaoSegura(bruto: string | undefined | null): string | null {
  if (!bruto) return null;
  const limpo = bruto
    .replace(/\s+/g, " ")
    .replace(/^["'`\s]+|["'`\s]+$/g, "")
    .trim()
    .slice(0, 600);
  return limpo.length >= 15 ? limpo : null;
}

/** O pedido final ao modelo de imagem, a partir da cena escrita pelo roteirista. */
export function promptDaImagem(descricao: string): string {
  return (
    `${descricao} Professional product photography, soft studio lighting, elegant and clean composition, ` +
    "shallow depth of field, no text, no letters, no logos, no identifiable faces."
  );
}
