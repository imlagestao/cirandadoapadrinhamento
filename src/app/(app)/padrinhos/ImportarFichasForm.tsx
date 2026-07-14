"use client";

import { useRef, useState, useTransition } from "react";
import { importarFichasGoogleDocs } from "./actions";

export default function ImportarFichasForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setResultado(null);
    setErro(null);
    startTransition(async () => {
      const res = await importarFichasGoogleDocs(formData);
      if (!res.ok) {
        setErro(res.erro ?? "Erro ao importar.");
        return;
      }
      const partes = [
        `${res.encontrados} fichas encontradas`,
        `${res.atualizados} padrinhos atualizados`,
        `${res.semMudanca} já estavam completos`,
      ];
      if (res.naoEncontrados.length > 0) {
        partes.push(
          `${res.naoEncontrados.length} não encontrados no sistema (provavelmente inativos): ${res.naoEncontrados.join(", ")}`,
        );
      }
      setResultado(partes.join(" · "));
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
          Importar fichas do Google Docs
        </p>
        <p className="text-xs text-muted">
          Preenche whatsapp, e-mail, endereço, nascimento e data de início
          para os padrinhos já cadastrados que existirem no documento. Não
          sobrescreve dados já preenchidos, nem cadastra gente nova.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          name="url"
          required
          placeholder="https://docs.google.com/document/d/..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
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
