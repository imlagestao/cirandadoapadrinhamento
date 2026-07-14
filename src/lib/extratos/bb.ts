import { parseValorBR, type TransacaoExtraida } from "./tipos";

const DESCRICOES_IGNORADAS = ["Saldo do dia", "Saldo Anterior"];

function anoBom(dataBR: string): boolean {
  return dataBR !== "00/00/0000";
}

function paraIso(dataBR: string): string {
  const [dia, mes, ano] = dataBR.split("/");
  return `${ano}-${mes}-${dia}`;
}

function extraiDescricao(corpo: string, dataBR: string): string {
  const linhas = corpo
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const idxData = linhas.findIndex((l) => l.includes(dataBR));
  if (idxData === -1) return linhas[0] ?? "";

  // A descrição às vezes vem na mesma linha da data (depois do lote e do
  // documento, que são números), às vezes na linha seguinte.
  const restoLinhaData = linhas[idxData]
    .replace(dataBR, "")
    .replace(/^\s*\d+\s*/, "")
    .replace(/^\s*\d+\s*/, "")
    .trim();
  if (restoLinhaData && !/^\d+$/.test(restoLinhaData)) return restoLinhaData;

  for (const linha of linhas.slice(idxData + 1)) {
    if (/^\d{2}\/\d{2}\s+\d{2}:\d{2}/.test(linha)) break;
    if (linha) return linha;
  }
  return "";
}

function extraiNome(corpo: string): string | null {
  const m = corpo.match(/\d{2}\/\d{2}\s+\d{2}:\d{2}\s+(?:\d+\s+)?([\s\S]+)/);
  if (!m) return null;
  const nome = m[1].replace(/\s+/g, " ").trim();
  return nome || null;
}

export function parseExtratoBB(texto: string): TransacaoExtraida[] {
  const transacoes: TransacaoExtraida[] = [];

  const regex = /([\d.,]+)\s*\(([+-])\)([\s\S]*?)(?=[\d.,]+\s*\([+-]\)|$)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(texto)) !== null) {
    const [, valorTexto, sinal, corpo] = match;

    const dataMatch = corpo.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (!dataMatch || !anoBom(dataMatch[1])) continue;

    const descricao = extraiDescricao(corpo, dataMatch[1]);
    if (DESCRICOES_IGNORADAS.some((d) => descricao.includes(d))) continue;

    const valor = parseValorBR(valorTexto);
    if (isNaN(valor) || valor === 0) continue;

    transacoes.push({
      data: paraIso(dataMatch[1]),
      descricao,
      nomeExtraido: extraiNome(corpo),
      valor,
      tipo: sinal === "+" ? "entrada" : "saida",
      chaveUnica: `${dataMatch[1]}|${valorTexto}|${sinal}|${corpo
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120)}`,
    });
  }

  return transacoes;
}
