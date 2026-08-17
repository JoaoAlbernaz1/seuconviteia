"use client";

// Tela de MODELO — o que aparece antes do editor quando o convite é novo.
//
// Hoje existe UM modelo pronto (15 anos "Glamour Rosé", o site da Maria Clara).
// Fingir uma vitrine com vários faria a pessoa procurar o que não existe: esta
// tela conta a verdade, mostra o modelo e diz o que vem por aí (pedido do João,
// 17/08). Quando o segundo modelo entrar, a lista "em breve" vira escolha real.
import { CapaEvento } from "../_ui/CapaEvento";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";

/** Modelos ainda em produção — aparecem apagados, só para dar o horizonte. */
const EM_BREVE = [
  { nome: "Casamento", desc: "Clássico e elegante", tema: "dourado" },
  { nome: "Aniversário", desc: "Adulto, sóbrio", tema: "azul" },
  { nome: "Bodas", desc: "Comemoração a dois", tema: "verde" },
];

export function EscolherModelo({ nome, onComecar }: { nome: string; onComecar: () => void }) {
  return (
    <div className={`mx-auto w-full max-w-[820px] px-5 py-10 ${EVT_FONTS_CLASS}`}>
      <span className="inline-flex items-center gap-2 rounded-full border border-[#DCCDFB] bg-[#F6F3FE] px-3 py-1 text-[12px] font-semibold text-[#6D28D9]">
        Por enquanto temos 1 modelo
      </span>
      <h1 className="mt-4 text-[26px] font-bold tracking-[-0.02em] text-[#17171B]">Escolha o modelo do convite</h1>
      <p className="mt-2 max-w-[560px] text-[14px] leading-relaxed text-[#6e6e76]">
        Estamos criando novos modelos. Este é o que está pronto — e ele é todo seu para
        personalizar: foto, cores, letras, textos, lista de presentes, galeria e recados.
      </p>

      <div className="mt-7 overflow-hidden rounded-[20px] border border-[#ECECF0] bg-white shadow-[0_2px_10px_rgba(23,23,27,0.04)]">
        <CapaEvento tema="rose" fontes="classica" nome={nome || "Seu nome"} kicker="Meus 15 anos" altura={220} />
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-bold text-[#17171B]">15 anos · Glamour Rosé</span>
              <span className="rounded-full bg-[#EAF7F0] px-2 py-0.5 text-[11px] font-bold text-[#2E8A66]">Disponível</span>
            </div>
            <p className="mt-1 text-[13px] text-[#6e6e76]">
              Capa com foto, contagem regressiva, convite, programação, confirmação de presença,
              presentes e mural de recados.
            </p>
          </div>
          <button
            type="button"
            onClick={onComecar}
            className="cursor-pointer rounded-xl bg-[#7C3AED] px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#6D28D9]"
          >
            Usar este modelo
          </button>
        </div>
      </div>

      <div className="mt-8 text-[13px] font-semibold text-[#3F3F46]">Em produção — chegam em breve</div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {EM_BREVE.map((m) => (
          <div key={m.nome} className="overflow-hidden rounded-[16px] border border-[#ECECF0] bg-white opacity-60">
            <CapaEvento tema={m.tema} fontes="classica" nome={m.nome} altura={104} />
            <div className="p-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[13.5px] font-bold text-[#17171B]">{m.nome}</span>
                <span className="rounded-full bg-[#F4F4F6] px-2 py-0.5 text-[10.5px] font-semibold text-[#8b8b93]">Em breve</span>
              </div>
              <p className="mt-0.5 text-[12px] text-[#6e6e76]">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
