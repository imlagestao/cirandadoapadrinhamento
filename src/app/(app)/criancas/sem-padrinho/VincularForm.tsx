"use client";

import { useState, useTransition } from "react";
import { criarPadrinhoEVincular, vincularPadrinhoRapido } from "../actions";

type Padrinho = { id: string; nome: string };

const NOVO = "__novo__";

export default function VincularForm({
  criancaId,
  padrinhos,
}: {
  criancaId: string;
  padrinhos: Padrinho[];
}) {
  const [padrinhoId, setPadrinhoId] = useState("");
  const [nomeNovo, setNomeNovo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState(false);
  const [isPending, startTransition] = useTransition();

  const modoNovo = padrinhoId === NOVO;

  function handleSubmit() {
    setErro(null);

    if (modoNovo) {
      if (!nomeNovo.trim()) {
        setErro("Informe o nome do padrinho/madrinha.");
        return;
      }
      startTransition(async () => {
        const res = await criarPadrinhoEVincular(criancaId, nomeNovo);
        if (res.ok) setFeito(true);
        else setErro(res.erro ?? "Erro ao cadastrar.");
      });
      return;
    }

    if (!padrinhoId) {
      setErro("Selecione um padrinho/madrinha.");
      return;
    }
    startTransition(async () => {
      const res = await vincularPadrinhoRapido(criancaId, padrinhoId);
      if (res.ok) {
        setFeito(true);
      } else {
        setErro(res.erro ?? "Erro ao vincular.");
      }
    });
  }

  if (feito) {
    return (
      <span className="text-xs font-medium text-brand-green-dark">
        Vinculado!
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <select
          value={padrinhoId}
          onChange={(e) => setPadrinhoId(e.target.value)}
          className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground"
        >
          <option value="">Selecione o padrinho/madrinha...</option>
          <option value={NOVO}>➕ Novo padrinho/madrinha...</option>
          {padrinhos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        {modoNovo && (
          <input
            type="text"
            value={nomeNovo}
            onChange={(e) => setNomeNovo(e.target.value)}
            placeholder="Nome completo"
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground"
          />
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="whitespace-nowrap rounded-lg bg-brand-green-dark px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Vinculando..." : "Apadrinhar"}
        </button>
      </div>
      {erro && <span className="text-xs text-red-500">{erro}</span>}
      {modoNovo && (
        <span className="text-xs text-muted">
          Cadastra o padrinho/madrinha e já vincula. Whatsapp, e-mail e outros
          dados dá pra completar depois na ficha dele(a).
        </span>
      )}
    </div>
  );
}
