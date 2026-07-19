"use client";

import { useState, useTransition } from "react";
import { corrigirMensalidadesDesmarcadas } from "./actions";

export default function CorrigirMensalidadesButton() {
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);

  function handleClick() {
    setResultado(null);
    startTransition(async () => {
      const res = await corrigirMensalidadesDesmarcadas();
      setResultado(
        res.ok
          ? `${res.corrigidas} transação(ões) devolvida(s) à fila.`
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
        {isPending ? "Corrigindo..." : "Corrigir mensalidades desmarcadas"}
      </button>
      {resultado && (
        <span className="text-xs text-brand-green-dark">{resultado}</span>
      )}
    </div>
  );
}
