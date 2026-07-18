import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ImportForm from "./ImportForm";

type CriancaRow = {
  id: string;
  nome: string;
  turma: string | null;
  turno: string | null;
  idade: number | null;
  nascimento: string | null;
  comunidade: string | null;
  status: string;
  apadrinhamentos: { padrinhos: { id: string; nome: string } | null }[] | null;
};

function formataData(iso: string | null): string {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

const ABAS = [
  { status: "matriculado", label: "Matriculados" },
  { status: "retirado", label: "Retirados" },
] as const;

// Ordem das salas como na planilha original (SALA ROSA, SALA AMARELA, ...).
const ORDEM_SALAS = ["ROSA", "AMARELA", "VERDE", "AZUL", "CIRAND. MUNDO"];

function extraiSala(turma: string | null): string {
  if (!turma) return "Sem turma";
  return turma.replace(/\s*\([^)]*\)\s*$/, "").trim() || "Sem turma";
}

export default async function CriancasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sala?: string }>;
}) {
  const { status: statusParam, sala: salaParam } = await searchParams;
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

  // Salas só existem entre os matriculados (a planilha original não separa
  // os retirados por turma).
  const { data: turmasMatriculados } = await supabase
    .from("criancas")
    .select("turma")
    .eq("status", "matriculado");

  const contagemPorSala = new Map<string, number>();
  for (const row of turmasMatriculados ?? []) {
    const sala = extraiSala(row.turma as string | null);
    contagemPorSala.set(sala, (contagemPorSala.get(sala) ?? 0) + 1);
  }
  const salas = [...contagemPorSala.keys()].sort((a, b) => {
    const ia = ORDEM_SALAS.indexOf(a);
    const ib = ORDEM_SALAS.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const salaSelecionada =
    status === "matriculado" && salaParam && contagemPorSala.has(salaParam)
      ? salaParam
      : null;

  let query = supabase
    .from("criancas")
    .select(
      "id, nome, turma, turno, idade, nascimento, comunidade, status, apadrinhamentos(padrinhos(id, nome))",
    )
    .eq("status", status)
    .order("nome")
    .limit(300);

  if (salaSelecionada) {
    query = query.ilike("turma", `${salaSelecionada}%`);
  }

  const { data } = await query;
  const criancas = data as unknown as CriancaRow[] | null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Público atendido
          </h1>
          <p className="mt-1 text-sm text-muted">
            {contagens.matriculado} matriculadas · {contagens.retirado}{" "}
            retiradas.
          </p>
        </div>
        <Link
          href="/criancas/novo"
          className="rounded-lg bg-brand-blue-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          Novo cadastro
        </Link>
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

      {status === "matriculado" && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/criancas?status=matriculado"
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !salaSelecionada
                ? "bg-brand-blue-dark text-white"
                : "bg-brand-blue/10 text-brand-blue-dark hover:bg-brand-blue/20"
            }`}
          >
            Todas ({contagens.matriculado})
          </Link>
          {salas.map((sala) => (
            <Link
              key={sala}
              href={`/criancas?status=matriculado&sala=${encodeURIComponent(sala)}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                salaSelecionada === sala
                  ? "bg-brand-blue-dark text-white"
                  : "bg-brand-blue/10 text-brand-blue-dark hover:bg-brand-blue/20"
              }`}
            >
              {sala} ({contagemPorSala.get(sala)})
            </Link>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Nascimento</th>
              <th className="px-4 py-3 font-medium">Idade</th>
              <th className="px-4 py-3 font-medium">Turma</th>
              <th className="px-4 py-3 font-medium">Comunidade</th>
              <th className="px-4 py-3 font-medium">Padrinho/Madrinha</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(criancas ?? []).map((crianca) => (
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
                <td className="px-4 py-3 text-muted">
                  {crianca.turma}
                  {crianca.turno ? ` (${crianca.turno})` : ""}
                </td>
                <td className="px-4 py-3 text-muted">{crianca.comunidade}</td>
                <td className="px-4 py-3 text-muted">
                  {crianca.apadrinhamentos?.some((a) => a.padrinhos) ? (
                    <div className="flex flex-col gap-0.5">
                      {crianca.apadrinhamentos
                        .filter((a) => a.padrinhos)
                        .map((a) => (
                          <Link
                            key={a.padrinhos!.id}
                            href={`/padrinhos/${a.padrinhos!.id}`}
                            className="text-brand-blue-dark hover:underline"
                          >
                            {a.padrinhos!.nome}
                          </Link>
                        ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/criancas/${crianca.id}/editar`}
                    className="text-xs font-medium text-brand-blue-dark hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {(criancas ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
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
