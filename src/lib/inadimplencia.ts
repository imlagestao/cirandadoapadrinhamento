import { createClient } from "@/lib/supabase/server";

export type PadrinhoInadimplente = {
  id: string;
  nome: string;
  whatsapp: string | null;
  email: string | null;
  criancas: string[];
};

export type ResumoInadimplencia = {
  ano: number;
  mes: number;
  totalAtivos: number;
  pagaram: number;
  inadimplentes: PadrinhoInadimplente[];
};

export async function getResumoInadimplencia(
  ano: number,
  mes: number,
): Promise<ResumoInadimplencia> {
  const supabase = await createClient();

  const [{ data: padrinhos }, { data: mensalidadesPagas }] = await Promise.all([
    supabase
      .from("padrinhos")
      .select(
        "id, nome, whatsapp, email, apadrinhamentos(criancas(nome))",
      )
      .eq("status", "ativo")
      .order("nome"),
    supabase
      .from("mensalidades")
      .select("padrinho_id")
      .eq("ano", ano)
      .eq("mes", mes)
      .eq("pago", true),
  ]);

  const idsQuePagaram = new Set(
    (mensalidadesPagas ?? []).map((m) => m.padrinho_id as string),
  );

  type PadrinhoRow = {
    id: string;
    nome: string;
    whatsapp: string | null;
    email: string | null;
    apadrinhamentos: { criancas: { nome: string } | null }[] | null;
  };

  const listaPadrinhos = (padrinhos ?? []) as unknown as PadrinhoRow[];

  const inadimplentes = listaPadrinhos
    .filter((p) => !idsQuePagaram.has(p.id))
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      whatsapp: p.whatsapp,
      email: p.email,
      criancas: (p.apadrinhamentos ?? [])
        .map((a) => a.criancas?.nome)
        .filter((n): n is string => Boolean(n)),
    }));

  return {
    ano,
    mes,
    totalAtivos: listaPadrinhos.length,
    pagaram: listaPadrinhos.length - inadimplentes.length,
    inadimplentes,
  };
}

export type MesChave = { ano: number; mes: number };

export type LinhaGradeAdimplencia = {
  id: string;
  nome: string;
  whatsapp: string | null;
  pagamentos: boolean[]; // mesmo índice de `meses`
  totalPago: number;
  mesesSeguidosSemPagar: number; // contando a partir do mês mais recente
};

export type GradeAdimplencia = {
  meses: MesChave[];
  linhas: LinhaGradeAdimplencia[];
};

// Todos os padrinhos ativos x todos os meses com dados de extrato — visão
// completa de quem está em dia e quem está devendo há quanto tempo.
export async function getGradeAdimplencia(): Promise<GradeAdimplencia> {
  const supabase = await createClient();

  const hoje = new Date();

  const [{ data: padrinhos }, { data: transacoesDatas }, { data: mensalidadesPagas }] =
    await Promise.all([
      supabase
        .from("padrinhos")
        .select("id, nome, whatsapp")
        .eq("status", "ativo")
        .order("nome"),
      supabase.from("transacoes").select("data").eq("tipo", "entrada"),
      supabase.from("mensalidades").select("padrinho_id, ano, mes").eq("pago", true),
    ]);

  const mesesComDados = new Set(
    (transacoesDatas ?? []).map((t) => (t.data as string).slice(0, 7)),
  );
  mesesComDados.add(
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`,
  );
  const meses: MesChave[] = [...mesesComDados]
    .sort()
    .map((chave) => {
      const [ano, mes] = chave.split("-").map(Number);
      return { ano, mes };
    });

  const pagosPorPadrinho = new Map<string, Set<string>>();
  for (const m of mensalidadesPagas ?? []) {
    const chave = `${m.ano}-${String(m.mes).padStart(2, "0")}`;
    const padrinhoId = m.padrinho_id as string;
    if (!pagosPorPadrinho.has(padrinhoId)) {
      pagosPorPadrinho.set(padrinhoId, new Set());
    }
    pagosPorPadrinho.get(padrinhoId)!.add(chave);
  }

  const linhas: LinhaGradeAdimplencia[] = (padrinhos ?? []).map((p) => {
    const pagosDesse = pagosPorPadrinho.get(p.id) ?? new Set<string>();
    const pagamentos = meses.map(
      ({ ano, mes }) => pagosDesse.has(`${ano}-${String(mes).padStart(2, "0")}`),
    );

    let mesesSeguidosSemPagar = 0;
    for (let i = pagamentos.length - 1; i >= 0; i--) {
      if (pagamentos[i]) break;
      mesesSeguidosSemPagar++;
    }

    return {
      id: p.id,
      nome: p.nome,
      whatsapp: p.whatsapp,
      pagamentos,
      totalPago: pagamentos.filter(Boolean).length,
      mesesSeguidosSemPagar,
    };
  });

  return { meses, linhas };
}
