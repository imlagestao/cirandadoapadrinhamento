import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { alternarMensalidade } from "../actions";
import MensalidadesGrid from "./MensalidadesGrid";

type CriancaLigada = {
  id: string;
  nome: string;
  idade: number | null;
  nascimento: string | null;
  turma: string | null;
  comunidade: string | null;
};

function formataData(iso: string | null): string {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default async function FichaPadrinhoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: padrinho } = await supabase
    .from("padrinhos")
    .select(
      "id, nome, whatsapp, email, cpf, nascimento, endereco, padrinho_desde, pendencia, status, observacoes, apadrinhamentos(criancas(id, nome, idade, nascimento, turma, comunidade))",
    )
    .eq("id", id)
    .single();

  if (!padrinho) notFound();

  const afilhados = (
    (padrinho as unknown as {
      apadrinhamentos: { criancas: CriancaLigada | null }[] | null;
    }).apadrinhamentos ?? []
  )
    .map((a) => a.criancas)
    .filter((c): c is CriancaLigada => c !== null);

  const anoAtual = new Date().getFullYear();
  const { data: mensalidades } = await supabase
    .from("mensalidades")
    .select("mes, pago")
    .eq("padrinho_id", id)
    .eq("ano", anoAtual);

  const mesesPagos = new Set(
    (mensalidades ?? []).filter((m) => m.pago).map((m) => m.mes),
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {padrinho.nome}
        </h1>
        <Link
          href={`/padrinhos/${id}/editar`}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-brand-green/10"
        >
          Editar
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="bg-brand-blue-dark px-5 py-2 text-sm font-semibold text-white">
          Padrinho/Madrinha
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 p-5 text-sm sm:grid-cols-3">
          <Info label="Nome completo" value={padrinho.nome} />
          <Info label="Nascimento" value={formataData(padrinho.nascimento)} />
          <Info label="CPF" value={padrinho.cpf ?? "—"} />
          <Info label="Whatsapp" value={padrinho.whatsapp ?? "—"} />
          <Info label="E-mail" value={padrinho.email ?? "—"} />
          <Info label="Endereço" value={padrinho.endereco ?? "—"} />
          <Info
            label="Padrinho/Madrinha desde"
            value={formataData(padrinho.padrinho_desde)}
          />
          <Info label="Nº de afilhados" value={String(afilhados.length)} />
          <Info
            label={`Pendência ${anoAtual}`}
            value={padrinho.pendencia ? "Sim" : "Não"}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="bg-brand-green-dark px-5 py-2 text-sm font-semibold text-white">
          Afilhados(as)
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr>
              <th className="px-5 py-2 font-medium">Nome</th>
              <th className="px-5 py-2 font-medium">Nascimento</th>
              <th className="px-5 py-2 font-medium">Idade</th>
              <th className="px-5 py-2 font-medium">Turma</th>
              <th className="px-5 py-2 font-medium">Local</th>
            </tr>
          </thead>
          <tbody>
            {afilhados.map((crianca) => (
              <tr key={crianca.id} className="border-b border-border last:border-0">
                <td className="px-5 py-2 font-medium text-foreground">
                  {crianca.nome}
                </td>
                <td className="px-5 py-2 text-muted">
                  {formataData(crianca.nascimento)}
                </td>
                <td className="px-5 py-2 text-muted">
                  {crianca.idade ? `${crianca.idade} anos` : "—"}
                </td>
                <td className="px-5 py-2 text-muted">{crianca.turma ?? "—"}</td>
                <td className="px-5 py-2 text-muted">
                  {crianca.comunidade ?? "—"}
                </td>
              </tr>
            ))}
            {afilhados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-muted">
                  Nenhum afilhado vinculado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Controle de mensalidades {anoAtual}
        </h2>
        <MensalidadesGrid
          padrinhoId={id}
          ano={anoAtual}
          pagos={mesesPagos}
          alternar={alternarMensalidade}
        />
      </div>

      {padrinho.observacoes && (
        <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          <span className="font-semibold text-foreground">Observações: </span>
          {padrinho.observacoes}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
