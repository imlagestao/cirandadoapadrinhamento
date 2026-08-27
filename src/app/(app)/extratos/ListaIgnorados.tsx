"use client";

import { useState } from "react";
import ApagarIgnoradosButton from "./ApagarIgnoradosButton";
import ReverterIgnoradoButton from "./ReverterIgnoradoButton";

type TransacaoIgnoradaRow = {
  id: string;
  data: string;
  descricao: string;
  nome_extraido: string | null;
  valor: number;
  marcado_manualmente: boolean;
};

function formataData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function ListaIgnorados({
  lista,
}: {
  lista: TransacaoIgnoradaRow[];
}) {
  const [aberto, setAberto] = useState(false);

  if (lista.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
        >
          <span className={`transition-transform ${aberto ? "rotate-90" : ""}`}>
            ▸
          </span>
          Marcados como &quot;não é apadrinhamento&quot; ({lista.length})
        </button>
        {aberto && <ApagarIgnoradosButton quantidade={lista.length} />}
      </div>

      {aberto && (
        <>
          <p className="text-xs text-muted">
            Os marcados manualmente aparecem primeiro — se marcou algum por
            engano, é aqui que reverte. Os sem nome/valor fora da faixa foram
            ignorados automaticamente.
          </p>
          {lista.map((t) => (
            <div
              key={t.id}
              className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t.nome_extraido ?? t.descricao}
                  {t.marcado_manualmente && (
                    <span className="ml-2 rounded-full bg-brand-pink/15 px-2 py-0.5 text-xs font-medium text-brand-pink">
                      manual
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted">
                  {formataData(t.data)} ·{" "}
                  {t.valor.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
              <ReverterIgnoradoButton id={t.id} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
