import { Flourish } from "@/components/evt/icons";

/**
 * SectionHeading — eyebrow (Jost caixa-alta, rosa) + heading serif (script Milton,
 * que aceita acentos PT). Divisor: filigrana rosa delicada. `align` left/center.
 */
export function SectionHeading({
  eyebrow,
  title,
  align = "center",
  withRule = true,
  className = "",
  liveEyebrow,
  liveTitle,
}: {
  eyebrow?: string;
  title: string;
  align?: "center" | "left";
  withRule?: boolean;
  className?: string;
  /** Chaves `data-live` — a previa do editor troca este texto sem recarregar. */
  liveEyebrow?: string;
  liveTitle?: string;
}) {
  const left = align === "left";
  return (
    <div className={`${left ? "text-left" : "text-center"} ${className}`}>
      {eyebrow && <p data-live={liveEyebrow} className="eyebrow text-evt-rosa-ink">{eyebrow}</p>}
      <h2
        data-live={liveTitle}
        className={`font-evt-script leading-[1.04] text-[calc(clamp(3.4rem,10vw,4.8rem)*var(--ev-fonte-fator,1))] text-evt-ink ${
          eyebrow ? "mt-3" : ""
        }`}
      >
        {title}
      </h2>
      {withRule && (
        <div
          className={`mt-5 flex items-center ${left ? "justify-start" : "justify-center"}`}
          aria-hidden
        >
          <Flourish className="h-4 w-24 text-evt-rosa" />
        </div>
      )}
    </div>
  );
}
