// Layout dos sites publicos de evento (servidos por subdominio, ex.: ana.seuconviteia.com).
// O middleware reescreve cada subdominio para a renderizacao do site do evento.
// Tema/branding por evento e renderizacao real chegam na Fase 5.
export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
