"use client";

import { useState, useTransition } from "react";

type CriancaFormValues = {
  nome: string;
  turma: string | null;
  turno: string | null;
  idade: number | null;
  nascimento: string | null;
  comunidade: string | null;
  status: string;
};

type PadrinhoOpcao = { id: string; nome: string };

export default function CriancaForm({
  valoresIniciais,
  padrinhoIdsSelecionados,
  padrinhosDisponiveis,
  acao,
}: {
  valoresIniciais?: Partial<CriancaFormValues>;
  padrinhoIdsSelecionados?: string[];
  padrinhosDisponiveis: PadrinhoOpcao[];
  acao: (formData: FormData) => Promise<{ ok: false; erro: string } | undefined>;
}) {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const res = await acao(formData);
      if (res && !res.ok) {
        setErro(res.erro);
      }
    });
  }

  const campo =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30";
  const rotulo = "text-sm font-medium text-foreground";

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="nome" className={rotulo}>
          Nome *
        </label>
        <input
          id="nome"
          name="nome"
          required
          defaultValue={valoresIniciais?.nome}
          className={campo}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="turma" className={rotulo}>
            Turma
          </label>
          <input
            id="turma"
            name="turma"
            placeholder="Ex: ROSA (A)"
            defaultValue={valoresIniciais?.turma ?? ""}
            className={campo}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="turno" className={rotulo}>
            Turno
          </label>
          <input
            id="turno"
            name="turno"
            defaultValue={valoresIniciais?.turno ?? ""}
            className={campo}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="idade" className={rotulo}>
            Idade
          </label>
          <input
            id="idade"
            name="idade"
            type="number"
            min={0}
            defaultValue={valoresIniciais?.idade ?? ""}
            className={campo}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="nascimento" className={rotulo}>
            Nascimento
          </label>
          <input
            id="nascimento"
            name="nascimento"
            type="date"
            defaultValue={valoresIniciais?.nascimento ?? ""}
            className={campo}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="comunidade" className={rotulo}>
            Comunidade
          </label>
          <input
            id="comunidade"
            name="comunidade"
            defaultValue={valoresIniciais?.comunidade ?? ""}
            className={campo}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="status" className={rotulo}>
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={valoresIniciais?.status ?? "matriculado"}
          className={campo}
        >
          <option value="matriculado">Matriculado</option>
          <option value="retirado">Retirado</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="padrinho_ids" className={rotulo}>
          Padrinho(s)/Madrinha(s)
        </label>
        <select
          id="padrinho_ids"
          name="padrinho_ids"
          multiple
          size={6}
          defaultValue={padrinhoIdsSelecionados}
          className={campo}
        >
          {padrinhosDisponiveis.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted">
          Ctrl/Cmd + clique para selecionar mais de um.
        </p>
      </div>

      {erro && <p className="text-sm font-medium text-red-600">{erro}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-brand-green-dark px-5 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
