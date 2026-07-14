import Link from "next/link";
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

const ABAS = [
  { status: "matriculado", label: "Matriculados" },
  { status: "retirado", label: "Retirados" },
] as const;

export default async function CriancasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status = statusParam === "retirado" ? "retirado" : "matriculado";

  const supabase = await createClient();

  const [{ count: totalMatriculados }, { count: totalRetirados }] =
    await Promise.all([
      supabase
        .from("criancas")
        .select("id", { count: "exact", head: true })
        .eq("status", "matriculado"),
      supabase
        .from("criancas")
        .select("id", { count: "exact", head: true })
        .eq("status", "retirado"),
    ]);

  const contagens: Record<string, number> = {
    matriculado: totalMatriculados ?? 0,
    retirado: totalRetirados ?? 0,
  };

  const { data } = await supabase
    .from("criancas")
    .select(
      "id, nome, turma, turno, comunidade, status, apadrinhamentos(padrinhos(nome))",
    )
    .eq("status", status)
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
          {contagens.matriculado} matriculadas · {contagens.retirado}{" "}
          retiradas.
        </p>
      </div>

      <ImportForm />

      <div className="flex gap-2 border-b border-border">
        {ABAS.map((aba) => (
          <Link
            key={aba.status}
            href={`/criancas?status=${aba.status}`}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              status === aba.status
                ? "border-b-2 border-brand-green-dark text-brand-green-dark"
                : "text-muted hover:text-foreground"
            }`}
          >
            {aba.label} ({contagens[aba.status]})
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Turma</th>
              <th className="px-4 py-3 font-medium">Comunidade</th>
              <th className="px-4 py-3 font-medium">Padrinho/Madrinha</th>
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
              </tr>
            ))}
            {(criancas ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Nenhuma criança nesta lista ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
