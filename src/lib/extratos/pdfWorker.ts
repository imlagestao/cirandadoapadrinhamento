import { PDFParse } from "pdf-parse";

// Turbopack não consegue resolver dinamicamente o caminho do worker do
// pdfjs-dist em código empacotado (qualquer require.resolve, literal ou
// dinâmico, quebra em build). O caminho real é calculado uma vez e guardado
// em PDF_WORKER_SRC (.env.local) — ler uma env var não passa pelo
// empacotador, então funciona.
if (process.env.PDF_WORKER_SRC) {
  PDFParse.setWorker(process.env.PDF_WORKER_SRC);
}
