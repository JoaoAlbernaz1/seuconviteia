// Ajuda — página simples do dashboard (item "Ajuda" da sidebar). Estilo do
// Claude Design: perguntas frequentes + contato. Renderiza dentro do DashShell.
import Link from "next/link";
import { Ic, IC } from "../_shell/Ic";
// Contato: fonte UNICA, a mesma da landing e dos documentos legais.
// `contato@seuconviteia.com` apontava para um dominio que nao existe.
import { EMPRESA } from "@/app/(marketing)/legal/dados-da-empresa";

const FAQ = [
  {
    q: "Como crio meu convite?",
    a: 'Clique em "Criar meu convite" no topo do painel e siga os passos: conte sobre a festa, personalize os detalhes e publique.',
  },
  {
    q: "Como compartilho o site com os convidados?",
    a: "Depois de publicar, copie o link do seu convite no card “Seu convite” e envie por WhatsApp, Instagram ou onde preferir.",
  },
  {
    q: "O que muda no plano completo?",
    a: "O plano completo libera as confirmações de presença, a contagem de acompanhantes e a lista de presentes escolhidos.",
  },
];

export default function AjudaPage() {
  return (
    <div className="dash-fade mx-auto w-full max-w-[820px] px-4 py-8 sm:px-10 sm:py-9">
      <h1 className="text-[27px] font-bold tracking-[-0.025em]">Ajuda</h1>
      <p className="mt-1.5 text-[14.5px] text-[#6e6e76]">
        Dúvidas comuns sobre o seu convite. Precisa de mais? Fale com a gente.
      </p>

      <div className="mt-7 flex flex-col gap-3">
        {FAQ.map((f) => (
          <div key={f.q} className="rounded-[18px] border border-[#ececf0] bg-white p-6 shadow-[0_2px_10px_rgba(23,23,27,0.04)]">
            <div className="text-[15px] font-bold tracking-[-0.01em]">{f.q}</div>
            <div className="mt-1.5 text-[13.5px] leading-[1.55] text-[#6e6e76]">{f.a}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-5 rounded-[20px] border border-[#ececf0] bg-[linear-gradient(115deg,#FFFFFF_55%,#F8F5FF)] px-7 py-6 shadow-[0_2px_10px_rgba(23,23,27,0.04)]">
        <span className="grid size-[46px] flex-none place-items-center rounded-[14px] bg-[linear-gradient(140deg,#F3EFFE,#E7DDFC)]">
          <Ic d={IC.mail} size={19} stroke="#7C3AED" />
        </span>
        <div className="min-w-[220px] flex-1">
          <div className="text-[15px] font-bold tracking-[-0.01em]">Ainda com dúvida?</div>
          <div className="mt-1 text-[13px] text-[#6e6e76]">
            Nossa equipe responde rapidinho para você não travar nos preparativos.
          </div>
        </div>
        <a
          href={`mailto:${EMPRESA.email}`}
          className="flex-none rounded-xl bg-[#7C3AED] px-[18px] py-2.5 text-[13.5px] font-semibold !text-white transition-colors hover:bg-[#6D28D9]"
        >
          Falar com o suporte
        </a>
      </div>

      <div className="mt-6">
        <Link href="/painel" className="text-[13.5px] font-semibold text-[#7C3AED]">
          ← Voltar ao dashboard
        </Link>
      </div>
    </div>
  );
}
