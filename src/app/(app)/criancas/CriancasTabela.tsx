"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { normalizaNome } from "@/lib/nomes";

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

export default function CriancasTabela({
  criancas,
}: {
  criancas: CriancaRow[];
}) {
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(() => {
    const alvo = normalizaNome(busca);
    if (!alvo) return criancas;
    return criancas.filter((c) => {
      if (normalizaNome(c.nome).includes(alvo)) return true;
      return (c.apadrinhamentos ?? []).some(
        (a) => a.padrinhos && normalizaNome(a.padrinhos.nome).includes(alvo),
      );
    });
  }, [criancas, busca]);

  return (
    <>
      <input
        type="text"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome da criança ou do padrinho/madrinha..."
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
      />

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
            {filtradas.map((crianca) => (
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
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  {criancas.length === 0
                    ? "Nenhuma criança nesta lista ainda."
                    : "Nenhuma criança encontrada com esse nome."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
