"use client";

import { useMemo, useState } from "react";
import { normalizaNome } from "@/lib/nomes";

type Transacao = {
  id: string;
  data: string;
  descricao: string;
  nomeExtraido: string | null;
  valor: number;
  status: "pendente" | "conciliado" | "ignorado";
  padrinhoNomes: string[];
};

function formataData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formataValor(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const ETIQUETA_STATUS: Record<Transacao["status"], { texto: string; classe: string }> = {
  pendente: { texto: "Pendente", classe: "bg-brand-blue/15 text-brand-blue-dark" },
  conciliado: { texto: "Conciliado", classe: "bg-brand-green/15 text-brand-green-dark" },
  ignorado: { texto: "Ignorado", classe: "bg-brand-pink/15 text-brand-pink" },
};

export default function BuscaExtratos({
  pendentes,
  conciliadas,
  ignoradas,
}: {
  pendentes: Transacao[];
  conciliadas: Transacao[];
  ignoradas: Transacao[];
}) {
  const [busca, setBusca] = useState("");

  const todas = useMemo(
    () => [...pendentes, ...conciliadas, ...ignoradas],
    [pendentes, conciliadas, ignoradas],
  );

  const resultados = useMemo(() => {
    const alvo = normalizaNome(busca);
    if (!alvo) return [];
    return todas.filter((t) => {
      if (t.nomeExtraido && normalizaNome(t.nomeExtraido).includes(alvo)) return true;
      if (normalizaNome(t.descricao).includes(alvo)) return true;
      return t.padrinhoNomes.some((n) => normalizaNome(n).includes(alvo));
    });
  }, [todas, busca]);

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome (pendentes, conciliadas e ignoradas)..."
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
      />
      {busca.trim() && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
          <p className="text-xs text-muted">
            {resultados.length} resultado(s) para &quot;{busca}&quot;
          </p>
          {resultados.map((t) => (
            <div
              key={t.id}
              className="flex flex-col gap-1 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t.nomeExtraido ?? t.descricao}
                </p>
                <p className="text-xs text-muted">
                  {formataData(t.data)} · {formataValor(t.valor)}
                  {t.padrinhoNomes.length > 0 &&
                    ` · ${t.padrinhoNomes.join(", ")}`}
                </p>
              </div>
              <span
                className={`self-start rounded-full px-2 py-0.5 text-xs font-medium ${ETIQUETA_STATUS[t.status].classe}`}
              >
                {ETIQUETA_STATUS[t.status].texto}
              </span>
            </div>
          ))}
          {resultados.length === 0 && (
            <p className="text-sm text-muted">Nada encontrado com esse nome.</p>
          )}
        </div>
      )}
    </div>
  );
}
