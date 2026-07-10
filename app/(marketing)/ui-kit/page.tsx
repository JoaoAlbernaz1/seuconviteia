import type { Metadata } from "next";
import { UiKitDemo } from "@/components/ui/UiKitDemo";

export const metadata: Metadata = {
  title: "Design System — seuconviteia",
  robots: { index: false, follow: false },
};

// Pagina interna de referencia do design system (localhost:3000/ui-kit).
export default function UiKitPage() {
  return (
    <main className="min-h-screen bg-ui-bg text-ui-ink">
      <UiKitDemo />
    </main>
  );
}
