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
};

export default nextConfig;
