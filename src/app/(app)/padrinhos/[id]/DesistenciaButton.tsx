"use client";

import { useState, useTransition } from "react";
import { registrarDesistencia } from "../actions";

export default function DesistenciaButton({
  padrinhoId,
  nome,
  afilhados,
}: {
  padrinhoId: string;
  nome: string;
  afilhados: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [feito, setFeito] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (feito) {
    return (
      <p className="text-sm text-muted">
        Desistência registrada. O cadastro fica inativo, mas o histórico
        continua aqui.
      </p>
    );
  }

  function handleClick() {
    const aviso =
      afilhados > 0
        ? `Registrar desistência de ${nome}? Isso marca o cadastro como inativo e solta ${afilhados} afilhado(s) de volta pra fila de "sem padrinho".`
        : `Registrar desistência de ${nome}? Isso marca o cadastro como inativo.`;
    if (!confirm(aviso)) return;

    setErro(null);
    startTransition(async () => {
      const res = await registrarDesistencia(padrinhoId);
      if (!res.ok) {
        setErro(res.erro ?? "Erro ao registrar.");
        return;
      }
      setFeito(true);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        {isPending ? "Registrando..." : "Desistência do apadrinhamento"}
      </button>
      {erro && <span className="text-xs text-red-600">{erro}</span>}
    </div>
  );
}
