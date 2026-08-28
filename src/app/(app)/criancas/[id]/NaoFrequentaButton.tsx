"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { marcarNaoFrequenta } from "../actions";

export default function NaoFrequentaButton({
  criancaId,
  nome,
  temPadrinho,
}: {
  criancaId: string;
  nome: string;
  temPadrinho: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleClick() {
    const aviso = temPadrinho
      ? `Marcar ${nome} como não frequenta? Isso solta o padrinho/madrinha vinculado de volta pra fila de "sem padrinho".`
      : `Marcar ${nome} como não frequenta?`;
    if (!confirm(aviso)) return;

    setErro(null);
    startTransition(async () => {
      const res = await marcarNaoFrequenta(criancaId);
      if (!res.ok) {
        setErro(res.erro ?? "Erro ao registrar.");
        return;
      }
      router.push("/criancas");
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
        {isPending ? "Registrando..." : "Não frequenta"}
      </button>
      {erro && <span className="text-xs text-red-600">{erro}</span>}
    </div>
  );
}
