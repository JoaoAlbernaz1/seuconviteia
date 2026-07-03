// Rota antiga — a grade agora é a própria home "Meus eventos" (mockup DARK).
import { redirect } from "next/navigation";

export default function Redireciona() {
  redirect("/painel");
}
