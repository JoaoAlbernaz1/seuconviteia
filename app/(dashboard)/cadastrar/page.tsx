// /cadastrar virou a aba "Criar conta" da tela de entrar (mockup DARK).
import { redirect } from "next/navigation";

export default function CadastrarPage() {
  redirect("/entrar?criar=1");
}
