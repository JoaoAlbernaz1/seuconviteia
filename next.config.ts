import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // O indicador de dev do Next fica no canto inferior-ESQUERDO por padrao, em
  // cima do card de plano da sidebar. Move pro canto inferior-direito (so dev).
  devIndicators: { position: "bottom-right" },
  // Fixa a raiz do workspace neste projeto. Sem isso, o Next pode inferir
  // a raiz a partir de um lockfile no diretorio home (ex.: ~/package-lock.json).
  turbopack: {
    root: __dirname,
  },
  // Cabeçalhos de segurança. Aplicam a TUDO: painel e sites de convite.
  //
  // `SAMEORIGIN` (e não `DENY`) é obrigatório: o editor mostra o convite num
  // iframe de mesma origem (`/previa-convite` dentro de `/painel/criar`) —
  // `DENY` mataria a prévia inteira.
  //
  // HSTS com `includeSubDomains` cobre os sites de convidado
  // (`*.seuconvite.orivya.com.br`), todos em HTTPS na Vercel. Sem `preload`,
  // que é um compromisso difícil de desfazer.
  //
  // CSP fica de fora de propósito: o Next injeta script inline e as fotos vêm
  // do Blob; uma política escrita no escuro quebraria o site. É tarefa própria.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
