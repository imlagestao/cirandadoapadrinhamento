import { createClient } from "@/lib/supabase/server";
import VincularForm from "./VincularForm";

type CriancaRow = {
  id: string;
  nome: string;
  turma: string | null;
  nascimento: string | null;
  idade: number | null;
  comunidade: string | null;
  apadrinhamentos: { id: string }[] | null;
};

function formataData(iso: string | null): string {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default async function SemPadrinhoPage() {
  const supabase = await createClient();

  const [{ data: criancas }, { data: padrinhos }] = await Promise.all([
    supabase
      .from("criancas")
      .select(
        "id, nome, turma, nascimento, idade, comunidade, apadrinhamentos(id)",
      )
      .eq("status", "matriculado")
      .order("nome"),
    supabase
      .from("padrinhos")
      .select("id, nome")
      .eq("status", "ativo")
      .order("nome"),
  ]);

  const listaPadrinhos = padrinhos ?? [];
  const semPadrinho = ((criancas ?? []) as unknown as CriancaRow[]).filter(
    (c) => !c.apadrinhamentos || c.apadrinhamentos.length === 0,
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Crianças sem padrinho/madrinha
        </h1>
        <p className="mt-1 text-sm text-muted">
          {semPadrinho.length} matriculada(s) ainda sem apadrinhamento.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Nascimento</th>
              <th className="px-4 py-3 font-medium">Idade</th>
              <th className="px-4 py-3 font-medium">Turma</th>
              <th className="px-4 py-3 font-medium">Comunidade</th>
              <th className="px-4 py-3 font-medium">Apadrinhar</th>
            </tr>
          </thead>
          <tbody>
            {semPadrinho.map((crianca) => (
              <tr key={crianca.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">
                  {crianca.nome}
                </td>
                <td className="px-4 py-3 text-muted">
                  {formataData(crianca.nascimento)}
                </td>
                <td className="px-4 py-3 text-muted">
                  {crianca.idade ? `${crianca.idade} anos` : "—"}
                </td>
                <td className="px-4 py-3 text-muted">{crianca.turma ?? "—"}</td>
                <td className="px-4 py-3 text-muted">
                  {crianca.comunidade ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <VincularForm
                    criancaId={crianca.id}
                    padrinhos={listaPadrinhos}
                  />
                </td>
              </tr>
            ))}
            {semPadrinho.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Todas as crianças matriculadas já têm padrinho/madrinha.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
