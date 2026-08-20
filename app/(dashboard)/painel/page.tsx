// Home do PAINEL — réplica fiel do Claude Design "seuconvite - Dashboard".
// Saudação + CTA, hero "começa aqui" (3 passos), resumo (bloqueado no plano de
// entrada / com números no plano completo) e o card "Seu convite" (com anel de
// progresso enquanto ele é rascunho) — tudo ligado ao convite em destaque (o
// mais recente) do usuário.
//
// O card "Seu convite" pergunta o ESTADO (`lib/estadoConvite`), não o status do
// banco. Perguntando ao status, esta tela — a primeira depois de entrar — dizia
// "Publicado", em verde e com 100% no anel, para o convite que o dono tinha
// tirado do ar e para a festa que já tinha acontecido; e o menu oferecia
// "Tirar do ar" a quem já estava fora do ar.
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { eventPublicUrl, rootDomain } from "@/lib/tenant";
import { TIPO_LABEL } from "@/lib/painelUi";
import { ESTADO_LABEL, estadoDoConvite } from "@/lib/estadoConvite";
import { planoEfetivo, podeCriarEvento, SELECT_ASSINATURA } from "@/lib/plans";
import { Ic, IC } from "./_shell/Ic";
import { CopyLinkButton, ConviteMenu } from "./_shell/ConviteMenu";

export const dynamic = "force-dynamic";

const ROOT_DOMAIN = rootDomain();

const DATA_LONGA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "long",
  year: "numeric",
});
const HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});
const DMY = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function lerCustomStr(c: unknown, k: string): string | undefined {
  if (c && typeof c === "object" && k in c) {
    const v = (c as Record<string, unknown>)[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

const PASSOS = [
  { d: IC.calendar, n: "PASSO 1", t: "Conte sobre a festa", s: "Nome, data, horário e local" },
  { d: IC.pencil, n: "PASSO 2", t: "Personalize os detalhes", s: "Fotos, cores e mensagens" },
  { d: IC.send, n: "PASSO 3", t: "Publique e compartilhe", s: "Envie o link aos convidados" },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const uid = session.user.id;

  const [prof, evento] = await Promise.all([
    prisma.professional.findUnique({
      where: { id: uid },
      select: { ...SELECT_ASSINATURA, name: true },
    }),
    prisma.event.findFirst({
      where: { professionalId: uid },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { gifts: true, guests: true, photos: true } } },
    }),
  ]);

  const agora = new Date();
  const primeiro = (prof?.name ?? "").split(" ")[0] || "você";
  // Plano EFETIVO: assinatura vencida volta a valer como Básico.
  const plano = prof ? planoEfetivo(prof, agora) : "BASICO";
  const planoPago = plano !== "BASICO";
  const temConvite = !!evento;

  // Números reais do convite em destaque.
  let confirmadas = 0;
  let acompanhantes = 0;
  let presentes = 0;
  if (evento) {
    const [c, ag, p] = await Promise.all([
      prisma.guest.count({ where: { eventId: evento.id, status: "CONFIRMED" } }),
      prisma.guest.aggregate({ _sum: { companions: true }, where: { eventId: evento.id, status: "CONFIRMED" } }),
      prisma.giftItem.count({ where: { eventId: evento.id, purchased: true } }),
    ]);
    confirmadas = c;
    acompanhantes = ag._sum.companions ?? 0;
    presentes = p;
  }

  // Convite em destaque — derivados.
  const estado = evento ? estadoDoConvite(evento, agora) : null;
  const rascunho = estado === "rascunho";
  const kicker = evento ? (TIPO_LABEL[evento.type] ?? evento.type) : "";
  const local = evento ? lerCustomStr(evento.customization, "local") : undefined;
  const fotoUrl = evento ? lerCustomStr(evento.customization, "fotoUrl") : undefined;
  const linkFull = evento ? eventPublicUrl(evento.subdomain, ROOT_DOMAIN) : "";
  const linkLabel = evento ? `${evento.subdomain}.${ROOT_DOMAIN}` : "";
  const dataLonga = evento ? DATA_LONGA.format(evento.eventDate) : "";
  const hora = evento ? HORA.format(evento.eventDate) : "";
  const dataPontos = evento ? DMY.format(evento.eventDate).replace(/\//g, " · ") : "";

  // Progresso do rascunho (o anel só vive ali): heurística por preenchimento.
  const feitos = evento
    ? [!!fotoUrl, evento._count.gifts > 0, evento._count.guests > 0, !!local].filter(Boolean).length
    : 0;
  // Vaga no plano — perguntada sempre que ja existe um convite, porque o CTA do
  // topo oferece COMECAR outro em qualquer estado do convite em destaque
  // (inclusive rascunho: terminar o que esta la e trabalho do card).
  const podeCriarOutro =
    !!evento &&
    podeCriarEvento(
      plano,
      await prisma.event.count({
        where: { professionalId: uid, expiresAt: { gt: agora } },
      }),
    );

  // O CTA do topo COMEÇA coisa; o botão do card CUIDA do convite que já existe.
  // Ele levava ao editor com qualquer convite — e, quando a edição passou a ser
  // fechada depois de publicar (`lib/edicao`), virou "Gerenciar convite": o
  // mesmo rótulo, a mesma cor e o mesmo destino do botão do card, duas vezes na
  // mesma tela. A mesma duplicata sobrevivia no RASCUNHO ("Continuar edição"
  // nos dois, mesmo violeta, mesmo `/painel/criar?id=`), o que era pior do que
  // ter o problema nos dois estados: a tela resolvia num e repetia no outro.
  // Por isso a divisão de nível não tem exceção — o topo é o cabeçalho da
  // CONTA, o card é o do CONVITE.
  //
  // Sem vaga no plano ele NÃO some — é a regra que a lista, o seletor da topbar
  // e a tela do convite já seguem ("ele não some, ele DIZ o que falta"): sumir
  // deixa a pessoa procurando onde clicar, e o Dashboard é a porta de entrada.
  // O empate de violeta com a faixa "Desbloquear recursos" se resolve por
  // HIERARQUIA (este vira contorno), não por ausência — até porque as duas
  // ofertas são diferentes: a faixa vende RECURSOS, este aqui vende ESCALA.
  //
  // ⚠️ INVARIANTE não testado: hoje "sem vaga" implica Básico (`limiteEventos`
  // só limita o Básico) e Básico implica a faixa bloqueada logo abaixo. Se um
  // dia o Clássico ganhar teto, este ramo aparece SEM a faixa por perto — e aí
  // ele pode (deve) voltar a ser violeta, porque não haverá violeta com quem
  // brigar.
  const cta = !evento
    ? { href: "/painel/criar", label: "Criar meu convite", icone: IC.plus, forte: true }
    : podeCriarOutro
      ? { href: "/painel/criar", label: "Novo convite", icone: IC.plus, forte: true }
      : { href: "/painel/plano", label: "Mais convites", icone: IC.lock, forte: false };

  // O anel mede MONTAGEM, e montagem só está acontecendo no rascunho: publicado
  // ele marcava sempre 100% (o site está montado), um círculo mudo ao lado do
  // botão — enfeite para quem enxerga e, pior, um `aria-label` que contava ao
  // leitor de tela mais do que a tela mostrava. Por isso ele agora só existe no
  // rascunho, e ali é sempre violeta (o cinza saiu junto com o resto).
  const pct = Math.min(90, 35 + feitos * 14);
  // A legenda diz o PROGRESSO — "Quase pronto" a 35% era elogio falso.
  const legendaAnel = pct >= 77 ? "Quase pronto" : pct >= 49 ? "Em andamento" : "Começando";
  const C = 2 * Math.PI * 35;
  const dashOff = (C * (1 - pct / 100)).toFixed(1);

  return (
    <div className="dash-fade mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-10 sm:py-9">
      {/* HEADER */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[27px] font-bold tracking-[-0.025em]">Olá, {primeiro}!</h1>
          <p className="mt-1.5 text-[14.5px] text-[#6e6e76]">
            Continue preparando uma noite inesquecível.
          </p>
        </div>
        {/* `!text-...` nos dois: `.dash :where(a…)` declara `color` fora das
            @layer do Tailwind e vence a utility — sem o `!`, o rótulo do
            contorno chega violeta na tela. */}
        <Link
          href={cta.href}
          className={
            cta.forte
              ? "flex min-h-[44px] items-center gap-2.5 rounded-[13px] bg-[#7C3AED] px-[22px] py-3 text-[14.5px] font-semibold !text-white transition-colors hover:bg-[#6D28D9]"
              : "flex min-h-[44px] items-center gap-2.5 rounded-[13px] border border-[#ececf0] bg-white px-[22px] py-3 text-[14.5px] font-semibold !text-[#17171b] transition-colors hover:bg-[#f4f4f6]"
          }
        >
          <Ic d={cta.icone} size={15} stroke={cta.forte ? "#fff" : "#17171B"} width={2} />
          {cta.label}
        </Link>
      </div>

      {/* HERO — começa aqui */}
      <div className="mb-[22px] rounded-[22px] border border-[#ececf0] bg-[linear-gradient(115deg,#FFFFFF_45%,#F3EFFE)] p-7 shadow-[0_2px_10px_rgba(23,23,27,0.04)] sm:p-10">
        <div className="text-[28px] font-extrabold leading-[1.18] tracking-[-0.03em] sm:text-[32px]">
          Seu grande momento
          <br />
          <span className="text-[#7C3AED]">começa aqui</span>
        </div>
        <p className="mb-7 mt-3 text-[15px] text-[#6e6e76]">
          Crie o site dos seus 15 anos em poucos passos.
        </p>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:gap-0">
          {PASSOS.map((p, i) => (
            <div key={p.n} className="contents">
              <div className="flex-1 rounded-[18px] border border-[#ececf0] bg-white p-5 shadow-[0_1px_4px_rgba(23,23,27,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#DCCDFB] hover:shadow-[0_10px_24px_rgba(124,58,237,0.10)]">
                <div className="mb-3.5 flex items-center justify-between">
                  <span className="grid size-[38px] place-items-center rounded-xl bg-[linear-gradient(140deg,#F3EFFE,#E7DDFC)]">
                    <Ic d={p.d} size={17} stroke="#7C3AED" />
                  </span>
                  <span className="text-[10.5px] font-bold tracking-[0.1em] text-[#B7A4EC]">{p.n}</span>
                </div>
                <div className="text-sm font-bold tracking-[-0.01em]">{p.t}</div>
                <div className="mt-1 text-[12.5px] leading-[1.45] text-[#6e6e76]">{p.s}</div>
              </div>
              {i < PASSOS.length - 1 && (
                <div className="hidden w-[26px] flex-none items-center justify-center sm:flex">
                  <Ic d={IC.chevronRight} size={14} stroke="#C9C9D2" width={2.2} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {temConvite && evento ? (
        <>
          {/* RESUMO */}
          {planoPago ? (
            <div className="mb-[30px] flex flex-col rounded-[20px] border border-[#ececf0] bg-white shadow-[0_2px_10px_rgba(23,23,27,0.04)] sm:flex-row">
              <StatCol
                d={IC.checkCircle}
                rotulo="Confirmações recebidas"
                valor={confirmadas}
                href={`/painel/${evento.id}/convidados`}
                borda
              />
              <StatCol
                d={IC.usersSimple}
                rotulo="Acompanhantes confirmados"
                valor={acompanhantes}
                href={`/painel/${evento.id}/convidados`}
                borda
              />
              {/* Vai para "Recebimentos" e nao para a tela de editar a lista:
                  aquela tela morreu na Task 11 (gravava onde o convite
                  publicado nao le). Quem responde "quais presentes escolheram?"
                  e o extrato "Quem ja presenteou" do cofre. */}
              <StatCol
                d={IC.gift}
                rotulo="Presentes escolhidos"
                valor={presentes}
                href={`/painel/${evento.id}/cofre`}
              />
            </div>
          ) : (
            <div className="mb-[30px] flex flex-wrap items-center gap-5 rounded-[20px] border border-[#ececf0] bg-[linear-gradient(115deg,#FFFFFF_55%,#F8F5FF)] px-7 py-6 shadow-[0_2px_10px_rgba(23,23,27,0.04)]">
              <span className="grid size-[46px] flex-none place-items-center rounded-[14px] bg-[linear-gradient(140deg,#F3EFFE,#E7DDFC)]">
                <Ic d={IC.lock} size={19} stroke="#7C3AED" />
              </span>
              <div className="min-w-[220px] flex-1">
                <div className="text-[15px] font-bold tracking-[-0.01em]">
                  Confirmações e presentes são do plano completo
                </div>
                <div className="mt-1 text-[13px] text-[#6e6e76]">
                  Desbloqueie para acompanhar quem confirmou presença, acompanhantes e presentes escolhidos.
                </div>
              </div>
              <div className="hidden select-none gap-6 blur-[6px] md:flex" aria-hidden>
                {[
                  ["48", "confirmações"],
                  ["31", "acompanhantes"],
                  ["23", "presentes"],
                ].map(([n, l]) => (
                  <div key={l} className="text-center">
                    <div className="text-2xl font-extrabold">{n}</div>
                    <div className="text-[11px] text-[#6e6e76]">{l}</div>
                  </div>
                ))}
              </div>
              <Link
                href="/painel/plano"
                className="flex-none rounded-xl bg-[#7C3AED] px-[18px] py-2.5 text-[13.5px] font-semibold !text-white transition-colors hover:bg-[#6D28D9]"
              >
                Desbloquear recursos
              </Link>
            </div>
          )}

          {/* SEU CONVITE */}
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <span className="text-[17px] font-bold tracking-[-0.01em]">Seu convite</span>
            <Link href="/painel/convites" className="text-[13px] font-semibold text-[#7C3AED] hover:text-[#6D28D9]">
              Ver todos os convites →
            </Link>
          </div>
          <div className="flex flex-col items-start gap-6 rounded-[20px] border border-[#ececf0] bg-white p-[22px] shadow-[0_2px_10px_rgba(23,23,27,0.04)] lg:flex-row lg:items-center">
            {/* mini-preview */}
            <div className="relative flex h-[126px] w-full flex-none flex-col items-center justify-center gap-1 overflow-hidden rounded-[14px] bg-[linear-gradient(150deg,#1a1426,#3b2a63_70%,#7C3AED)] lg:w-[210px]">
              <div className="text-[7px] uppercase tracking-[0.32em] text-[#C4B5FD]">{kicker}</div>
              <div className="max-w-[85%] truncate px-2 font-[family-name:var(--font-playfair)] text-[22px] text-white">
                {evento.title}
              </div>
              <div className="text-[8px] text-white/65">{dataPontos}</div>
            </div>

            {/* infos */}
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-3">
                <div className="text-[16.5px] font-bold tracking-[-0.01em]">{evento.title}</div>
                {/* Mesmas quatro palavras da lista e da tela do convite
                    (`ESTADO_LABEL`), e o mesmo cinza cheio do selo apagado —
                    pelo TOKEN (`--scv-muted`, via `.scv` do layout do grupo),
                    e não por hex copiado que fica para trás quando ele mudar. */}
                <span
                  className={`rounded-full px-3 py-1 text-[11.5px] font-bold ${
                    estado === "no-ar"
                      ? "bg-[#34A177]/[0.12] text-[#2E8A66]"
                      : rascunho
                        ? "bg-[#F3EFFE] text-[#7C3AED]"
                        : "bg-scv-muted text-white"
                  }`}
                >
                  {estado ? ESTADO_LABEL[estado] : ""}
                </span>
              </div>
              <div className="text-[13.5px] text-[#6e6e76]">
                {local ? `${local} · ` : ""}
                {dataLonga}
                {hora && hora !== "00:00" ? ` • ${hora}` : ""}
              </div>
              <div className="mt-3.5 flex flex-wrap items-center gap-3.5">
                <div className="flex items-center gap-2.5 rounded-[10px] border border-[#ececf0] bg-[#f4f4f6] px-3.5 py-2">
                  <a
                    href={linkFull}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12.5px] font-semibold text-[#7C3AED]"
                  >
                    {linkLabel}
                  </a>
                  {/* Mesmo motivo do menu: com a festa encerrada, copiar poe
                      na area de transferencia um link que responde "acabou". */}
                  {estado === "encerrada" ? null : <CopyLinkButton url={linkFull} />}
                </div>
                {planoPago ? (
                  <div className="flex items-center gap-1.5 text-[13px] text-[#6e6e76]">
                    <Ic d={IC.usersSimple} size={14} stroke="#6E6E76" />
                    {confirmadas} confirmaç{confirmadas === 1 ? "ão" : "ões"}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-full border border-[#ececf0] bg-[#f4f4f6] px-3 py-1.5 text-[12.5px] text-[#8b8b93]">
                    <Ic d={IC.lock} size={12} stroke="#8B8B93" width={2} />
                    Confirmações no plano completo
                  </div>
                )}
              </div>
            </div>

            {/* Progresso circular — SÓ no rascunho. Publicado, ele marcava
                sempre 100%: um círculo mudo ao lado do botão, que não respondia
                a nenhuma pergunta que o selo já não respondesse. Aqui o número
                anda, e a legenda embaixo diz em palavras o mesmo que ele — por
                isso nem `role="img"` nem `aria-label`: o leitor de tela lê a
                mesma coisa que a tela mostra, nem mais nem menos. */}
            {rascunho ? (
              <div className="flex-none px-2 text-center">
                <div className="relative size-[84px]">
                  <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden>
                    <circle cx="42" cy="42" r="35" fill="none" stroke="#F0F0F3" strokeWidth="8" />
                    <circle
                      cx="42"
                      cy="42"
                      r="35"
                      fill="none"
                      stroke="#7C3AED"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={C.toFixed(1)}
                      strokeDashoffset={dashOff}
                      transform="rotate(-90 42 42)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[17px] font-extrabold tracking-[-0.02em]">
                    {pct}%
                  </div>
                </div>
                <div className="mt-1.5 text-xs font-medium text-[#6e6e76]">{legendaAnel}</div>
              </div>
            ) : null}

            {/* ações */}
            <ConviteMenu url={linkFull} fid={evento.id} estado={estado ?? "rascunho"} />
          </div>
        </>
      ) : (
        /* ESTADO VAZIO */
        <div className="rounded-[20px] border border-[#ececf0] bg-white px-10 py-14 text-center shadow-[0_2px_10px_rgba(23,23,27,0.04)]">
          <span className="mx-auto mb-5 grid size-[58px] place-items-center rounded-full bg-[#F3EFFE]">
            <Ic d={IC.mail} size={24} stroke="#7C3AED" width={1.8} />
          </span>
          <div className="text-xl font-bold tracking-[-0.02em]">Você ainda não começou seu convite</div>
          <div className="mx-auto mt-2 max-w-md text-sm text-[#6e6e76]">
            Preencha as informações da festa e veja seu site ganhar vida.
          </div>
          <Link
            href="/painel/criar"
            className="mt-6 inline-block rounded-[13px] bg-[#7C3AED] px-[26px] py-3.5 text-[14.5px] font-semibold !text-white transition-colors hover:bg-[#6D28D9]"
          >
            Criar meu convite
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCol({
  d,
  rotulo,
  valor,
  href,
  borda,
}: {
  d: string;
  rotulo: string;
  valor: number;
  href: string;
  borda?: boolean;
}) {
  return (
    <div className={`flex flex-1 items-start gap-4 px-7 py-6 ${borda ? "sm:border-r sm:border-[#f0f0f3]" : ""}`}>
      <span className="mt-0.5 grid size-[42px] flex-none place-items-center rounded-[13px] bg-[linear-gradient(140deg,#F3EFFE,#E7DDFC)]">
        <Ic d={d} size={18} stroke="#7C3AED" />
      </span>
      <div>
        <div className="text-[13px] font-medium text-[#6e6e76]">{rotulo}</div>
        <div className="my-1 text-[30px] font-extrabold tracking-[-0.03em]">{valor}</div>
        <Link href={href} className="text-[12.5px] font-semibold text-[#7C3AED]">
          Ver detalhes →
        </Link>
      </div>
    </div>
  );
}
