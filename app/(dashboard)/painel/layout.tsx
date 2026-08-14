// Layout do PAINEL — shell do Claude Design (sidebar escura + topbar). Protege
// a área: sem sessão volta para /entrar. Passa ao shell o nome/e-mail reais e a
// LISTA de convites (o shell tem um seletor de convite ativo — quem tem vários
// escolhe qual está gerenciando; Convidados/Presentes/Recebimentos o seguem).
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { DashShell } from "./_shell/DashShell";
import { recursosDoSite } from "@/lib/recursos";

export const dynamic = "force-dynamic";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const [prof, convites] = await Promise.all([
    prisma.professional.findUnique({
      where: { id: session.user.id },
      // `plan` entra aqui porque o menu esconde abas conforme o que o plano
      // libera (ver lib/navPainel + lib/recursos).
      select: { name: true, email: true, plan: true },
    }),
    prisma.event.findMany({
      where: { professionalId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, customization: true },
    }),
  ]);

  const plano = prof?.plan ?? "BASICO";
  const nome = prof?.name ?? session.user.name ?? "";
  const email = prof?.email ?? session.user.email ?? "";

  return (
    <DashShell
      nome={nome}
      email={email}
      convites={convites.map((c) => {
        // Recursos ATIVOS do convite = plano permite ∩ liga/desliga do evento.
        const r = recursosDoSite(plano, c.customization);
        return {
          id: c.id,
          title: c.title,
          noAr: c.status === "PUBLISHED",
          rsvp: r.rsvp,
          presentes: r.presentes,
        };
      })}
    >
      {children}
    </DashShell>
  );
}
