import { normalizaNome } from "@/lib/nomes";

export type SugestaoPadrinho = { id: string; nome: string; score: number };

export function normalizaParaComparacao(nome: string): string {
  return normalizaNome(nome).replace(/[^A-Z ]/g, "");
}

// Extratos truncam nomes (BB) ou os escrevem por completo (Mercado Pago).
// Considera candidato quando um dos nomes é prefixo do outro. Se já existe um
// apelido aprendido (confirmado manualmente antes) para esse nome exato,
// ele vem primeiro, com 100% de confiança.
export function sugerirPadrinhos(
  nomeExtraido: string,
  padrinhos: { id: string; nome: string }[],
  apelidos: Map<string, string> = new Map(),
): SugestaoPadrinho[] {
  const alvo = normalizaParaComparacao(nomeExtraido);
  if (!alvo) return [];

  const padrinhoApelido = apelidos.get(alvo);
  if (padrinhoApelido) {
    const p = padrinhos.find((p) => p.id === padrinhoApelido);
    if (p) return [{ id: p.id, nome: p.nome, score: 1 }];
  }

  const sugestoes: SugestaoPadrinho[] = [];
  for (const p of padrinhos) {
    const nomeNormalizado = normalizaParaComparacao(p.nome);
    let score = 0;
    if (nomeNormalizado === alvo) {
      score = 1;
    } else if (
      nomeNormalizado.startsWith(alvo) ||
      alvo.startsWith(nomeNormalizado)
    ) {
      const menor = Math.min(nomeNormalizado.length, alvo.length);
      const maior = Math.max(nomeNormalizado.length, alvo.length);
      score = menor / maior;
    }
    if (score > 0.5) {
      sugestoes.push({ id: p.id, nome: p.nome, score });
    }
  }

  return sugestoes.sort((a, b) => b.score - a.score).slice(0, 3);
}
