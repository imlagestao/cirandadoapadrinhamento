"use client";

import { useRef, useState, useTransition } from "react";
import { importarPlanilha } from "./actions";

export default function ImportForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setResultado(null);
    setErro(null);
    startTransition(async () => {
      const res = await importarPlanilha(formData);
      if (!res.ok) {
        setErro(res.erro ?? "Erro ao importar.");
        return;
      }
      setResultado(
        `Importado: ${res.criancas} crianças, ${res.padrinhos} padrinhos novos, ${res.vinculos} vínculos criados.`,
      );
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-sm font-semibold text-foreground">
          Importar planilha atual
        </p>
        <p className="text-xs text-muted">
          Envie o .xlsx com as abas de sala (ROSA, AMARELA, VERDE, AZUL,
          CIRAND. MUNDO) e Retirados. Isso substitui o cadastro de crianças
          atual pelo do arquivo enviado.
        </p>
      </div>
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
        <input
          type="file"
          name="arquivo"
          accept=".xlsx"
          required
          className="text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-green/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-green-dark"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-blue-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Importando..." : "Importar"}
        </button>
      </div>
      {resultado && (
        <p className="text-xs font-medium text-brand-green-dark sm:basis-full">
          {resultado}
        </p>
      )}
      {erro && (
        <p className="text-xs font-medium text-red-600 sm:basis-full">
          {erro}
        </p>
      )}
    </form>
  );
}
