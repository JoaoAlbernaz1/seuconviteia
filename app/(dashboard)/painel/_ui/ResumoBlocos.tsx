/**
 * Tres blocos de resumo da home do painel.
 *
 * O amarelo #F5FF63 NAO passa contraste com branco: ele so aparece como FUNDO,
 * com tinta preta. Regra, nao sugestao.
 *
 * Com zero eventos os tres aparecem ZERADOS, nao somem — e o que evita a tela
 * vazia parecer quebrada.
 */
const BLOCO = "flex flex-col justify-between rounded-[18px] px-5 py-4 min-h-[104px]";

export function ResumoBlocos({
  sites,
  presencas,
  recados,
}: {
  sites: number;
  presencas: number;
  recados: number;
}) {
  return (
    <div className="mt-7 grid gap-4 sm:grid-cols-3">
      <div className={`${BLOCO} bg-amarelo text-preto`}>
        <span className="text-[32px] font-semibold leading-none">{sites}</span>
        <span className="text-[13px] font-medium opacity-80">
          {sites === 1 ? "site no ar" : "sites no ar"}
        </span>
      </div>

      <div className={`${BLOCO} bg-cinza text-preto`}>
        <span className="text-[32px] font-semibold leading-none">{presencas}</span>
        <span className="text-[13px] font-medium opacity-70">
          {presencas === 1 ? "presença confirmada" : "presenças confirmadas"}
        </span>
      </div>

      <div className={`${BLOCO} bg-violeta text-white`}>
        <span className="text-[32px] font-semibold leading-none">{recados}</span>
        <span className="text-[13px] font-medium opacity-85">
          {recados === 1 ? "recado recebido" : "recados recebidos"}
        </span>
      </div>
    </div>
  );
}
