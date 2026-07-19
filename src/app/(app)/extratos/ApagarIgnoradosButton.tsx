"use client";

import { useState, useTransition } from "react";
import { apagarIgnorados } from "./actions";

export default function ApagarIgnoradosButton({
  quantidade,
}: {
  quantidade: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);

  function handleClick() {
    if (
      !confirm(
        `Apagar definitivamente ${quantidade} lançamento(s) marcado(s) como "não é apadrinhamento"? Isso inclui os marcados manualmente — depois de apagado não dá pra reverter.`,
      )
    ) {
      return;
    }
    setResultado(null);
    startTransition(async () => {
      const res = await apagarIgnorados();
      setResultado(
        res.ok ? `${res.apagadas} apagado(s).` : (res.erro ?? "Erro."),
      );
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        {isPending ? "Apagando..." : "Apagar lista"}
      </button>
      {resultado && <span className="text-xs text-muted">{resultado}</span>}
    </div>
  );
}
