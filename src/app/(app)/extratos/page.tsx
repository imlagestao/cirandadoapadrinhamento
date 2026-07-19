import { createClient } from "@/lib/supabase/server";
import { sugerirPadrinhos } from "@/lib/extratos/sugestao";
import ApagarIgnoradosButton from "./ApagarIgnoradosButton";
import ConciliacaoItem from "./ConciliacaoItem";
import CorrigirNomesButton from "./CorrigirNomesButton";
import IgnorarValoresBaixosButton from "./IgnorarValoresBaixosButton";
import ImportarExtratoForm from "./ImportarExtratoForm";
import ReverterIgnoradoButton from "./ReverterIgnoradoButton";

type TransacaoRow = {
  id: string;
  data: string;
  descricao: string;
  nome_extraido: string | null;
  valor: number;
};

type TransacaoIgnoradaRow = TransacaoRow & { marcado_manualmente: boolean };

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
    { data: pendentes },
    { count: conciliadas },
    { data: ignorados },
    { data: cobertura },
    { data: apelidos },
  ] = await Promise.all([
    supabase.from("padrinhos").select("id, nome").order("nome"),
    supabase
      .from("transacoes")
      .select("id, data, descricao, nome_extraido, valor")
      .eq("tipo", "entrada")
      .eq("status_conciliacao", "pendente")
      .order("data", { ascending: false })
      .limit(300),
    supabase
      .from("transacoes")
      .select("id", { count: "exact", head: true })
      .eq("status_conciliacao", "conciliado"),
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

  const listaPadrinhos = padrinhos ?? [];
  const listaPendentes = (pendentes ?? []) as TransacaoRow[];
  const listaIgnorados = (ignorados ?? []) as TransacaoIgnoradaRow[];
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
          {listaPendentes.length} pendentes de revisão · {conciliadas ?? 0}{" "}
          conciliadas no total.
        </p>
      </div>

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

      {listaIgnorados.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              Marcados como &quot;não é apadrinhamento&quot;
            </h2>
            <ApagarIgnoradosButton quantidade={listaIgnorados.length} />
          </div>
          <p className="text-xs text-muted">
            Os marcados manualmente aparecem primeiro — se marcou algum por
            engano, é aqui que reverte. Os sem nome/valor fora da faixa foram
            ignorados automaticamente.
          </p>
          {listaIgnorados.map((t) => (
            <div
              key={t.id}
              className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t.nome_extraido ?? t.descricao}
                  {t.marcado_manualmente && (
                    <span className="ml-2 rounded-full bg-brand-pink/15 px-2 py-0.5 text-xs font-medium text-brand-pink">
                      manual
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted">
                  {formataData(t.data)} ·{" "}
                  {t.valor.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
              <ReverterIgnoradoButton id={t.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formataData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}
