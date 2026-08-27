"use client";

import { useMemo, useState } from "react";
import { normalizaNome } from "@/lib/nomes";
import EditarAtualizacaoButton from "./EditarAtualizacaoButton";

type AtualizacaoRow = {
  id: string;
  tipo: string;
  descricao: string;
  origem: "automatico" | "manual";
  autor_email: string | null;
  criado_em: string;
  editado_em: string | null;
};

function formataDataHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MESES_COMPLETOS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function chaveMes(iso: string): string {
  return iso.slice(0, 7); // "AAAA-MM"
}

function labelMes(chave: string): string {
  const [ano, mes] = chave.split("-");
  return `${MESES_COMPLETOS[Number(mes) - 1]} de ${ano}`;
}

function Item({ a }: { a: AtualizacaoRow }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm text-foreground">{a.descricao}</p>
        {a.origem === "manual" && (
          <span className="shrink-0 rounded-full bg-brand-pink/15 px-2 py-0.5 text-xs font-medium text-brand-pink">
            manual
          </span>
        )}
      </div>
      <p className="text-xs text-muted">
        {formataDataHora(a.criado_em)}
        {a.autor_email && ` · ${a.autor_email}`}
        {a.editado_em && ` · editado em ${formataDataHora(a.editado_em)}`}
      </p>
      <div>
        <EditarAtualizacaoButton id={a.id} descricaoAtual={a.descricao} />
      </div>
    </div>
  );
}

export default function AtualizacoesLista({
  lista,
  mesAtual,
}: {
  lista: AtualizacaoRow[];
  mesAtual: string;
}) {
  const [busca, setBusca] = useState("");
  const [mesesAbertos, setMesesAbertos] = useState<Set<string>>(
    new Set([mesAtual]),
  );

  function alternarMes(chave: string) {
    setMesesAbertos((atual) => {
      const novo = new Set(atual);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return novo;
    });
  }

  const resultadosBusca = useMemo(() => {
    const alvo = normalizaNome(busca);
    if (!alvo) return null;
    return lista.filter((a) => normalizaNome(a.descricao).includes(alvo));
  }, [lista, busca]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, AtualizacaoRow[]>();
    for (const a of lista) {
      const chave = chaveMes(a.criado_em);
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave)!.push(a);
    }
    return [...mapa.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [lista]);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome de afilhado ou padrinho/madrinha..."
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
      />

      {resultadosBusca ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted">
            {resultadosBusca.length} resultado(s) para &quot;{busca}&quot;
          </p>
          {resultadosBusca.map((a) => (
            <Item key={a.id} a={a} />
          ))}
          {resultadosBusca.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
              Nada encontrado com esse nome.
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {grupos.map(([chave, itens]) => {
            const aberto = mesesAbertos.has(chave);
            return (
              <div key={chave} className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => alternarMes(chave)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
                >
                  <span className={`transition-transform ${aberto ? "rotate-90" : ""}`}>
                    ▸
                  </span>
                  {labelMes(chave)} ({itens.length})
                </button>
                {aberto &&
                  itens.map((a) => <Item key={a.id} a={a} />)}
              </div>
            );
          })}
          {grupos.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
              Nenhuma atualização registrada ainda.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
