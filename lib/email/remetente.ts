// White-label do remetente (recurso Premium). O ENDERECO do e-mail e sempre o de
// EMAIL_FROM; o que muda por plano e o NOME de exibicao que aparece antes do
// <email>. Plano com white-label liberado exibe o nome do profissional/estudio;
// os demais exibem a marca da plataforma.
//
// Gating le SEMPRE `planoPermite` de `lib/plans.ts` (fonte unica) — nunca
// espalhar `if plan === ...` por aqui.
import { planoPermite, type Plan } from "../plans";

/** Nome de exibicao padrao da plataforma (quando o white-label nao se aplica). */
export const MARCA = "SeuConvite IA";

/**
 * Nome de exibicao do remetente para um dado plano/profissional:
 *  - plano com `whiteLabel` liberado E nome preenchido -> nome do profissional;
 *  - caso contrario -> "SeuConvite IA".
 *
 * Puro/testavel. Nao decide o ENDERECO (esse vem de EMAIL_FROM no provider); so
 * o rotulo. `nomeProfissional` opcional/vazio cai na marca (defensivo).
 */
export function montarRemetente(plan: Plan, nomeProfissional?: string | null): string {
  const nome = nomeProfissional?.trim();
  if (nome && planoPermite(plan, "whiteLabel")) {
    return nome;
  }
  return MARCA;
}
