// Criar evento — protegido. Monta as opcoes de paleta (a partir de `lib/temas`)
// no servidor e delega o formulario rico ao client `EventoForm`, passando a
// server action `criarEvento`. O `professionalId` vem da sessao (na action).
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TEMAS } from "@/lib/temas";
import { criarEvento } from "../../actions";
import EventoForm, { type PaletaOpt } from "./EventoForm";

export const dynamic = "force-dynamic";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

// Swatch de cada paleta: 4 cores (forte -> clara) + o ink, para o seletor visual.
const PALETAS: PaletaOpt[] = Object.values(TEMAS).map((t) => ({
  key: t.key,
  label: t.label,
  dots: [
    t.vars["--ev-framboesa"],
    t.vars["--ev-rosa"],
    t.vars["--ev-blush"],
    t.vars["--ev-ink"],
  ],
}));

export default async function NovoEventoPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  return (
    <EventoForm
      paletas={PALETAS}
      rootDomain={ROOT_DOMAIN}
      action={criarEvento}
      mode="create"
    />
  );
}
