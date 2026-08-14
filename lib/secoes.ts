/**
 * Copy editavel das SECOES do convite (parte do `Event.customization`).
 *
 * Ate aqui os titulos/rotulos das secoes estavam CHUMBADOS nos componentes do
 * template ("O convite", "Vem comemorar comigo", "Com carinho,"). Este modulo
 * externaliza essa copy: cada texto vem de `customization.secoes` quando o
 * cliente preencheu, senao cai para o DEFAULT do nicho (`lib/textos.ts`). Assim
 * o editor (passo "Conteudo") passa a controlar esses textos sem que nada fique
 * feio por omissao — e o site do demo continua identico (defaults = a copy atual).
 *
 * PURO e testavel (sem DOM/Date/banco): recebe o `customization` cru + o nicho.
 * Tolerante a JSON malformado (Zod `.safeParse` -> defaults).
 */
import { z } from "zod";
import type { NichoEvento } from "./convite";
import { textosDoNicho } from "./textos";

/** Copy resolvida da secao de abertura ("O convite") — sempre preenchida. */
export type SecoesConvite = {
  /** Secao de abertura / carta ("O convite"). */
  abertura: {
    /** Sobre-titulo pequeno (ex.: "O convite"). */
    eyebrow: string;
    /** Titulo script grande (ex.: "Vem comemorar comigo"). */
    titulo: string;
  };
  /** Linha script acima da assinatura (ex.: "Com carinho,"). */
  assinaturaLead: string;
  /** Pagina /recados: cabecalho, convite do formulario e titulo do mural. */
  recados: {
    /** Sobre-titulo pequeno (ex.: "Mural de recados"). */
    eyebrow: string;
    /** Titulo da pagina (ex.: "Deixe seu carinho"). */
    titulo: string;
    /** Linha que convida a escrever; `{nome}` vira o primeiro nome do evento. */
    convite: string;
    /** Titulo script acima do mural (ex.: "Recados de quem ama"). */
    muralTitulo: string;
  };
};

/** Rotulo fixo da secao de abertura quando nao ha override. */
const EYEBROW_ABERTURA_PADRAO = "O convite";

/**
 * Shape esperado de `customization.secoes` (tudo opcional; o editor grava so o
 * que o cliente mexeu). Novas subsecoes (local, traje, ...) entram aqui conforme
 * as proximas fatias ligam o editor.
 */
const secoesSchema = z
  .object({
    abertura: z
      .object({
        eyebrow: z.string(),
        titulo: z.string(),
      })
      .partial(),
    assinaturaLead: z.string(),
    recados: z
      .object({
        eyebrow: z.string(),
        titulo: z.string(),
        convite: z.string(),
        muralTitulo: z.string(),
      })
      .partial(),
  })
  .partial();

/** Texto limpo -> `undefined` quando vazio (cai para o default). */
function texto(valor: string | undefined | null): string | undefined {
  const limpo = valor?.trim();
  return limpo ? limpo : undefined;
}

/** Le o objeto `secoes` de dentro de um `customization` cru (tolerante). */
function extrairSecoes(customization: unknown): z.infer<typeof secoesSchema> {
  if (!customization || typeof customization !== "object" || Array.isArray(customization)) {
    return {};
  }
  const bruto = (customization as Record<string, unknown>).secoes;
  const parsed = secoesSchema.safeParse(bruto);
  return parsed.success ? parsed.data : {};
}

/**
 * Resolve a copy das secoes: valor do cliente -> senao default do nicho.
 * Nunca devolve string vazia (o template sempre tem o que renderizar).
 */
export function lerSecoes(
  customization: unknown,
  nicho: NichoEvento | string,
): SecoesConvite {
  const s = extrairSecoes(customization);
  const t = textosDoNicho(nicho);
  return {
    abertura: {
      eyebrow: texto(s.abertura?.eyebrow) ?? EYEBROW_ABERTURA_PADRAO,
      titulo: texto(s.abertura?.titulo) ?? t.conviteTitulo,
    },
    assinaturaLead: texto(s.assinaturaLead) ?? t.assinaturaPrefixo,
    recados: {
      eyebrow: texto(s.recados?.eyebrow) ?? t.recadosEyebrow,
      titulo: texto(s.recados?.titulo) ?? t.recadosTitulo,
      convite: texto(s.recados?.convite) ?? t.recadosConvite,
      muralTitulo: texto(s.recados?.muralTitulo) ?? t.recadosMural,
    },
  };
}
