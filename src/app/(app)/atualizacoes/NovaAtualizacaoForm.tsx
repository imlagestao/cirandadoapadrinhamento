"use client";

import { useRef, useState, useTransition } from "react";
import { criarAtualizacaoManual } from "./actions";
import { SITUACOES, type Situacao } from "@/lib/situacoes";

const CLASSES_BOTAO_COR: Record<string, string> = {
  "brand-blue": "border-brand-blue bg-brand-blue/15 text-brand-blue-dark",
  "brand-green": "border-brand-green bg-brand-green/15 text-brand-green-dark",
  "brand-pink": "border-brand-pink bg-brand-pink/15 text-brand-pink",
  red: "border-red-400 bg-red-50 text-red-600",
  amber: "border-amber-400 bg-amber-50 text-amber-700",
};

export default function NovaAtualizacaoForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [situacao, setSituacao] = useState<Situacao | "">("");

  function handleSubmit(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const res = await criarAtualizacaoManual(formData);
      if (!res.ok) {
        setErro(res.erro ?? "Erro ao salvar.");
        return;
      }
      formRef.current?.reset();
      setSituacao("");
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

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted">Situação</p>
        <div className="flex flex-wrap gap-2">
          {SITUACOES.map((s) => {
            const ativo = situacao === s.valor;
            return (
              <button
                key={s.valor}
                type="button"
                onClick={() => setSituacao(s.valor)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  ativo
                    ? CLASSES_BOTAO_COR[s.cor]
                    : "border-border text-muted hover:bg-background"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="situacao" value={situacao} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <textarea
          name="descricao"
          required
          rows={2}
          placeholder="O que aconteceu..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
        />
        <div className="flex flex-col gap-2">
          <input
            type="date"
            name="data"
            title="Data do que aconteceu (deixe em branco pra usar hoje)"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
          />
          <button
            type="submit"
            disabled={isPending || !situacao}
            className="rounded-lg bg-brand-green-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Salvando..." : "Registrar"}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted">
        Deixe a data em branco pra registrar com a data de hoje. Pra algo de
        um mês anterior, escolha a data certa — a atualização aparece
        agrupada no mês correspondente.
      </p>
      {erro && <p className="text-xs font-medium text-red-600">{erro}</p>}
    </form>
  );
}
