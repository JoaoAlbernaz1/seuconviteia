"use client";

// MOLDURAS DE APARELHO das prévias do painel — iPhone e MacBook desenhados em px
// "de projeto" (bezel, Dynamic Island, notch, base de alumínio, janela do Safari).
//
// A TELA é o `children`: quem usa enfia ali o que quiser (o double-buffer de
// iframes do PreviewSite, um iframe único no editor). As medidas são exportadas
// porque a coluna escala o aparelho INTEIRO com um `transform: scale(fit)` — em
// px de projeto as proporções ficam certas em qualquer largura.
//
// - iPhone: viewport de 390px -> o convite cai no layout de CELULAR de verdade.
// - MacBook: viewport de 1024px (breakpoint `lg`) -> layout de COMPUTADOR, ainda
//   legível quando a coluna encolhe (a 1280 as letras ficavam minúsculas).

export type Aparelho = "iphone" | "mac";

export const VIEWPORT_PHONE = 390; // celular real — o site responde como mobile
export const PHONE_SCREEN_H = 844; // tela do iPhone (390x844 ~ 19.5:9) — ALTO e FINO
export const PHONE_BEZEL = 12; // bezel fino e uniforme
export const VIEWPORT_MAC = 1024; // desktop real (lg) — o site cai no layout de computador
export const MAC_BAR = 40; // barra do Safari (bolinhas + endereço)
export const MAC_SITE_H = 600; // altura útil do site (tela 16:10 ≈ 1024×640 = BAR + SITE_H)
export const MAC_BEZEL = 10; // aro preto ao redor da tela
export const MAC_BEZEL_BOT = 12; // "queixo" um tico maior
export const MAC_HINGE = 8; // dobradiça
export const MAC_BASE = 18; // base de alumínio (vista de frente)
export const MAC_OVERHANG = 56; // a base é mais larga que a tela

/** Tamanho do aparelho INTEIRO em px de projeto (entra no cálculo da escala). */
export function dimensoesDoAparelho(device: Aparelho): { largura: number; altura: number } {
  if (device === "iphone") {
    return { largura: VIEWPORT_PHONE + PHONE_BEZEL * 2, altura: PHONE_SCREEN_H + PHONE_BEZEL * 2 };
  }
  return {
    largura: VIEWPORT_MAC + MAC_BEZEL * 2 + MAC_OVERHANG,
    altura: MAC_BAR + MAC_SITE_H + MAC_BEZEL + MAC_BEZEL_BOT + MAC_HINGE + MAC_BASE,
  };
}

/** iPhone realista — proporcao 390x844 (alto e fino, como um iPhone de verdade). */
export function IphoneFrame({ children }: { children: React.ReactNode }) {
  const BEZEL = PHONE_BEZEL;
  const bodyW = VIEWPORT_PHONE + BEZEL * 2;
  const bodyH = PHONE_SCREEN_H + BEZEL * 2;
  return (
    <div className="relative" style={{ width: bodyW, height: bodyH }}>
      {/* botoes laterais (esquerda: silencioso + volume; direita: power) */}
      <span className="absolute -left-[3px] top-[92px] h-6 w-[3px] rounded-l bg-[#1b1b1f]" />
      <span className="absolute -left-[3px] top-[132px] h-12 w-[3px] rounded-l bg-[#2a2a2f]" />
      <span className="absolute -left-[3px] top-[196px] h-12 w-[3px] rounded-l bg-[#2a2a2f]" />
      <span className="absolute -right-[3px] top-[160px] h-16 w-[3px] rounded-r bg-[#2a2a2f]" />

      {/* corpo (titanio) */}
      <div
        className="absolute inset-0 bg-[linear-gradient(150deg,#42424a,#1c1c20_38%,#26262c)] shadow-[0_40px_80px_-28px_rgba(0,0,0,0.65)]"
        style={{ borderRadius: 56, padding: BEZEL }}
      >
        {/* tela */}
        <div
          className="relative size-full overflow-hidden bg-white"
          style={{ borderRadius: 44 }}
        >
          {children}
          {/* Dynamic Island */}
          <div className="pointer-events-none absolute left-1/2 top-2 h-[30px] w-[112px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
            <span className="absolute right-3.5 top-1/2 size-2 -translate-y-1/2 rounded-full bg-[#0b0b14] shadow-[inset_0_0_0_1px_rgba(90,110,150,0.5)]" />
          </div>
          {/* barra de home */}
          <div className="pointer-events-none absolute bottom-2 left-1/2 h-[5px] w-[128px] -translate-x-1/2 rounded-full bg-black/30" />
        </div>
      </div>
    </div>
  );
}

/** MacBook realista com janela do Safari dentro. `host` vai na barra de endereço. */
export function MacFrame({ children, host }: { children: React.ReactNode; host: string }) {
  const winH = MAC_BAR + MAC_SITE_H; // tela 16:10
  const lidW = VIEWPORT_MAC + MAC_BEZEL * 2;
  const lidH = winH + MAC_BEZEL + MAC_BEZEL_BOT;
  const baseW = lidW + MAC_OVERHANG;

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: baseW, height: lidH + MAC_HINGE + MAC_BASE }}
    >
      {/* tampa (tela) — vidro preto com aro fino de alumínio */}
      <div
        className="relative bg-[#050506] shadow-[0_44px_70px_-34px_rgba(0,0,0,0.7),inset_0_0_0_2px_#42454b,inset_0_0_0_3.5px_#0c0c0e]"
        style={{
          width: lidW,
          height: lidH,
          borderRadius: "22px 22px 5px 5px",
          paddingTop: MAC_BEZEL,
          paddingLeft: MAC_BEZEL,
          paddingRight: MAC_BEZEL,
          paddingBottom: MAC_BEZEL_BOT,
        }}
      >
        {/* notch da câmera */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 flex h-[13px] w-[124px] -translate-x-1/2 items-start justify-center rounded-b-[7px] bg-[#050506]">
          <span className="mt-[3px] size-[5px] rounded-full bg-[#0e1116] shadow-[inset_0_0_0_1px_rgba(90,110,150,0.45)]" />
        </div>
        {/* janela do Safari */}
        <div className="relative size-full overflow-hidden rounded-[6px] bg-white">
          {/* barra: bolinhas de trânsito + endereço */}
          <div
            className="flex items-center gap-2 border-b border-[#e4e6ea] bg-[linear-gradient(#f7f8fa,#eef0f2)] px-4"
            style={{ height: MAC_BAR }}
          >
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.14)]" />
              <span className="size-3 rounded-full bg-[#febc2e] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.14)]" />
              <span className="size-3 rounded-full bg-[#28c840] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.14)]" />
            </span>
            <span className="mx-auto flex h-[27px] max-w-[58%] items-center gap-1.5 truncate rounded-lg bg-white px-3 text-[13px] text-[#5f6672] shadow-[inset_0_0_0_1px_#e6e8ec]">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                className="shrink-0 opacity-70"
                aria-hidden
              >
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              <span className="truncate">{host}</span>
            </span>
            <span className="w-[52px] shrink-0" aria-hidden />
          </div>
          {/* conteúdo (site em layout desktop) */}
          <div className="relative" style={{ height: MAC_SITE_H }}>
            {children}
          </div>
        </div>
      </div>

      {/* dobradiça */}
      <div
        className="bg-[linear-gradient(#4a4d53,#26282c)] shadow-[inset_0_1px_0_rgba(255,255,255,0.09)]"
        style={{ width: lidW, height: MAC_HINGE }}
      />
      {/* base de alumínio (mais larga, com o recorte central) */}
      <div
        className="relative bg-[linear-gradient(180deg,#e6e8ec,#b8bcc3_58%,#989ca4)] shadow-[0_24px_34px_-20px_rgba(0,0,0,0.6)]"
        style={{
          width: baseW,
          height: MAC_BASE,
          borderRadius: "3px 3px 12px 12px",
        }}
      >
        <span className="absolute left-1/2 top-0 h-[7px] w-[118px] -translate-x-1/2 rounded-b-[9px] bg-[#9296a0]" />
      </div>
    </div>
  );
}
