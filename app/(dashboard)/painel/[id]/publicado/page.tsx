// Celebração de publicação — "Está no ar! ✨". Só aparece para eventos já
// publicados (senão volta para "Meus convites"); confete + glows + link pronto
// para copiar e compartilhar no WhatsApp.
import Link from "next/link";
import { redirect } from "next/navigation";
import { carregarEventoDono, hostDoEvento, urlDoEvento } from "../_carregar";
import { CopiarLink } from "../CopiarLink";
import { Confete } from "./Confete";

export const dynamic = "force-dynamic";

export default async function PublicadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await carregarEventoDono(id);
  if (event.status !== "PUBLISHED") redirect("/painel/convites");

  const host = hostDoEvento(event.subdomain);
  const url = urlDoEvento(event.subdomain);
  const zap = `https://wa.me/?text=${encodeURIComponent(
    `Você está convidado para ${event.title}! Confira o site: ${url}`,
  )}`;

  return (
    <div className="relative flex min-h-[calc(100vh-120px)] items-center justify-center overflow-hidden px-4">
      {/* glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-40px] size-[440px] -translate-x-1/2 blur-[70px]"
        style={{
          background: "radial-gradient(circle, rgba(109,40,217,0.38), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-80px] top-1/3 size-[360px] blur-[70px]"
        style={{
          background: "radial-gradient(circle, rgba(45,226,230,0.16), transparent 70%)",
        }}
      />
      <Confete />

      <div className="scv-popin relative z-10 mx-auto w-full max-w-[560px] text-center">
        <span
          className="mx-auto grid size-[86px] place-items-center rounded-full text-white shadow-[0_18px_44px_-14px_rgba(109,40,217,0.6)]"
          style={{ backgroundImage: "var(--grad-faisca)" }}
        >
          <i className="bi bi-check-lg text-[42px]" aria-hidden />
        </span>

        <h1 className="mt-6 font-display text-[46px] font-semibold italic leading-[1.05] tracking-tight text-scv-ink">
          Está no ar!
        </h1>
        <p className="mx-auto mt-3 max-w-[440px] text-[15px] leading-relaxed text-scv-muted">
          O site de <b className="font-semibold text-scv-ink">{event.title}</b> acabou de ser
          publicado. Agora é só espalhar a novidade.
        </p>

        <div className="mx-auto mt-6 flex max-w-[440px] flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-scv-line bg-scv-card px-4 py-2 text-[13px] text-scv-muted">
            {host}
          </span>
          <CopiarLink
            url={url}
            idleLabel="Copiar link"
            className="rounded-full border border-scv-line bg-scv-card px-4 py-2 text-[13px] font-semibold text-scv-ink transition hover:border-scv-dash"
          />
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <a
            href={zap}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-[14px] font-semibold text-white transition hover:brightness-105"
          >
            <i className="bi bi-whatsapp" aria-hidden />
            Compartilhar
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-scv-line bg-scv-card px-6 py-3 text-[14px] font-semibold text-scv-ink transition hover:border-scv-dash"
          >
            Ver meu site ↗
          </a>
        </div>

        <Link
          href={`/painel/${event.id}`}
          className="mt-6 inline-block text-[13.5px] font-semibold text-scv-violet transition hover:opacity-80"
        >
          Acompanhar as confirmações →
        </Link>
      </div>
    </div>
  );
}
