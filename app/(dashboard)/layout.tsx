// Layout do grupo (dashboard) — aplica o TEMA do painel (mockup DARK).
// Escuro e o padrao; o toggle da topbar grava o cookie `scv_theme` e o SSR ja
// renderiza com o tema certo (sem flash). O "chrome" (topbar) fica no layout
// de /painel; /entrar usa so o fundo.
import { cookies } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const light = jar.get("scv_theme")?.value === "light";

  return (
    <div
      className="scv flex min-h-full flex-1 flex-col font-sans antialiased"
      data-theme={light ? "light" : undefined}
    >
      {children}
    </div>
  );
}
