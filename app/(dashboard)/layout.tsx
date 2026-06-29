// Layout do painel do profissional (servido em app.seuconviteia.com).
// Estrutura real (auth, navegacao, sidebar) chega na Fase 4.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
