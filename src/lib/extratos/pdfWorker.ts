import path from "node:path";
import { pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";

// pdfjs-dist precisa saber onde está o script do worker. Um require.resolve
// (literal ou dinâmico) quebra empacotado pelo Turbopack, então calculamos o
// caminho em runtime a partir de process.cwd() — isso não passa pelo
// empacotador. PDF_WORKER_SRC (.env.local) continua funcionando como
// substituição manual, útil se process.cwd() apontar para o lugar errado.
const workerSrc =
  process.env.PDF_WORKER_SRC ??
  pathToFileURL(
    path.join(
      process.cwd(),
      "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
    ),
  ).href;

PDFParse.setWorker(workerSrc);
