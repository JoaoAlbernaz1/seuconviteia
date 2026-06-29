import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Fixa a raiz do workspace neste projeto. Sem isso, o Next pode inferir
  // a raiz a partir de um lockfile no diretorio home (ex.: ~/package-lock.json).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
