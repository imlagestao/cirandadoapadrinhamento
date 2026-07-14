"use client";

import { useTransition } from "react";
import { excluirPadrinho } from "./actions";

export default function ExcluirPadrinhoButton({
  id,
  nome,
}: {
  id: string;
  nome: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        `Excluir "${nome}" definitivamente? Isso remove o cadastro e qualquer vínculo com crianças. Não pode ser desfeito.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      await excluirPadrinho(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="self-start text-sm font-medium text-red-600 transition-colors hover:underline disabled:opacity-60"
    >
      {isPending ? "Excluindo..." : "Excluir cadastro"}
    </button>
  );
}
