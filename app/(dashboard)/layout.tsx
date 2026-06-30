// Layout do grupo (dashboard). Só o fundo da marca (névoa). O "chrome":
//  - /painel/* → shell com sidebar (painel/layout.tsx)
//  - /entrar, /cadastrar → o wordmark vai na própria página (form centrado)
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-nevoa">{children}</div>
  );
}
