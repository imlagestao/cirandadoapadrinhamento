import { createClient } from "@/lib/supabase/server";

type PadrinhoRow = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  status: string;
  apadrinhamentos: { criancas: { nome: string } | null }[] | null;
};

export default async function PadrinhosPage() {
  const supabase = await createClient();

  const { data, count } = await supabase
    .from("padrinhos")
    .select("id, nome, telefone, email, status, apadrinhamentos(criancas(nome))", {
      count: "exact",
    })
    .order("nome")
    .limit(50);

  const padrinhos = data as unknown as PadrinhoRow[] | null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Padrinhos
        </h1>
        <p className="mt-1 text-sm text-muted">
          {count ?? 0} padrinhos cadastrados.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Contato</th>
              <th className="px-4 py-3 font-medium">Crianças apadrinhadas</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(padrinhos ?? []).map((padrinho) => (
              <tr
                key={padrinho.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {padrinho.nome}
                </td>
                <td className="px-4 py-3 text-muted">
                  {[padrinho.telefone, padrinho.email].filter(Boolean).join(" · ") ||
                    "—"}
                </td>
                <td className="px-4 py-3 text-muted">
                  {padrinho.apadrinhamentos
                    ?.map((a) => a.criancas?.nome)
                    .filter(Boolean)
                    .join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-green/15 px-2 py-1 text-xs font-medium text-brand-green-dark">
                    {padrinho.status}
                  </span>
                </td>
              </tr>
            ))}
            {(padrinhos ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Nenhum padrinho cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
