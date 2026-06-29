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
}: {
  eyebrow?: string;
  title: string;
  align?: "center" | "left";
  withRule?: boolean;
  className?: string;
}) {
  const left = align === "left";
  return (
    <div className={`${left ? "text-left" : "text-center"} ${className}`}>
      {eyebrow && <p className="eyebrow text-evt-rosa-ink">{eyebrow}</p>}
      <h2
        className={`font-evt-script leading-[1.04] text-[clamp(3.4rem,10vw,4.8rem)] text-evt-ink ${
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
