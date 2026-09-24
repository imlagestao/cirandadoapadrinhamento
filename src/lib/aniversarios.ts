import { createClient } from "@/lib/supabase/server";

export const MESES_NOME = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// `nascimento` vem do Postgres como "AAAA-MM-DD" — extrai sem passar por
// Date (evita problema de fuso mudando o dia).
function diaMes(nascimento: string): { dia: number; mes: number } {
  const [, mes, dia] = nascimento.split("-").map(Number);
  return { dia, mes };
}

export type PadrinhoAniversariante = {
  id: string;
  nome: string;
  whatsapp: string | null;
  dia: number;
  afilhados: string[];
};

export type CriancaAniversariante = {
  id: string;
  nome: string;
  turma: string | null;
  dia: number;
  padrinhos: { id: string; nome: string; whatsapp: string | null }[];
};

export type Aniversariantes = {
  mes: number;
  padrinhos: PadrinhoAniversariante[];
  criancas: CriancaAniversariante[];
};

export async function getAniversariantesDoMes(
  mes: number,
): Promise<Aniversariantes> {
  const supabase = await createClient();

  type PadrinhoRow = {
    id: string;
    nome: string;
    whatsapp: string | null;
    nascimento: string;
    apadrinhamentos: { criancas: { nome: string } | null }[] | null;
  };

  type CriancaRow = {
    id: string;
    nome: string;
    turma: string | null;
    nascimento: string;
    apadrinhamentos:
      | { padrinhos: { id: string; nome: string; whatsapp: string | null } | null }[]
      | null;
  };

  const [{ data: padrinhosData }, { data: criancasData }] = await Promise.all([
    supabase
      .from("padrinhos")
      .select("id, nome, whatsapp, nascimento, apadrinhamentos(criancas(nome))")
      .eq("status", "ativo")
      .not("nascimento", "is", null),
    supabase
      .from("criancas")
      .select(
        "id, nome, turma, nascimento, apadrinhamentos(padrinhos(id, nome, whatsapp))",
      )
      .eq("status", "matriculado")
      .not("nascimento", "is", null),
  ]);

  const padrinhos = ((padrinhosData ?? []) as unknown as PadrinhoRow[])
    .map((p) => ({ ...p, ...diaMes(p.nascimento) }))
    .filter((p) => p.mes === mes)
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      whatsapp: p.whatsapp,
      dia: p.dia,
      afilhados: (p.apadrinhamentos ?? [])
        .map((a) => a.criancas?.nome)
        .filter((n): n is string => Boolean(n)),
    }))
    .sort((a, b) => a.dia - b.dia);

  const criancas = ((criancasData ?? []) as unknown as CriancaRow[])
    .map((c) => ({ ...c, ...diaMes(c.nascimento) }))
    .filter((c) => c.mes === mes)
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      turma: c.turma,
      dia: c.dia,
      padrinhos: (c.apadrinhamentos ?? [])
        .map((a) => a.padrinhos)
        .filter((p): p is { id: string; nome: string; whatsapp: string | null } =>
          Boolean(p),
        ),
    }))
    .sort((a, b) => a.dia - b.dia);

  return { mes, padrinhos, criancas };
}
