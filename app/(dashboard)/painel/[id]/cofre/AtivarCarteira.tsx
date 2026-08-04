"use client";

// Ativação da CARTEIRA (modelo Wedy): o cofre nasce TRANCADO — um cartão com
// CADEADO "Ativar carteira". Clicar abre um FORMULÁRIO em modal, em 3 passos:
// 1) Dados pessoais (nome, CPF, nascimento, celular, ocupação);
// 2) Endereço (CEP, endereço, cidade, UF);
// 3) Recebimento (chave Pix). Concluir chama a server action `ativarCarteira`
// e a tela recarrega com a carteira ativa (resgate liberado).
import { useState, useTransition } from "react";
import { ativarCarteira } from "@/lib/cofre";
import { cpfValido, soDigitos } from "@/lib/carteira";
import { INPUT, LABEL } from "../../_ui/estilos";

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

/** Máscara visual de CPF enquanto digita (000.000.000-00). */
function fmtCpf(v: string): string {
  const d = soDigitos(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

/** Máscara visual de celular ((61) 99999-0000). */
function fmtCel(v: string): string {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
}

/** Máscara visual de CEP (00000-000). */
function fmtCep(v: string): string {
  const d = soDigitos(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

const TITULOS = ["Dados pessoais", "Endereço", "Recebimento"] as const;

export function AtivarCarteira({ eventId }: { eventId: string }) {
  const [aberto, setAberto] = useState(false);
  const [passo, setPasso] = useState<1 | 2 | 3>(1);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Passo 1 — dados pessoais
  const [titular, setTitular] = useState("");
  const [cpf, setCpf] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [celular, setCelular] = useState("");
  const [ocupacao, setOcupacao] = useState("");
  // Passo 2 — endereço
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  // Passo 3 — recebimento
  const [pixKey, setPixKey] = useState("");
  const [pixName, setPixName] = useState("");

  function fechar() {
    setAberto(false);
    setPasso(1);
    setErro(null);
  }

  function avancar() {
    if (passo === 1) {
      if (titular.trim().split(/\s+/).length < 2) return setErro("Informe seu nome completo.");
      if (!cpfValido(cpf)) return setErro("Esse CPF não parece válido — confira os números.");
      if (!nascimento) return setErro("Informe a sua data de nascimento.");
      const cel = soDigitos(celular);
      if (cel.length < 10 || cel.length > 11) return setErro("Informe um celular com DDD.");
      if (ocupacao.trim().length < 2) return setErro("Informe a sua ocupação.");
    }
    if (passo === 2) {
      if (soDigitos(cep).length !== 8) return setErro("Informe um CEP válido.");
      if (logradouro.trim().length < 3) return setErro("Informe o endereço (rua e número).");
      if (cidade.trim().length < 2) return setErro("Informe a cidade.");
      if (!uf) return setErro("Escolha o estado.");
    }
    setErro(null);
    setPasso((p) => (p === 1 ? 2 : 3));
  }

  function concluir() {
    if (pixKey.trim().length < 3) return setErro("Informe a sua chave Pix.");
    setErro(null);
    const fd = new FormData();
    fd.set("eventId", eventId);
    fd.set("titular", titular.trim());
    fd.set("cpf", cpf);
    fd.set("nascimento", nascimento);
    fd.set("celular", celular);
    fd.set("ocupacao", ocupacao.trim());
    fd.set("cep", cep);
    fd.set("logradouro", logradouro.trim());
    fd.set("cidade", cidade.trim());
    fd.set("uf", uf);
    fd.set("pixKey", pixKey.trim());
    if (pixName.trim()) fd.set("pixName", pixName.trim());
    start(async () => {
      const e = await ativarCarteira(fd);
      if (e) setErro(e);
    });
  }

  return (
    <>
      {/* ── Cartão TRANCADO (cadeado) ── */}
      <div className="rounded-[15px] border border-scv-line p-4 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-scv-lilac text-scv-violet">
          <i className="bi bi-lock-fill text-[20px]" aria-hidden />
        </span>
        <div className="mt-2.5 text-[14.5px] font-bold text-scv-ink">Carteira bloqueada</div>
        <p className="mx-auto mt-1 max-w-[250px] text-[12px] leading-snug text-scv-muted">
          Para receber o dinheiro dos presentes, ative sua carteira — leva menos de 2 minutos.
        </p>
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="mt-3.5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[11px] bg-violeta px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:brightness-110"
        >
          <i className="bi bi-unlock" aria-hidden />
          Ativar carteira
        </button>
        <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-scv-faint">
          <i className="bi bi-shield-check" aria-hidden />
          Seus dados ficam só aqui, nunca aparecem no site do convite.
        </p>
      </div>

      {/* ── MODAL do formulário ── */}
      {aberto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Fechar"
            tabIndex={-1}
            onClick={fechar}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Ativar carteira"
            className="scv-popin relative flex max-h-[92dvh] w-full max-w-[460px] flex-col overflow-hidden rounded-2xl bg-scv-card shadow-[0_32px_80px_-24px_rgba(15,23,42,0.45)]"
          >
            {/* topo */}
            <div className="flex items-center gap-3 border-b border-scv-line px-5 py-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-scv-lilac text-scv-violet">
                <i className="bi bi-wallet2 text-[17px]" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold text-scv-ink">Ativar carteira</div>
                <div className="text-[11.5px] text-scv-muted">
                  Passo {passo} de 3 · {TITULOS[passo - 1]}
                </div>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={fechar}
                className="grid size-8 cursor-pointer place-items-center rounded-full text-scv-faint transition-colors hover:bg-scv-field hover:text-scv-ink"
              >
                <i className="bi bi-x-lg text-[14px]" aria-hidden />
              </button>
            </div>
            {/* progresso */}
            <div className="flex gap-1 px-5 pt-3" aria-hidden>
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={`h-1.5 flex-1 rounded-full ${passo >= n ? "bg-violeta" : "bg-scv-soft"}`}
                />
              ))}
            </div>

            {/* corpo */}
            <div className="flex flex-col gap-3 overflow-y-auto px-5 py-4">
              {passo === 1 ? (
                <>
                  <div>
                    <label className={LABEL} htmlFor="ct-titular">Nome completo</label>
                    <input id="ct-titular" value={titular} onChange={(e) => setTitular(e.target.value)}
                      placeholder="Igual ao documento" maxLength={120} className={`${INPUT} text-[13.5px]`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL} htmlFor="ct-cpf">CPF</label>
                      <input id="ct-cpf" value={cpf} onChange={(e) => setCpf(fmtCpf(e.target.value))}
                        placeholder="000.000.000-00" inputMode="numeric" className={`${INPUT} text-[13.5px]`} />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="ct-nasc">Nascimento</label>
                      <input id="ct-nasc" type="date" value={nascimento}
                        onChange={(e) => setNascimento(e.target.value)} className={`${INPUT} text-[13.5px]`} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL} htmlFor="ct-cel">Celular</label>
                      <input id="ct-cel" value={celular} onChange={(e) => setCelular(fmtCel(e.target.value))}
                        placeholder="(61) 99999-0000" inputMode="numeric" className={`${INPUT} text-[13.5px]`} />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="ct-ocup">Ocupação</label>
                      <input id="ct-ocup" value={ocupacao} onChange={(e) => setOcupacao(e.target.value)}
                        placeholder="Ex.: cerimonialista" maxLength={80} className={`${INPUT} text-[13.5px]`} />
                    </div>
                  </div>
                </>
              ) : passo === 2 ? (
                <>
                  <div className="grid grid-cols-[130px_1fr] gap-3">
                    <div>
                      <label className={LABEL} htmlFor="ct-cep">CEP</label>
                      <input id="ct-cep" value={cep} onChange={(e) => setCep(fmtCep(e.target.value))}
                        placeholder="00000-000" inputMode="numeric" className={`${INPUT} text-[13.5px]`} />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="ct-cidade">Cidade</label>
                      <input id="ct-cidade" value={cidade} onChange={(e) => setCidade(e.target.value)}
                        placeholder="Sua cidade" maxLength={80} className={`${INPUT} text-[13.5px]`} />
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_110px] gap-3">
                    <div>
                      <label className={LABEL} htmlFor="ct-end">Endereço</label>
                      <input id="ct-end" value={logradouro} onChange={(e) => setLogradouro(e.target.value)}
                        placeholder="Rua, número e complemento" maxLength={160} className={`${INPUT} text-[13.5px]`} />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="ct-uf">Estado</label>
                      <select id="ct-uf" value={uf} onChange={(e) => setUf(e.target.value)}
                        className={`${INPUT} text-[13.5px]`}>
                        <option value="">UF</option>
                        {UFS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className={LABEL} htmlFor="ct-pix">Chave Pix</label>
                    <input id="ct-pix" value={pixKey} onChange={(e) => setPixKey(e.target.value)}
                      placeholder="CPF, e-mail, telefone ou chave aleatória" maxLength={140}
                      className={`${INPUT} text-[13.5px]`} />
                  </div>
                  <div>
                    <label className={LABEL} htmlFor="ct-pixnome">Nome na conta (opcional)</label>
                    <input id="ct-pixnome" value={pixName} onChange={(e) => setPixName(e.target.value)}
                      placeholder={titular || "Como aparece na sua conta"} maxLength={120}
                      className={`${INPUT} text-[13.5px]`} />
                  </div>
                  <p className="flex items-start gap-1.5 text-[11.5px] leading-snug text-scv-faint">
                    <i className="bi bi-info-circle mt-0.5" aria-hidden />
                    O resgate cai nessa chave. Você pode trocar depois, quando quiser.
                  </p>
                </>
              )}

              {erro ? (
                <p className="rounded-[10px] bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-700">
                  {erro}
                </p>
              ) : null}
            </div>

            {/* rodapé */}
            <div className="flex items-center gap-2.5 border-t border-scv-line px-5 py-4">
              <button
                type="button"
                onClick={() => (passo === 1 ? fechar() : (setPasso((p) => (p === 3 ? 2 : 1)), setErro(null)))}
                className="cursor-pointer rounded-[11px] border border-scv-line bg-scv-card px-4 py-2.5 text-[13px] font-semibold text-scv-ink transition-colors hover:bg-scv-field"
              >
                {passo === 1 ? "Cancelar" : "Voltar"}
              </button>
              {passo < 3 ? (
                <button
                  type="button"
                  onClick={avancar}
                  className="flex-1 cursor-pointer rounded-[11px] bg-violeta px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:brightness-110"
                >
                  Continuar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={concluir}
                  disabled={pending}
                  className="flex-1 cursor-pointer rounded-[11px] bg-violeta px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {pending ? "Ativando…" : "Concluir ativação"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
