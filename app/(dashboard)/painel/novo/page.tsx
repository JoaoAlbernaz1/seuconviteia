// Criar evento — protegido. Usa o EditorEvento (3 painéis + preview ao vivo) em
// modo "create". As paletas vêm de `lib/temas`; o plano (gating) vem da conta do
// profissional logado. A criação é feita pela server action `criarEvento`.
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { paletasSeletor } from "@/lib/temas";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import EditorEvento, { type PaletaOpt } from "../_editor/EditorEvento";

export const dynamic = "force-dynamic";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
const PALETAS: PaletaOpt[] = paletasSeletor();

export default async function NovoEventoPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const prof = await prisma.professional.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  // O wrapper carrega TODAS as fontes das duplas (next/font) para os cards de
  // "Estilo das letras" e o preview renderizarem com as fontes reais.
  return (
    <div className={EVT_FONTS_CLASS}>
      <EditorEvento
        paletas={PALETAS}
        rootDomain={ROOT_DOMAIN}
        mode="create"
        plan={prof?.plan ?? "BASICO"}
      />
    </div>
  );
}
