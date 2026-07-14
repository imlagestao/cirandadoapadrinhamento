import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist carrega um worker relativo a si mesmo; empacotado pelo
  // Turbopack esse caminho quebra. Deixa o Node resolver nativamente.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
