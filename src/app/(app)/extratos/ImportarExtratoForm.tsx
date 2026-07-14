"use client";

import { useRef, useState, useTransition } from "react";
import { importarExtrato } from "./actions";

export default function ImportarExtratoForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setResultado(null);
    setErro(null);
    startTransition(async () => {
      const res = await importarExtrato(formData);
      if (!res.ok) {
        setErro(res.erro);
        return;
      }
      setResultado(
        `${res.total} lançamentos lidos · ${res.novas} novos · ${res.duplicadas} já importados antes.`,
      );
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
          Importar extrato (PDF)
        </p>
        <p className="text-xs text-muted">
          Envie o extrato mensal do Banco do Brasil ou do Mercado Pago. Pode
          reenviar o mesmo arquivo sem medo — lançamentos repetidos não
          duplicam.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          name="banco"
          required
          defaultValue=""
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
        >
          <option value="" disabled>
            Banco
          </option>
          <option value="Banco do Brasil">Banco do Brasil</option>
          <option value="Mercado Pago">Mercado Pago</option>
        </select>
        <input
          type="file"
          name="arquivo"
          accept=".pdf"
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
        <p className="text-xs font-medium text-brand-green-dark">
          {resultado}
        </p>
      )}
      {erro && <p className="text-xs font-medium text-red-600">{erro}</p>}
    </form>
  );
}
