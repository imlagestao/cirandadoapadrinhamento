"use client";

import { useMemo, useState } from "react";
import { normalizaNome } from "@/lib/nomes";
import { nomeDoAutor } from "@/lib/autores";
import { SITUACOES, situacaoInfo, type Situacao } from "@/lib/situacoes";
import EditarAtualizacaoButton from "./EditarAtualizacaoButton";

type AtualizacaoRow = {
  id: string;
  tipo: string;
  situacao: string | null;
  descricao: string;
  origem: "automatico" | "manual";
  autor_email: string | null;
  criado_em: string;
  editado_em: string | null;
};

const CLASSES_BOTAO_COR: Record<string, string> = {
  "brand-blue": "border-brand-blue bg-brand-blue/15 text-brand-blue-dark",
  "brand-green": "border-brand-green bg-brand-green/15 text-brand-green-dark",
  "brand-pink": "border-brand-pink bg-brand-pink/15 text-brand-pink",
  red: "border-red-400 bg-red-50 text-red-600",
  amber: "border-amber-400 bg-amber-50 text-amber-700",
};

const CLASSES_ETIQUETA_COR: Record<string, string> = {
  "brand-blue": "bg-brand-blue/15 text-brand-blue-dark",
  "brand-green": "bg-brand-green/15 text-brand-green-dark",
  "brand-pink": "bg-brand-pink/15 text-brand-pink",
  red: "bg-red-50 text-red-600",
  amber: "bg-amber-50 text-amber-700",
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
  const situacao = situacaoInfo(a.situacao);
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm text-foreground">{a.descricao}</p>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          {situacao && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${CLASSES_ETIQUETA_COR[situacao.cor]}`}
            >
              {situacao.label}
            </span>
          )}
          {a.origem === "manual" && (
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
              manual
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-muted">
        {formataDataHora(a.criado_em)}
        {a.autor_email && ` · ${nomeDoAutor(a.autor_email)}`}
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
  const [situacoesFiltro, setSituacoesFiltro] = useState<Set<Situacao>>(
    new Set(),
  );
  const [mesesAbertos, setMesesAbertos] = useState<Set<string>>(
    new Set([mesAtual]),
  );

  function alternarSituacaoFiltro(valor: Situacao) {
    setSituacoesFiltro((atual) => {
      const novo = new Set(atual);
      if (novo.has(valor)) novo.delete(valor);
      else novo.add(valor);
      return novo;
    });
  }

  function alternarMes(chave: string) {
    setMesesAbertos((atual) => {
      const novo = new Set(atual);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return novo;
    });
  }

  const listaFiltrada = useMemo(() => {
    if (situacoesFiltro.size === 0) return lista;
    return lista.filter(
      (a) => a.situacao && situacoesFiltro.has(a.situacao as Situacao),
    );
  }, [lista, situacoesFiltro]);

  const resultadosBusca = useMemo(() => {
    const alvo = normalizaNome(busca);
    if (!alvo) return null;
    return listaFiltrada.filter((a) => {
      if (normalizaNome(a.descricao).includes(alvo)) return true;
      const autor = nomeDoAutor(a.autor_email);
      return autor ? normalizaNome(autor).includes(alvo) : false;
    });
  }, [listaFiltrada, busca]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, AtualizacaoRow[]>();
    for (const a of listaFiltrada) {
      const chave = chaveMes(a.criado_em);
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave)!.push(a);
    }
    return [...mapa.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [listaFiltrada]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {SITUACOES.map((s) => {
          const ativo = situacoesFiltro.has(s.valor);
          return (
            <button
              key={s.valor}
              type="button"
              onClick={() => alternarSituacaoFiltro(s.valor)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                ativo
                  ? CLASSES_BOTAO_COR[s.cor]
                  : "border-border text-muted hover:bg-background"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

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
