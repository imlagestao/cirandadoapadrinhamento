"use client";

import { useState, useTransition } from "react";
import { confirmarConciliacao, ignorarTransacao } from "./actions";
import type { SugestaoPadrinho } from "@/lib/extratos/sugestao";

type Transacao = {
  id: string;
  data: string;
  descricao: string;
  nomeExtraido: string | null;
  valor: number;
};

function formataData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formataValor(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ConciliacaoItem({
  transacao,
  sugestoes,
  padrinhosDisponiveis,
}: {
  transacao: Transacao;
  sugestoes: SugestaoPadrinho[];
  padrinhosDisponiveis: { id: string; nome: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [feito, setFeito] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState(
    sugestoes[0]?.id ?? "",
  );

  function confirmar() {
    if (!selecionado) return;
    setErro(null);
    startTransition(async () => {
      const res = await confirmarConciliacao(transacao.id, selecionado);
      if (!res.ok) {
        setErro(res.erro ?? "Erro ao confirmar.");
        return;
      }
      setFeito(true);
    });
  }

  function ignorar() {
    setErro(null);
    startTransition(async () => {
      const res = await ignorarTransacao(transacao.id);
      if (!res.ok) {
        setErro(res.erro ?? "Erro ao ignorar.");
        return;
      }
      setFeito(true);
    });
  }

  if (feito) return null;

  const melhorScore = sugestoes[0]?.score ?? 0;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">
          {transacao.nomeExtraido ?? transacao.descricao}
        </p>
        <p className="text-xs text-muted">
          {formataData(transacao.data)} · {formataValor(transacao.valor)}
        </p>
        {melhorScore > 0 && melhorScore < 1 && (
          <p className="text-xs text-brand-blue-dark">
            Sugestão por nome parecido ({Math.round(melhorScore * 100)}% de
            confiança)
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          value={selecionado}
          onChange={(e) => setSelecionado(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
        >
          <option value="">Selecione o padrinho...</option>
          {sugestoes.length > 0 && (
            <optgroup label="Sugestões">
              {sugestoes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({Math.round(s.score * 100)}%)
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="Todos os padrinhos">
            {padrinhosDisponiveis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </optgroup>
        </select>
        <button
          type="button"
          onClick={confirmar}
          disabled={isPending || !selecionado}
          className="rounded-lg bg-brand-green-dark px-3 py-2 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
        >
          Confirmar
        </button>
        <button
          type="button"
          onClick={ignorar}
          disabled={isPending}
          className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-background disabled:opacity-60"
        >
          Não é padrinho
        </button>
      </div>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  );
}
