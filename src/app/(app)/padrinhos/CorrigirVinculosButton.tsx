"use client";

import { useState, useTransition } from "react";
import { corrigirVinculosCompostos } from "./actions";

export default function CorrigirVinculosButton() {
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function handleClick() {
    setResultado(null);
    setErro(null);
    startTransition(async () => {
      const res = await corrigirVinculosCompostos();
      if (!res.ok) {
        setErro(res.erro);
        return;
      }
      setResultado(
        res.separados === 0
          ? "Nenhum cadastro composto encontrado."
          : `${res.separados} cadastro(s) separado(s) em fichas individuais.`,
      );
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Separar padrinhos &quot;NOME + NOME&quot; / &quot;NOME / NOME&quot;
        </p>
        <p className="text-xs text-muted">
          Cadastros antigos que juntaram duas pessoas num nome só viram duas
          fichas individuais, cada uma vinculada à(s) mesma(s) criança(s).
        </p>
      </div>
      <div>
        <button
          onClick={handleClick}
          disabled={isPending}
          className="rounded-lg bg-brand-blue-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Separando..." : "Separar agora"}
        </button>
      </div>
      {resultado && (
        <p className="text-xs font-medium text-brand-green-dark">
          {resultado}
        </p>
      )}
      {erro && <p className="text-xs font-medium text-red-600">{erro}</p>}
    </div>
  );
}
