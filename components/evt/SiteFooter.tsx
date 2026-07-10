import { Flourish } from "@/components/evt/icons";

/**
 * SiteFooter — rodape compartilhado, CLARO e calmo (direcao editorial). Assinatura
 * tipografica: o NOME do evento em destaque, filigrana rosa como divisor, data e
 * local discretos, fecho "Feito com carinho".
 *
 * GATING (credito): enquanto o evento e PREVIEW (`whiteLabel = false`) mostra
 * "Feito com seuconviteia" (marca da plataforma). Quando e COMPRADO (valor unico),
 * o credito da plataforma SOME e, no lugar, aparece a marca do profissional
 * (`brandName`) — ou nada, se ele nao tiver marca.
 *
 * `nome` = nome do evento (destaque). `linhaInfo` = "DD . MM . AAAA · Local".
 */
export function SiteFooter({
  nome,
  linhaInfo,
  whiteLabel = false,
  brandName,
}: {
  nome: string;
  linhaInfo: string;
  whiteLabel?: boolean;
  brandName?: string;
}) {
  const nomeCor = "text-evt-ink";
  const infoCor = "text-evt-ink-soft";
  const italicCor = "text-evt-ink-soft";
  const creditCor = "text-evt-ink-soft/70";
  return (
    <footer className="border-t border-[var(--line)] bg-evt-ivory text-evt-ink">
      <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-6 px-[clamp(1.25rem,5vw,2rem)] py-[clamp(4rem,9vw,5.5rem)] text-center">
        <p className={`font-evt-script text-[clamp(3rem,9vw,4.2rem)] leading-none ${nomeCor}`}>
          {nome}
        </p>

        <Flourish className="h-4 w-28 text-evt-rosa" />

        {linhaInfo && (
          <p className={`font-evt-util text-[0.62rem] uppercase tracking-[0.3em] ${infoCor}`}>
            {linhaInfo}
          </p>
        )}

        <p className={`font-evt-body text-base italic ${italicCor}`}>
          Feito com carinho.
        </p>

        {whiteLabel ? (
          brandName ? (
            <p className={`font-evt-util text-[0.58rem] uppercase tracking-[0.3em] ${creditCor}`}>
              por {brandName}
            </p>
          ) : null
        ) : (
          <p className={`font-evt-util text-[0.58rem] uppercase tracking-[0.3em] ${creditCor}`}>
            Feito com{" "}
            <a
              href="https://seuconviteia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-evt-rosa-ink underline-offset-2 hover:underline"
            >
              seuconviteia
            </a>
          </p>
        )}
      </div>
    </footer>
  );
}
