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
