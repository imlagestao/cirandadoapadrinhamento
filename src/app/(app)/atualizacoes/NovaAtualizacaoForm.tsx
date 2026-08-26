"use client";

import { useRef, useState, useTransition } from "react";
import { criarAtualizacaoManual } from "./actions";

export default function NovaAtualizacaoForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const res = await criarAtualizacaoManual(formData);
      if (!res.ok) {
        setErro(res.erro ?? "Erro ao salvar.");
        return;
      }
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5"
    >
      <div>
        <p className="text-sm font-semibold text-foreground">
          Registrar atualização manualmente
        </p>
        <p className="text-xs text-muted">
          Pra algo que não foi feito por aqui (ex: combinado por telefone) e
          precisa ficar registrado mesmo assim.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <textarea
          name="descricao"
          required
          rows={2}
          placeholder="O que aconteceu..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-blue-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Salvando..." : "Registrar"}
        </button>
      </div>
      {erro && <p className="text-xs font-medium text-red-600">{erro}</p>}
    </form>
  );
}
