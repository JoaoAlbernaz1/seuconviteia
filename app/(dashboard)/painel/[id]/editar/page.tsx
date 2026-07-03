// O editor de painéis foi substituído pelas telas focadas do painel DARK.
import { redirect } from "next/navigation";

export default async function Redireciona({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/painel/${id}/detalhes`);
}
