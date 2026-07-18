import { createClient } from "@/lib/supabase/server";
import { getResumoInadimplencia } from "@/lib/inadimplencia";

export default async function Home() {
  const supabase = await createClient();

  const hoje = new Date();

  const [
    { count: totalCriancas },
    { count: totalPadrinhos },
    { count: pendentes },
    { data: criancasMatriculadas },
    resumoInadimplencia,
  ] = await Promise.all([
    supabase
      .from("criancas")
      .select("id", { count: "exact", head: true })
      .eq("status", "matriculado"),
    supabase
      .from("padrinhos")
      .select("id", { count: "exact", head: true })
      .eq("status", "ativo"),
    supabase
      .from("transacoes")
      .select("id", { count: "exact", head: true })
      .eq("status_conciliacao", "pendente"),
    supabase
      .from("criancas")
      .select("id, apadrinhamentos(id)")
      .eq("status", "matriculado"),
    getResumoInadimplencia(hoje.getFullYear(), hoje.getMonth() + 1),
  ]);

  const semApadrinhar = (
    (criancasMatriculadas ?? []) as unknown as {
      apadrinhamentos: { id: string }[] | null;
    }[]
  ).filter((c) => !c.apadrinhamentos || c.apadrinhamentos.length === 0).length;

  const stats = [
    {
      label: "Crianças cadastradas",
      value: totalCriancas ?? 0,
      accent: "green",
    },
    { label: "Padrinhos ativos", value: totalPadrinhos ?? 0, accent: "blue" },
    {
      label: "Crianças sem apadrinhar",
      value: semApadrinhar,
      accent: "pink",
    },
    {
      label: "Pendentes de conciliação",
      value: pendentes ?? 0,
      accent: "pink",
    },
    {
      label: "Possível inadimplência (mês atual)",
      value: resumoInadimplencia.inadimplentes.length,
      accent: "green",
    },
  ] as const;

  const accentClasses: Record<string, string> = {
    green: "border-l-brand-green",
    blue: "border-l-brand-blue",
    pink: "border-l-brand-pink",
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Painel geral
        </h1>
        <p className="mt-1 text-sm text-muted">
          Visão geral do apadrinhamento do Instituto Mãe Lalu.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border border-border border-l-4 bg-surface p-5 shadow-sm ${
              accentClasses[stat.accent]
            }`}
          >
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
