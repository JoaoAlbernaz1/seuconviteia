// Seu plano (mockup DARK): 3 cards — o atual em destaque teal, o popular em
// violeta. Preços vêm de lib/plans (PLANOS_INFO.preco) e ficam em branco até o
// dono definir (mostramos "Assinatura mensal"). Trocar plano segue o STUB
// existente (sem cobrança real ainda — Mercado Pago depois).
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PLANOS_INFO, rotuloPlano, type Plan } from "@/lib/plans";
import { trocarPlano } from "../../actions";
import { BTN_PRIMARIO, COLUNA, SUB, TITULO } from "../_ui/estilos";

export const dynamic = "force-dynamic";

export default async function PlanoPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const prof = await prisma.professional.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  const atual = (prof?.plan ?? "BASICO") as Plan;

  return (
    <div className={`${COLUNA} scv-fade py-11 pb-20`}>
      <h1 className={`${TITULO} text-[30px]`}>Seu plano</h1>
      <p className={`mt-2 ${SUB}`}>
        Uma assinatura, eventos sem limite. Troque quando quiser — hoje você está
        no <strong className="font-semibold text-scv-ink">{rotuloPlano(atual)}</strong>.
      </p>

      <div className="mt-7 grid items-stretch gap-4 md:grid-cols-3">
        {PLANOS_INFO.map((p) => {
          const ehAtual = p.key === atual;
          const borda = ehAtual
            ? "border-2 border-teal"
            : p.destaque
              ? "border-2 border-violeta shadow-[0_22px_44px_-28px_rgba(109,40,217,0.55)]"
              : "border border-scv-line";
          return (
            <div key={p.key} className={`flex flex-col rounded-[18px] bg-scv-card p-6 ${borda}`}>
              {ehAtual ? (
                <span className="self-start rounded-full bg-teal/10 px-3 py-1 text-[10.5px] font-bold text-scv-teal">
                  Seu plano <i className="bi bi-check-lg" aria-hidden />
                </span>
              ) : p.destaque ? (
                <span className="self-start rounded-full bg-scv-lilac px-3 py-1 text-[10.5px] font-bold text-scv-violet">
                  Mais popular
                </span>
              ) : (
                <span className="self-start rounded-full bg-scv-teal/10 px-3 py-1 text-[10.5px] font-bold text-scv-teal">
                  Para profissionais
                </span>
              )}

              <h2 className="mt-3.5 font-display text-[21px] font-semibold text-scv-ink">
                {p.label}
              </h2>
              {p.preco ? (
                <div
                  className={`mt-2 font-display text-[32px] font-semibold ${
                    p.destaque ? "text-scv-violet" : "text-scv-ink"
                  }`}
                >
                  {p.preco}
                  <span className="font-sans text-[13px] font-medium text-scv-faint">/mês</span>
                </div>
              ) : (
                <div className="mt-2 font-display text-[19px] font-semibold text-scv-muted">
                  Assinatura mensal
                </div>
              )}

              <ul className="mt-4 flex flex-1 flex-col gap-2.5">
                {p.inclui.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[13px] text-scv-text2">
                    <i
                      className={`bi bi-check-lg font-bold ${
                        p.destaque ? "text-scv-violet" : "text-scv-teal"
                      }`}
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>

              {!ehAtual ? (
                <form action={trocarPlano} className="mt-5">
                  <input type="hidden" name="plan" value={p.key} />
                  <button
                    type="submit"
                    className={
                      p.destaque
                        ? `${BTN_PRIMARIO} w-full py-3 text-[13.5px]`
                        : "w-full rounded-[11px] bg-scv-btn py-3 text-[13.5px] font-semibold text-scv-btn-ink transition hover:opacity-90"
                    }
                  >
                    {PLANOS_INFO.findIndex((x) => x.key === p.key) >
                    PLANOS_INFO.findIndex((x) => x.key === atual)
                      ? "Fazer upgrade"
                      : "Mudar para este"}
                  </button>
                </form>
              ) : (
                <div className="mt-5 rounded-[11px] border border-teal/25 py-3 text-center text-[13px] font-semibold text-scv-teal">
                  Ativo agora
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-xs text-scv-faint">
        A troca de plano ainda não cobra de verdade — a assinatura entra com o
        Mercado Pago. O upgrade vale para todos os seus eventos.
      </p>
    </div>
  );
}
