import { parseValorBR, type TransacaoExtraida } from "./tipos";

function paraIso(dataBR: string): string {
  const [dia, mes, ano] = dataBR.split("-");
  return `${ano}-${mes}-${dia}`;
}

export function parseExtratoMercadoPago(texto: string): TransacaoExtraida[] {
  const transacoes: TransacaoExtraida[] = [];

  const regex =
    /(\d{2}-\d{2}-\d{4})([\s\S]*?)(\d{9,15})\s+R\$\s*(-?[\d.,]+)\s+R\$\s*(-?[\d.,]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(texto)) !== null) {
    const [, dataBR, blocoDescricao, idOperacao, valorTexto] = match;

    const descricao = blocoDescricao.replace(/\s+/g, " ").trim();
    if (!descricao) continue;

    const valor = parseValorBR(valorTexto);
    if (isNaN(valor) || valor === 0) continue;

    // "Pix recebido X" e "Transferência Pix recebida X" (a redação varia
    // conforme o mês/versão do extrato) significam a mesma coisa.
    let nomeExtraido: string | null = null;
    const recebido = descricao.match(
      /^(?:Transferência\s+)?Pix\s*recebid[oa]\s+(.+)/i,
    );
    const enviado = descricao.match(
      /^(?:Transferência\s+)?Pix\s*enviad[oa]\s+(.+)/i,
    );
    if (recebido) nomeExtraido = recebido[1].trim();
    else if (enviado) nomeExtraido = enviado[1].trim();

    transacoes.push({
      data: paraIso(dataBR),
      descricao,
      nomeExtraido,
      valor,
      tipo: valor >= 0 ? "entrada" : "saida",
      chaveUnica: idOperacao,
    });
  }

  return transacoes;
}
