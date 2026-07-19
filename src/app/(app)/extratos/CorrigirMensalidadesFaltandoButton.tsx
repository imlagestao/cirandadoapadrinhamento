"use client";

import { useState, useTransition } from "react";
import { corrigirMensalidadesFaltando } from "./actions";

export default function CorrigirMensalidadesFaltandoButton() {
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);

  function handleClick() {
    setResultado(null);
    startTransition(async () => {
      const res = await corrigirMensalidadesFaltando();
      setResultado(
        res.ok
          ? `${res.corrigidas} mensalidade(s) conferida(s)/corrigida(s).`
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
        {isPending ? "Verificando..." : "Verificar mensalidades das conciliadas"}
      </button>
      {resultado && (
        <span className="text-xs text-brand-green-dark">{resultado}</span>
      )}
    </div>
  );
}
