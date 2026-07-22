import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ImportarFichasForm from "./ImportarFichasForm";

type PadrinhoRow = {
  id: string;
  nome: string;
  whatsapp: string | null;
  email: string | null;
  nascimento: string | null;
  status: string;
  padrinho_desde: string | null;
  apadrinhamentos: { criancas: { nome: string } | null }[] | null;
};

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const ABAS = [
  { visao: "todos", label: "Todos" },
  { visao: "incompleta", label: "Ficha incompleta" },
] as const;

function camposFaltando(p: PadrinhoRow): string[] {
  const faltando: string[] = [];
  if (!p.whatsapp) faltando.push("Whatsapp");
  if (!p.email) faltando.push("E-mail");
  if (!p.nascimento) faltando.push("Nascimento");
  return faltando;
}

export default async function PadrinhosPage({
  searchParams,
}: {
  searchParams: Promise<{ letra?: string; ano?: string; visao?: string }>;
}) {
  const {
    letra: letraParam,
    ano: anoParam,
    visao: visaoParam,
  } = await searchParams;

  const visao = visaoParam === "incompleta" ? "incompleta" : "todos";

  const supabase = await createClient();

  const { data: todos } = await supabase
    .from("padrinhos")
    .select("nome, padrinho_desde");

  const letrasDisponiveis = new Set(
    (todos ?? []).map((p) => p.nome.trim().charAt(0).toUpperCase()),
  );
  const anosDisponiveis = [
    ...new Set(
      (todos ?? [])
        .map((p) => (p.padrinho_desde ? p.padrinho_desde.slice(0, 4) : null))
        .filter((ano): ano is string => ano !== null),
    ),
  ].sort();

  const letra =
    letraParam && letrasDisponiveis.has(letraParam.toUpperCase())
      ? letraParam.toUpperCase()
      : null;
  const ano = anoParam && anosDisponiveis.includes(anoParam) ? anoParam : null;

  let query = supabase
    .from("padrinhos")
    .select(
      "id, nome, whatsapp, email, nascimento, status, padrinho_desde, apadrinhamentos(criancas(nome))",
      { count: "exact" },
    )
    .order("nome")
    .limit(200);

  if (letra) query = query.ilike("nome", `${letra}%`);
  if (ano) {
    query = query
      .gte("padrinho_desde", `${ano}-01-01`)
      .lt("padrinho_desde", `${Number(ano) + 1}-01-01`);
  }
  if (visao === "incompleta") {
    query = query.or("whatsapp.is.null,email.is.null,nascimento.is.null");
  }

  const { data, count } = await query;
  const padrinhos = data as unknown as PadrinhoRow[] | null;

  const filtroAtivo = Boolean(letra || ano || visao === "incompleta");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Padrinho/Madrinha
          </h1>
          <p className="mt-1 text-sm text-muted">
            {count ?? 0} {filtroAtivo ? "encontrados" : "cadastrados"}.
          </p>
        </div>
        <Link
          href="/padrinhos/novo"
          className="rounded-lg bg-brand-blue-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          Novo cadastro
        </Link>
      </div>

      <ImportarFichasForm />

      <div className="flex gap-2 border-b border-border">
        {ABAS.map((aba) => (
          <Link
            key={aba.visao}
            href={buildHref(letra, ano, aba.visao)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              visao === aba.visao
                ? "border-b-2 border-brand-green-dark text-brand-green-dark"
                : "text-muted hover:text-foreground"
            }`}
          >
            {aba.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          <Link
            href={buildHref(null, ano, visao)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              !letra
                ? "bg-brand-blue-dark text-white"
                : "bg-brand-blue/10 text-brand-blue-dark hover:bg-brand-blue/20"
            }`}
          >
            Todas
          </Link>
          {LETRAS.map((l) => {
            const disponivel = letrasDisponiveis.has(l);
            return (
              <Link
                key={l}
                href={disponivel ? buildHref(l, ano, visao) : "#"}
                aria-disabled={!disponivel}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  !disponivel
                    ? "cursor-default text-muted/40"
                    : letra === l
                      ? "bg-brand-blue-dark text-white"
                      : "bg-brand-blue/10 text-brand-blue-dark hover:bg-brand-blue/20"
                }`}
              >
                {l}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={buildHref(letra, null, visao)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !ano
                ? "bg-brand-green-dark text-white"
                : "bg-brand-green/10 text-brand-green-dark hover:bg-brand-green/20"
            }`}
          >
            Todos os anos
          </Link>
          {anosDisponiveis.map((a) => (
            <Link
              key={a}
              href={buildHref(letra, a, visao)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                ano === a
                  ? "bg-brand-green-dark text-white"
                  : "bg-brand-green/10 text-brand-green-dark hover:bg-brand-green/20"
              }`}
            >
              Desde {a}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Contato</th>
              <th className="px-4 py-3 font-medium">Crianças apadrinhadas</th>
              {visao === "incompleta" ? (
                <th className="px-4 py-3 font-medium">Faltando</th>
              ) : (
                <th className="px-4 py-3 font-medium">Status</th>
              )}
            </tr>
          </thead>
          <tbody>
            {(padrinhos ?? []).map((padrinho) => (
              <tr
                key={padrinho.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  <Link
                    href={`/padrinhos/${padrinho.id}`}
                    className="text-brand-blue-dark hover:underline"
                  >
                    {padrinho.nome}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">
                  {[padrinho.whatsapp, padrinho.email]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td className="px-4 py-3 text-muted">
                  {padrinho.apadrinhamentos?.some((a) => a.criancas) ? (
                    <div className="flex flex-col gap-0.5">
                      {padrinho.apadrinhamentos
                        .filter((a) => a.criancas)
                        .map((a) => (
                          <span key={a.criancas!.nome}>{a.criancas!.nome}</span>
                        ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                {visao === "incompleta" ? (
                  <td className="px-4 py-3 text-muted">
                    {camposFaltando(padrinho).join(", ")}
                  </td>
                ) : (
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-green/15 px-2 py-1 text-xs font-medium text-brand-green-dark">
                      {padrinho.status}
                    </span>
                  </td>
                )}
              </tr>
            ))}
            {(padrinhos ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  {visao === "incompleta"
                    ? "Nenhuma ficha incompleta encontrada com esse filtro."
                    : "Nenhum padrinho encontrado com esse filtro."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildHref(
  letra: string | null,
  ano: string | null,
  visao: string,
): string {
  const params = new URLSearchParams();
  if (letra) params.set("letra", letra);
  if (ano) params.set("ano", ano);
  if (visao !== "todos") params.set("visao", visao);
  const query = params.toString();
  return query ? `/padrinhos?${query}` : "/padrinhos";
}
