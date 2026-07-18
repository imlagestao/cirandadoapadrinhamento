import { parseValorBR, type TransacaoExtraida } from "./tipos";

function paraIso(dataBR: string): string {
  const [dia, mes, ano] = dataBR.split("-");
  return `${ano}-${mes}-${dia}`;
}

// Textos de rodapé/cabeçalho que o PDF repete a cada página e que, quando a
// transação cai numa quebra de página, acabam entrando NO MEIO da descrição
// capturada (ex: descrição termina em "...Transferência Pix recebida Niraildes
// e de Jesus" só porque o rodapé ficou colado entre um pedaço do nome e o
// outro). Removemos esse boilerplate antes de casar as transações, para que
// a descrição de uma transação partida ao meio volte a ficar contígua.
function removeBoilerplate(texto: string): string {
  return texto
    .replace(/Data de geração:\s*\d{2}-\d{2}-\d{4}/gi, "")
    .replace(
      /Você tem alguma dúvida\?[\s\S]*?protocolo do primeiro atendimento\./gi,
      "",
    )
    .replace(
      /Mercado Pago Instituição de Pagamento[\s\S]*?mercadopago\.com\.br/gi,
      "",
    )
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "")
    .replace(/^\d{1,2}\/\d{1,2}$/gm, "")
    .replace(/Data Descrição ID da operação Valor Saldo/gi, "");
}

export function parseExtratoMercadoPago(textoOriginal: string): TransacaoExtraida[] {
  const transacoes: TransacaoExtraida[] = [];
  const texto = removeBoilerplate(textoOriginal);

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
    // conforme o mês/versão do extrato) significam a mesma coisa. Quando a
    // transação cai numa quebra de página do PDF, texto de rodapé/cabeçalho
    // do extrato entra ANTES desse trecho — por isso o padrão não pode ficar
    // ancorado no início da string (`^`), senão nunca casa nesses casos.
    let nomeExtraido: string | null = null;
    const recebido = descricao.match(
      /(?:Transferência\s+)?Pix\s*recebid[oa]\s+(.+)/i,
    );
    const enviado = descricao.match(
      /(?:Transferência\s+)?Pix\s*enviad[oa]\s+(.+)/i,
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
