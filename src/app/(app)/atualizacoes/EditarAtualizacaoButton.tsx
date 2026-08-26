"use client";

import { useState, useTransition } from "react";
import { editarAtualizacao } from "./actions";

export default function EditarAtualizacaoButton({
  id,
  descricaoAtual,
}: {
  id: string;
  descricaoAtual: string;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(descricaoAtual);
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="text-xs font-medium text-brand-blue-dark underline-offset-2 hover:underline"
      >
        Editar
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={2}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
      />
      {erro && <p className="text-xs font-medium text-red-600">{erro}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              setErro(null);
              const res = await editarAtualizacao(id, texto);
              if (!res.ok) {
                setErro(res.erro ?? "Erro ao salvar.");
                return;
              }
              setEditando(false);
            })
          }
          className="rounded-lg bg-brand-green-dark px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setTexto(descricaoAtual);
            setErro(null);
            setEditando(false);
          }}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-background"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
