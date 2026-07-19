import path from "node:path";
import { pathToFileURL } from "node:url";
import DOMMatrixPolyfill from "@thednp/dommatrix";
import { PDFParse } from "pdf-parse";

// Em Node (fora do navegador), o pdfjs-dist tenta carregar `@napi-rs/canvas`
// (um binário nativo) só pra conseguir um `DOMMatrix`. Esse binário nativo
// não fica disponível em ambientes serverless como a Vercel — sem ele, a
// extração de texto quebra com "DOMMatrix is not defined". Como só usamos
// extração de texto (nunca renderizamos o PDF), um polyfill em JS puro
// resolve sem depender de binário nenhum.
if (typeof globalThis.DOMMatrix === "undefined") {
  // @ts-expect-error - polyfill não implementa 100% da interface DOMMatrix
  globalThis.DOMMatrix = DOMMatrixPolyfill;
}

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
