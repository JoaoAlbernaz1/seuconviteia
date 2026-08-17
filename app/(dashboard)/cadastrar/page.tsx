// /cadastrar virou a aba "Criar conta" da tela de entrar (mockup DARK).
// O `?plano=` que vem da landing viaja junto: e o que faz a pessoa cair no
// checkout logo depois de criar a conta, sem escolher o plano de novo.
import { redirect } from "next/navigation";

export default async function CadastrarPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string }>;
}) {
  const { plano } = await searchParams;
  redirect(`/entrar?criar=1${plano ? `&plano=${encodeURIComponent(plano)}` : ""}`);
}
