import { createClient } from "@/lib/supabase/server";
import ImportForm from "./ImportForm";

type CriancaRow = {
  id: string;
  nome: string;
  turma: string | null;
  turno: string | null;
  comunidade: string | null;
  status: string;
  apadrinhamentos: { padrinhos: { nome: string } | null }[] | null;
};

export default async function CriancasPage() {
  const supabase = await createClient();

  const { data, count } = await supabase
    .from("criancas")
    .select(
      "id, nome, turma, turno, comunidade, status, apadrinhamentos(padrinhos(nome))",
      { count: "exact" },
    )
    .order("nome")
    .limit(50);

  const criancas = data as unknown as CriancaRow[] | null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Crianças
        </h1>
        <p className="mt-1 text-sm text-muted">
          {count ?? 0} crianças cadastradas.
        </p>
      </div>

      <ImportForm />

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Turma</th>
              <th className="px-4 py-3 font-medium">Comunidade</th>
              <th className="px-4 py-3 font-medium">Padrinho/Madrinha</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(criancas ?? []).map((crianca) => (
              <tr key={crianca.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">
                  {crianca.nome}
                </td>
                <td className="px-4 py-3 text-muted">
                  {crianca.turma}
                  {crianca.turno ? ` (${crianca.turno})` : ""}
                </td>
                <td className="px-4 py-3 text-muted">{crianca.comunidade}</td>
                <td className="px-4 py-3 text-muted">
                  {crianca.apadrinhamentos
                    ?.map((a) => a.padrinhos?.nome)
                    .filter(Boolean)
                    .join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      crianca.status === "matriculado"
                        ? "bg-brand-green/15 text-brand-green-dark"
                        : "bg-brand-pink/15 text-brand-pink"
                    }`}
                  >
                    {crianca.status}
                  </span>
                </td>
              </tr>
            ))}
            {(criancas ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Nenhuma criança cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
