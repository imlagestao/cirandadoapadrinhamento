import { createClient } from "@/lib/supabase/server";
import { sugerirPadrinhos } from "@/lib/extratos/sugestao";
import ConciliacaoItem from "./ConciliacaoItem";
import CorrigirNomesButton from "./CorrigirNomesButton";
import ImportarExtratoForm from "./ImportarExtratoForm";

type TransacaoRow = {
  id: string;
  data: string;
  descricao: string;
  nome_extraido: string | null;
  valor: number;
};

export default async function ExtratosPage() {
  const supabase = await createClient();

  const [{ data: padrinhos }, { data: pendentes }, { count: conciliadas }] =
    await Promise.all([
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
    ]);

  const listaPadrinhos = padrinhos ?? [];
  const listaPendentes = (pendentes ?? []) as TransacaoRow[];

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

      <ImportarExtratoForm />

      <CorrigirNomesButton />

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
                ? sugerirPadrinhos(t.nome_extraido, listaPadrinhos)
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
    </div>
  );
}
