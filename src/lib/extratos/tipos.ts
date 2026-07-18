// Pix fora dessa faixa não costuma ser mensalidade de apadrinhamento (abaixo
// é troco/teste, acima é doação pontual, repasse entre contas, evento etc.)
// — entra direto como ignorado.
export const VALOR_MINIMO_APADRINHAMENTO = 20;
export const VALOR_MAXIMO_APADRINHAMENTO = 400;

export type TransacaoExtraida = {
  data: string; // ISO yyyy-mm-dd
  descricao: string;
  nomeExtraido: string | null;
  valor: number;
  tipo: "entrada" | "saida";
  chaveUnica: string; // usada para montar o hash de deduplicação
};

export function parseValorBR(texto: string): number {
  const limpo = texto.trim().replace(/\./g, "").replace(",", ".");
  return parseFloat(limpo);
}
