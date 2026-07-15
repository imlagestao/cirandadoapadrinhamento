"use client";

import { useState, useTransition } from "react";
import { reverterIgnorado } from "./actions";

export default function ReverterIgnoradoButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [feito, setFeito] = useState(false);

  if (feito) return <span className="text-xs text-muted">Revertido.</span>;

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await reverterIgnorado(id);
          setFeito(true);
        })
      }
      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-brand-blue-dark transition-colors hover:bg-brand-blue/10 disabled:opacity-60"
    >
      {isPending ? "Revertendo..." : "Reverter (voltar pra fila)"}
    </button>
  );
}
