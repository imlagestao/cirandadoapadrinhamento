"use client";

import { useState, useTransition } from "react";
import { ignorarValoresForaDaFaixa } from "./actions";
import {
  VALOR_MAXIMO_APADRINHAMENTO,
  VALOR_MINIMO_APADRINHAMENTO,
} from "@/lib/extratos/tipos";

export default function IgnorarValoresBaixosButton() {
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);

  function handleClick() {
    setResultado(null);
    startTransition(async () => {
      const res = await ignorarValoresForaDaFaixa();
      setResultado(
        res.ok
          ? `${res.ignoradas} removido(s) da fila.`
          : (res.erro ?? "Erro."),
      );
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-background disabled:opacity-60"
      >
        {isPending
          ? "Removendo..."
          : `Ignorar valores fora de R$ ${VALOR_MINIMO_APADRINHAMENTO}–${VALOR_MAXIMO_APADRINHAMENTO}`}
      </button>
      {resultado && (
        <span className="text-xs text-brand-green-dark">{resultado}</span>
      )}
    </div>
  );
}
