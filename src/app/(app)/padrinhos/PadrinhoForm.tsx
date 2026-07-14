"use client";

import { useState, useTransition } from "react";

type PadrinhoFormValues = {
  nome: string;
  whatsapp: string | null;
  email: string | null;
  cpf: string | null;
  nascimento: string | null;
  endereco: string | null;
  padrinho_desde: string | null;
  pendencia: boolean;
  status: string;
  observacoes: string | null;
};

export default function PadrinhoForm({
  valoresIniciais,
  acao,
}: {
  valoresIniciais?: Partial<PadrinhoFormValues>;
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
          Nome completo *
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
          <label htmlFor="cpf" className={rotulo}>
            CPF
          </label>
          <input
            id="cpf"
            name="cpf"
            defaultValue={valoresIniciais?.cpf ?? ""}
            className={campo}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="whatsapp" className={rotulo}>
            Whatsapp
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            defaultValue={valoresIniciais?.whatsapp ?? ""}
            className={campo}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="endereco" className={rotulo}>
          Endereço
        </label>
        <input
          id="endereco"
          name="endereco"
          defaultValue={valoresIniciais?.endereco ?? ""}
          className={campo}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className={rotulo}>
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={valoresIniciais?.email ?? ""}
            className={campo}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="padrinho_desde" className={rotulo}>
            Padrinho/madrinha desde
          </label>
          <input
            id="padrinho_desde"
            name="padrinho_desde"
            type="date"
            defaultValue={valoresIniciais?.padrinho_desde ?? ""}
            className={campo}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className={rotulo}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={valoresIniciais?.status ?? "ativo"}
            className={campo}
          >
            <option value="ativo">Ativo</option>
            <option value="inadimplente">Inadimplente</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="pendencia"
          defaultChecked={valoresIniciais?.pendencia}
          className="h-4 w-4 rounded border-border"
        />
        Pendência este ano
      </label>

      <div className="flex flex-col gap-1">
        <label htmlFor="observacoes" className={rotulo}>
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={3}
          defaultValue={valoresIniciais?.observacoes ?? ""}
          className={campo}
        />
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
