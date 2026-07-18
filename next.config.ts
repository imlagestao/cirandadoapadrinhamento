import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist carrega um worker relativo a si mesmo; empacotado pelo
  // Turbopack esse caminho quebra. Deixa o Node resolver nativamente.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // O caminho do worker (pdfWorker.ts) é montado em runtime, não via
  // import/require estático — o rastreador de arquivos do Next não o vê
  // sozinho, então precisa ser incluído manualmente para ir no deploy.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
};

export default nextConfig;
