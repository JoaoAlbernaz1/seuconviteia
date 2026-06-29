// Destino interno do rewrite do middleware para subdominios de evento.
// O middleware reescreve `<sub>.seuconviteia.com` -> `/_sites/<sub>`.
// (A pasta no disco usa `%5F` — forma URL-safe do "_" — para que o segmento
// publico seja `/_sites` sem virar uma "private folder" do App Router.)
// Renderizacao real do site do evento chega na Fase 5.
export default async function EventSitePage({
  params,
}: {
  params: Promise<{ sub: string }>;
}) {
  const { sub } = await params;
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl font-semibold text-ink">
        Site do evento (Fase 5)
      </h1>
      <p className="mt-3 text-texto-suave">
        Subdominio: <span className="font-medium text-violeta">{sub}</span>
      </p>
    </main>
  );
}
