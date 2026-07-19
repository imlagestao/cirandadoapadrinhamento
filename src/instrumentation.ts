// Roda uma única vez, na inicialização do servidor, antes de qualquer
// requisição — é o único jeito confiável de garantir que o polyfill do
// DOMMatrix já exista antes do pdf-parse/pdfjs-dist ser carregado (que é
// feito sob demanda, via "external module", pelo empacotador; colocar o
// polyfill num import comum não garante a ordem certa).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { default: DOMMatrixPolyfill } = await import("@thednp/dommatrix");
    if (typeof globalThis.DOMMatrix === "undefined") {
      // @ts-expect-error - polyfill não implementa 100% da interface DOMMatrix
      globalThis.DOMMatrix = DOMMatrixPolyfill;
    }
  }
}
