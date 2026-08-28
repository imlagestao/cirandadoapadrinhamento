// Categoria do que aconteceu numa atualização — usada tanto no formulário
// manual (botões de seleção) quanto no filtro da lista de Atualizações.
export type Situacao =
  | "novo_padrinho"
  | "novo_afilhado"
  | "desistencia"
  | "migracao_atualizacao"
  | "financeiro";

export const SITUACOES: { valor: Situacao; label: string; cor: string }[] = [
  { valor: "novo_padrinho", label: "Novo padrinho/madrinha", cor: "brand-blue" },
  { valor: "novo_afilhado", label: "Novo afilhado(a)", cor: "brand-green" },
  { valor: "desistencia", label: "Desistência", cor: "red" },
  { valor: "migracao_atualizacao", label: "Migração/Atualização", cor: "amber" },
  { valor: "financeiro", label: "Financeiro", cor: "brand-pink" },
];

const MAPA = new Map(SITUACOES.map((s) => [s.valor, s]));

export function situacaoInfo(valor: string | null): { label: string; cor: string } | null {
  if (!valor) return null;
  return MAPA.get(valor as Situacao) ?? null;
}
