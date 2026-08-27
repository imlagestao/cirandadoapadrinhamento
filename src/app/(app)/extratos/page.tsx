import { createClient } from "@/lib/supabase/server";
import { sugerirPadrinhos } from "@/lib/extratos/sugestao";
import BuscaExtratos from "./BuscaExtratos";
import ConciliacaoItem from "./ConciliacaoItem";
import CorrigirMensalidadesButton from "./CorrigirMensalidadesButton";
import CorrigirMensalidadesFaltandoButton from "./CorrigirMensalidadesFaltandoButton";
import CorrigirNomesButton from "./CorrigirNomesButton";
import IgnorarValoresBaixosButton from "./IgnorarValoresBaixosButton";
import ImportarExtratoForm from "./ImportarExtratoForm";
import ListaIgnorados from "./ListaIgnorados";

type TransacaoRow = {
  id: string;
  data: string;
  descricao: string;
  nome_extraido: string | null;
  valor: number;
};

type TransacaoIgnoradaRow = TransacaoRow & { marcado_manualmente: boolean };

type TransacaoConciliadaRow = TransacaoRow & {
  conciliacoes: { padrinhos: { nome: string } | null }[] | null;
};

type CoberturaRow = {
  data: string;
  contas_bancarias: { nome: string } | null;
};

const MESES_ABREV = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export default async function ExtratosPage() {
  const supabase = await createClient();

  const [
    { data: padrinhos },
    { data: apadrinhamentos },
    { data: pendentes },
    { data: conciliadas },
    { data: ignorados },
    { data: cobertura },
    { data: apelidos },
  ] = await Promise.all([
    supabase.from("padrinhos").select("id, nome").order("nome"),
    supabase.from("apadrinhamentos").select("padrinho_id"),
    supabase
      .from("transacoes")
      .select("id, data, descricao, nome_extraido, valor")
      .eq("tipo", "entrada")
      .eq("status_conciliacao", "pendente")
      .order("data", { ascending: false })
      .limit(300),
    supabase
      .from("transacoes")
      .select(
        "id, data, descricao, nome_extraido, valor, conciliacoes(padrinhos(nome))",
      )
      .eq("status_conciliacao", "conciliado")
      .order("data", { ascending: false })
      .limit(300),
    supabase
      .from("transacoes")
      .select("id, data, descricao, nome_extraido, valor, marcado_manualmente")
      .eq("status_conciliacao", "ignorado")
      .order("marcado_manualmente", { ascending: false })
      .order("data", { ascending: false })
      .limit(300),
    supabase
      .from("transacoes")
      .select("data, contas_bancarias(nome)")
      .eq("tipo", "entrada"),
    supabase.from("apelidos_transacao").select("nome_normalizado, padrinho_id"),
  ]);

  const afilhadosPorPadrinho = new Map<string, number>();
  for (const a of apadrinhamentos ?? []) {
    const id = a.padrinho_id as string;
    afilhadosPorPadrinho.set(id, (afilhadosPorPadrinho.get(id) ?? 0) + 1);
  }
  const listaPadrinhos = (padrinhos ?? []).map((p) => ({
    ...p,
    afilhados: afilhadosPorPadrinho.get(p.id) ?? 0,
  }));
  const listaPendentes = (pendentes ?? []) as TransacaoRow[];
  const listaIgnorados = (ignorados ?? []) as TransacaoIgnoradaRow[];
  const listaConciliadas = (conciliadas ?? []) as unknown as TransacaoConciliadaRow[];
  const mapaApelidos = new Map(
    (apelidos ?? []).map((a) => [a.nome_normalizado as string, a.padrinho_id as string]),
  );

  const bancos = [
    ...new Set(
      ((cobertura ?? []) as unknown as CoberturaRow[])
        .map((t) => t.contas_bancarias?.nome)
        .filter((n): n is string => Boolean(n)),
    ),
  ].sort();

  const contagemPorMesBanco = new Map<string, number>();
  const mesesComDados = new Set<string>();
  for (const t of (cobertura ?? []) as unknown as CoberturaRow[]) {
    const banco = t.contas_bancarias?.nome;
    if (!banco) continue;
    const mes = t.data.slice(0, 7);
    mesesComDados.add(mes);
    const chave = `${mes}|${banco}`;
    contagemPorMesBanco.set(chave, (contagemPorMesBanco.get(chave) ?? 0) + 1);
  }
  const meses = [...mesesComDados].sort();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Extratos & Conciliação
        </h1>
        <p className="mt-1 text-sm text-muted">
          {listaPendentes.length} pendentes de revisão ·{" "}
          {listaConciliadas.length} conciliadas no total.
        </p>
      </div>

      <BuscaExtratos
        pendentes={listaPendentes.map((t) => ({
          id: t.id,
          data: t.data,
          descricao: t.descricao,
          nomeExtraido: t.nome_extraido,
          valor: t.valor,
          status: "pendente" as const,
          padrinhoNomes: [],
        }))}
        conciliadas={listaConciliadas.map((t) => ({
          id: t.id,
          data: t.data,
          descricao: t.descricao,
          nomeExtraido: t.nome_extraido,
          valor: t.valor,
          status: "conciliado" as const,
          padrinhoNomes: (t.conciliacoes ?? [])
            .map((c) => c.padrinhos?.nome)
            .filter((n): n is string => Boolean(n)),
        }))}
        ignoradas={listaIgnorados.map((t) => ({
          id: t.id,
          data: t.data,
          descricao: t.descricao,
          nomeExtraido: t.nome_extraido,
          valor: t.valor,
          status: "ignorado" as const,
          padrinhoNomes: [],
        }))}
      />

      {meses.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <div className="bg-brand-blue-dark px-5 py-2 text-sm font-semibold text-white">
            Cobertura de extratos importados (lançamentos por mês)
          </div>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Mês</th>
                {bancos.map((banco) => (
                  <th key={banco} className="px-4 py-2 font-medium">
                    {banco}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meses.map((mes) => {
                const [ano, mesNum] = mes.split("-");
                const label = `${MESES_ABREV[Number(mesNum) - 1]}/${ano}`;
                return (
                  <tr key={mes} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-medium text-foreground">
                      {label}
                    </td>
                    {bancos.map((banco) => {
                      const qtd = contagemPorMesBanco.get(`${mes}|${banco}`) ?? 0;
                      return (
                        <td
                          key={banco}
                          className={`px-4 py-2 ${qtd === 0 ? "text-red-500" : "text-muted"}`}
                        >
                          {qtd === 0 ? "sem dados" : `${qtd} lançamentos`}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ImportarExtratoForm />

      <div className="flex flex-wrap gap-2">
        <CorrigirNomesButton />
        <IgnorarValoresBaixosButton />
        <CorrigirMensalidadesButton />
        <CorrigirMensalidadesFaltandoButton />
      </div>

      <div className="flex flex-col gap-3">
        {listaPendentes.map((t) => (
          <ConciliacaoItem
            key={t.id}
            transacao={{
              id: t.id,
              data: t.data,
              descricao: t.descricao,
              nomeExtraido: t.nome_extraido,
              valor: t.valor,
            }}
            sugestoes={
              t.nome_extraido
                ? sugerirPadrinhos(t.nome_extraido, listaPadrinhos, mapaApelidos)
                : []
            }
            padrinhosDisponiveis={listaPadrinhos}
          />
        ))}
        {listaPendentes.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
            Nenhum lançamento pendente. Importe um extrato para começar.
          </div>
        )}
      </div>

      <ListaIgnorados lista={listaIgnorados} />
    </div>
  );
}
