// Gerenciar plano (assinatura). Mostra o plano atual e os 3 planos; trocar é um
// STUB (sem cobrança real ainda). Os recursos da festa liberam pelo plano.
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PLANOS_INFO, rotuloPlano, type Plan } from "@/lib/plans";
import { trocarPlano } from "../../actions";

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
    <main className="mx-auto w-full max-w-4xl px-5 py-7 sm:px-8 sm:py-9">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        Seu plano
      </h1>
      <p className="mt-1 text-sm text-texto-suave">
        Plano atual: <strong className="text-ink">{rotuloPlano(atual)}</strong>.
        Eventos e publicação incluídos — sem cobrança por site.
      </p>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {PLANOS_INFO.map((p) => {
          const ehAtual = p.key === atual;
          return (
            <div
              key={p.key}
              className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${
                p.destaque ? "border-violeta/40 ring-1 ring-violeta/20" : "border-black/5"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-ink">
                  {p.label}
                </h2>
                {p.destaque ? (
                  <span className="rounded-full bg-violeta/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-violeta">
                    Popular
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-texto-suave">{p.descricaoCurta}</p>
              <ul className="mt-4 flex flex-1 flex-col gap-1.5">
                {p.inclui.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-xs text-ink"
                  >
                    <i className="bi bi-check2 mt-0.5 text-teal" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                {ehAtual ? (
                  <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-lilas px-4 py-2.5 text-sm font-semibold text-violeta">
                    <i className="bi bi-check-circle-fill" aria-hidden /> Plano atual
                  </span>
                ) : (
                  <form action={trocarPlano}>
                    <input type="hidden" name="plan" value={p.key} />
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-gradient-to-r from-teal to-violeta px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
                    >
                      Mudar para {p.label}
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-xs text-texto-suave">
        A cobrança da assinatura ainda não está ligada — trocar de plano aqui é
        uma simulação para você testar os recursos por nível.
      </p>
    </main>
  );
}
