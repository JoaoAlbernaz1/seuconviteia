// Passo 4 do assistente — "Está quase no ar!". Mostra o essencial pronto, os
// blocos opcionais (presentes/fotos/convidados), os recursos do site e a caixa
// de publicar (ou o estado "publicado"), com a prévia real do site ao lado.
import Link from "next/link";
import { prisma } from "@/lib/db";
import { publicarEComemorar } from "@/app/(dashboard)/painel/acoes";
import {
  carregarEventoDono,
  hostDoEvento,
  urlDoEvento,
  previewJsonDoEvento,
  lerCustomStr,
} from "../_carregar";
import { PreviewSite } from "../../_ui/PreviewSite";
import { Stepper, type PassoStepper } from "../../_ui/Stepper";
import { BTN_CARD, BTN_VOLTAR, CARD, COLUNA } from "../../_ui/estilos";

export const dynamic = "force-dynamic";

export default async function PublicarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await carregarEventoDono(id);

  const publicado = event.status === "PUBLISHED";
  const host = hostDoEvento(event.subdomain);
  const base = `/painel/${event.id}`;
  const voltar = `?voltar=${base}/publicar`;

  // "Há convidados?" precisa do total (o _count do carregar conta só CONFIRMED).
  const totalConvidados = await prisma.guest.count({
    where: { eventId: event.id },
  });
  const temFoto =
    Boolean(lerCustomStr(event.customization, "fotoUrl")) || event.photos.length > 0;
  const temPresentes = event.gifts.length > 0;
  const temConvidados = totalConvidados > 0;

  const passos: PassoStepper[] = [
    { label: "Ocasião", estado: "feito" },
    { label: "Estilo", estado: "feito", href: `${base}/estilo${voltar}` },
    { label: "Detalhes", estado: "feito", href: `${base}/detalhes${voltar}` },
    { label: "Publicar", estado: "atual" },
  ];

  const opcionais = [
    {
      icon: "bi-gift",
      titulo: "Lista de presentes (Pix)",
      desc: "Receba com carinho, direto pela sua chave Pix.",
      feito: temPresentes,
      href: `${base}/presentes${voltar}`,
    },
    {
      icon: "bi-image",
      titulo: "Fotos",
      desc: "Uma galeria com os momentos mais bonitos.",
      feito: temFoto,
      href: `${base}/fotos${voltar}`,
    },
    {
      icon: "bi-people",
      titulo: "Convidados",
      desc: "Monte a lista e acompanhe as confirmações.",
      feito: temConvidados,
      href: `${base}/convidados${voltar}`,
    },
  ];

  return (
    <div className={`${COLUNA} scv-fade py-8 pb-20`}>
      {/* stepper */}
      <div className="flex items-center gap-3.5">
        <Link href="/painel" aria-label="Voltar" className={BTN_VOLTAR}>
          <i className="bi bi-chevron-left" aria-hidden />
        </Link>
        <Stepper passos={passos} />
        <span className="w-9 shrink-0" aria-hidden />
      </div>

      {/* título */}
      <div className="mt-10 text-center">
        <h1 className="font-display text-[32px] font-semibold tracking-tight text-scv-ink">
          {publicado ? "Seu site está no ar" : "Está quase no ar!"}
        </h1>
        <p className="mx-auto mt-2.5 max-w-[520px] text-[15px] text-scv-muted">
          {publicado
            ? "Você pode continuar ajustando o site sempre que quiser."
            : "Revise o essencial, complete o que quiser e publique quando estiver pronto."}
        </p>
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ESQUERDA */}
        <div className="flex flex-col gap-3.5">
          {/* essencial */}
          <div className={`${CARD} flex items-center gap-3.5 p-4`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-teal/10 text-teal">
              <i className="bi bi-check-lg text-lg" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-scv-ink">
                O essencial está pronto
              </div>
              <p className="mt-0.5 text-[12.5px] text-scv-muted">
                Ocasião, estilo e detalhes preenchidos
              </p>
            </div>
            <Link
              href={`${base}/detalhes${voltar}`}
              className="shrink-0 text-[13px] font-semibold text-scv-violet transition hover:opacity-80"
            >
              Revisar
            </Link>
          </div>

          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-scv-faint">
            Se quiser, complete agora — ou deixe para depois
          </p>

          {/* opcionais */}
          {opcionais.map((o) => (
            <div key={o.titulo} className={`${CARD} flex items-center gap-3.5 p-4`}>
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-[12px] ${
                  o.feito ? "bg-teal/10 text-teal" : "bg-scv-lilac text-scv-violet"
                }`}
              >
                <i className={`bi ${o.icon} text-lg`} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-semibold text-scv-ink">{o.titulo}</span>
                  <span className="rounded-full bg-scv-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-scv-faint">
                    opcional
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-scv-muted">{o.desc}</p>
              </div>
              <Link
                href={o.href}
                className={
                  o.feito
                    ? "shrink-0 rounded-[10px] border border-teal/40 bg-teal/10 px-4 py-2.5 text-[13px] font-semibold text-teal transition hover:bg-teal/15"
                    : `${BTN_CARD} shrink-0`
                }
              >
                {o.feito ? "Pronto ✓" : "Preencher"}
              </Link>
            </div>
          ))}

          {/* recursos */}
          <div className={`${CARD} flex items-center gap-3.5 p-4`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-scv-lilac text-scv-violet">
              <i className="bi bi-gear text-lg" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-scv-ink">Recursos do site</div>
              <p className="mt-0.5 truncate text-[12.5px] text-scv-muted">
                Confirmação de presença, presentes, contador, mural…
              </p>
            </div>
            <Link href={`${base}/recursos${voltar}`} className={`${BTN_CARD} shrink-0`}>
              Abrir
            </Link>
          </div>

          {/* caixa de publicar */}
          {publicado ? (
            <div className="rounded-2xl border border-teal/25 bg-teal/10 p-6">
              <div className="flex items-center gap-2">
                <i className="bi bi-check-circle-fill text-teal" aria-hidden />
                <h2 className="font-display text-[20px] font-semibold text-scv-ink">
                  Site publicado
                </h2>
              </div>
              <p className="mt-1.5 text-[13px] text-scv-muted">{host}</p>
              <a
                href={urlDoEvento(event.subdomain)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal px-6 py-3 text-[14px] font-semibold text-white transition hover:brightness-110"
              >
                Ver site ↗
              </a>
            </div>
          ) : (
            <div className="rounded-2xl bg-scv-btn p-6 text-scv-btn-ink">
              <h2 className="font-display text-[20px] font-semibold">Publicar o site</h2>
              <p className="mt-1 text-[13px] text-scv-btn-ink/70">
                Seu site vai ficar disponível em
              </p>
              <div className="mt-2.5 rounded-lg bg-black/5 px-3 py-2 text-[13.5px] font-semibold">
                {host}
              </div>
              <form action={publicarEComemorar} className="mt-4">
                <input type="hidden" name="eventId" value={event.id} />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] px-6 py-3.5 text-[14.5px] font-semibold text-white shadow-[0_14px_30px_-12px_rgba(109,40,217,0.7)] transition hover:brightness-110"
                >
                  Publicar meu site
                </button>
              </form>
              <p className="mt-3 text-[11.5px] text-scv-btn-ink/60">
                Publicação incluída no seu plano · você pode editar o site depois
              </p>
            </div>
          )}
        </div>

        {/* DIREITA */}
        <div className="lg:sticky lg:top-[86px]">
          <PreviewSite
            rascunhoJson={previewJsonDoEvento(event)}
            host={host}
            rotulo="Prévia do site"
            altura={560}
          />
          <Link
            href={`${base}/estilo${voltar}`}
            className="mt-3 block w-full rounded-xl border border-dashed border-violeta/50 bg-violeta/5 py-3 text-center text-[13.5px] font-semibold text-scv-violet transition hover:bg-violeta/10"
          >
            Trocar o estilo do site
          </Link>
        </div>
      </div>
    </div>
  );
}
