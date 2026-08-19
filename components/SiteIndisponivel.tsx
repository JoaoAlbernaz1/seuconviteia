import type { MotivoIndisponivel } from "@/lib/event";

// Pagina amigavel e com a marca para quando um site de evento nao pode ser
// exibido. Server Component (sem interatividade) e sem movimento essencial —
// nada que precise de "prefers-reduced-motion".
const CONTEUDO: Record<MotivoIndisponivel, { titulo: string; texto: string }> = {
  inexistente: {
    titulo: "Convite nao encontrado",
    texto:
      "Nao encontramos um convite neste endereco. Confira se o link esta correto e tente novamente.",
  },
  expirado: {
    titulo: "Este convite expirou",
    texto:
      "O periodo de exibicao deste convite chegou ao fim. Fale com quem te convidou para mais informacoes.",
  },
  rascunho: {
    titulo: "Convite ainda nao publicado",
    texto:
      "Este convite esta sendo preparado com carinho e ainda nao foi publicado. Volte em breve.",
  },
  "fora-do-ar": {
    titulo: "Convite fora do ar",
    texto:
      "Quem organiza a festa tirou este convite do ar por enquanto. Volte mais tarde ou fale com quem te convidou.",
  },
};

export default function SiteIndisponivel({
  motivo,
}: {
  motivo: MotivoIndisponivel;
}) {
  const { titulo, texto } = CONTEUDO[motivo];

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-nevoa px-6 py-20 text-center">
      <div className="w-full max-w-md">
        <span className="font-sans text-sm font-semibold tracking-wide text-texto-suave">
          Seu<span className="text-gradient">Convite</span> IA
        </span>

        <div
          aria-hidden
          className="mx-auto mt-8 h-px w-16 bg-gradient-to-r from-turquesa via-teal to-violeta"
        />

        <h1 className="mt-8 font-display text-3xl font-semibold text-ink sm:text-4xl">
          {titulo}
        </h1>
        <p className="mt-4 text-texto-suave">{texto}</p>
      </div>
    </main>
  );
}
