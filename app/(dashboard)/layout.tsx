// Layout do grupo (dashboard) — painel CLARO (escopo .scv com os tokens do
// painel). O "chrome" (topbar) fica no layout de /painel; /entrar usa so o fundo.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="scv flex min-h-full flex-1 flex-col font-sans antialiased">
      {children}
    </div>
  );
}
