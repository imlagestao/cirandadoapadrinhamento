"use client";

import { useState, useTransition } from "react";
import {
  confirmarConciliacao,
  confirmarConciliacaoDividida,
  ignorarTransacao,
} from "./actions";
import type { SugestaoPadrinho } from "@/lib/extratos/sugestao";

type Transacao = {
  id: string;
  data: string;
  descricao: string;
  nomeExtraido: string | null;
  valor: number;
};

function formataData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formataValor(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const VALORES_MENSALIDADE = [20, 25];

// Sugestão sobre um valor que não é exatamente "1 afilhado x mensalidade":
// pode ser porque esse padrinho tem mais de um afilhado (valor normal), o PIX
// cobre mais de um mês, ou é contribuição extra — não dá pra saber sozinho
// qual dos casos é, então é só um alerta pra equipe conferir, nunca decide
// nada automaticamente. Testa tanto os valores padrão (R$20/25) quanto o
// valor habitual desse padrinho específico, se tiver histórico.
function dicaValor(
  valor: number,
  afilhados: number,
  valorHabitualPorAfilhado: number | null,
): { multiplos: string[] } | null {
  const bases = [
    ...new Set(
      [valorHabitualPorAfilhado, ...VALORES_MENSALIDADE].filter(
        (b): b is number => !!b && b > 0,
      ),
    ),
  ];

  if (afilhados > 0) {
    const bateComAfilhados = bases.some(
      (base) => Math.abs(valor - afilhados * base) < 0.01,
    );
    if (bateComAfilhados) return null;
  }

  const multiplos = bases
    .map((base) => {
      const n = valor / base;
      return Number.isInteger(n) && n >= 2 ? `${n}x R$${base}` : null;
    })
    .filter((m): m is string => m !== null);

  return multiplos.length > 0 ? { multiplos } : null;
}

function gerarMesesVizinhos(
  dataIso: string,
): { ano: number; mes: number; chave: string; label: string }[] {
  const [anoBase, mesBase] = dataIso.split("-").map(Number);
  const vizinhos: { ano: number; mes: number; chave: string; label: string }[] = [];
  for (let offset = -6; offset <= 6; offset++) {
    if (offset === 0) continue;
    const totalMeses = (mesBase - 1) + offset;
    const ano = anoBase + Math.floor(totalMeses / 12);
    const mes = ((totalMeses % 12) + 12) % 12 + 1;
    vizinhos.push({
      ano,
      mes,
      chave: `${ano}-${mes}`,
      label: `${MESES_ABREV[mes - 1]}/${String(ano).slice(2)}`,
    });
  }
  return vizinhos;
}

const MESES_ABREV = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export default function ConciliacaoItem({
  transacao,
  sugestoes,
  padrinhosDisponiveis,
}: {
  transacao: Transacao;
  sugestoes: SugestaoPadrinho[];
  padrinhosDisponiveis: {
    id: string;
    nome: string;
    afilhados: number;
    mesesPagos: string[];
    valorHabitual: { total: number; data: string; porAfilhado: number } | null;
  }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [feito, setFeito] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState(
    sugestoes[0]?.id ?? "",
  );
  const [mostrarMesesExtras, setMostrarMesesExtras] = useState(false);
  const [mesesExtras, setMesesExtras] = useState<Set<string>>(new Set());
  const [mostrarExtra, setMostrarExtra] = useState(false);
  const [temExtra, setTemExtra] = useState(false);
  const [valorExtra, setValorExtra] = useState("");
  const [mostrarDivisao, setMostrarDivisao] = useState(false);
  const [partes, setPartes] = useState<{ padrinhoId: string; valor: string }[]>([
    { padrinhoId: "", valor: "" },
    { padrinhoId: "", valor: "" },
  ]);

  const todosMesesVizinhos = gerarMesesVizinhos(transacao.data);
  const mesesPagosSelecionado = new Set(
    padrinhosDisponiveis.find((p) => p.id === selecionado)?.mesesPagos ?? [],
  );
  // Não faz sentido oferecer marcar como "mês adicional" um mês que esse
  // padrinho já tem pago — só polui a lista e pode levar a marcar de novo.
  const mesesVizinhos = todosMesesVizinhos.filter(
    (m) => !mesesPagosSelecionado.has(m.chave),
  );

  function alternarMesExtra(chave: string, marcado: boolean) {
    setMesesExtras((atual) => {
      const novo = new Set(atual);
      if (marcado) novo.add(chave);
      else novo.delete(chave);
      return novo;
    });
  }

  function confirmar() {
    if (!selecionado) return;
    setErro(null);
    const extras = mesesVizinhos
      .filter((m) => mesesExtras.has(m.chave))
      .map((m) => ({ ano: m.ano, mes: m.mes }));
    const valorExtraNumero = parseFloat(valorExtra.replace(",", "."));
    const contribuicaoExtra = temExtra
      ? { valor: Number.isFinite(valorExtraNumero) ? valorExtraNumero : undefined }
      : undefined;
    startTransition(async () => {
      const res = await confirmarConciliacao(
        transacao.id,
        selecionado,
        extras,
        contribuicaoExtra,
      );
      if (!res.ok) {
        setErro(res.erro ?? "Erro ao confirmar.");
        return;
      }
      setFeito(true);
    });
  }

  function atualizarParte(indice: number, campo: "padrinhoId" | "valor", valor: string) {
    setPartes((atual) =>
      atual.map((p, i) => (i === indice ? { ...p, [campo]: valor } : p)),
    );
  }

  function adicionarParte() {
    setPartes((atual) => [...atual, { padrinhoId: "", valor: "" }]);
  }

  function removerParte(indice: number) {
    setPartes((atual) => atual.filter((_, i) => i !== indice));
  }

  function confirmarDivisao() {
    setErro(null);
    const partesValidas = partes
      .map((p) => ({ padrinhoId: p.padrinhoId, valor: parseFloat(p.valor.replace(",", ".")) }))
      .filter((p) => p.padrinhoId && Number.isFinite(p.valor) && p.valor > 0);

    if (partesValidas.length < 2) {
      setErro("Preencha padrinho e valor de pelo menos 2 partes.");
      return;
    }

    startTransition(async () => {
      const res = await confirmarConciliacaoDividida(transacao.id, partesValidas);
      if (!res.ok) {
        setErro(res.erro ?? "Erro ao confirmar.");
        return;
      }
      setFeito(true);
    });
  }

  function ignorar() {
    setErro(null);
    startTransition(async () => {
      const res = await ignorarTransacao(transacao.id);
      if (!res.ok) {
        setErro(res.erro ?? "Erro ao ignorar.");
        return;
      }
      setFeito(true);
    });
  }

  if (feito) return null;

  const melhorScore = sugestoes[0]?.score ?? 0;
  const padrinhoSelecionado = padrinhosDisponiveis.find((p) => p.id === selecionado);
  const afilhadosSelecionado = padrinhoSelecionado?.afilhados ?? 0;
  const dica = dicaValor(
    transacao.valor,
    afilhadosSelecionado,
    padrinhoSelecionado?.valorHabitual?.porAfilhado ?? null,
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            {transacao.nomeExtraido ?? transacao.descricao}
          </p>
          <p className="text-xs text-muted">
            {formataData(transacao.data)} · {formataValor(transacao.valor)}
          </p>
          {melhorScore > 0 && melhorScore < 1 && (
            <p className="text-xs text-brand-blue-dark">
              Sugestão por nome parecido ({Math.round(melhorScore * 100)}% de
              confiança)
            </p>
          )}
          {padrinhoSelecionado && (
            <p className="mt-1 inline-block rounded-md bg-brand-green-dark px-2 py-1 text-xs font-medium text-white">
              {afilhadosSelecionado} afilhado(s)
            </p>
          )}
          {dica && (
            <div className="mt-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <p className="font-semibold">⚠️ Valor não bate!</p>
              <p>
                Pode ser {dica.multiplos.join(" ou ")} (meses adicionais) ou
                outra situação. <span className="font-bold">Apurar.</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={selecionado}
            onChange={(e) => setSelecionado(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
          >
            <option value="">Selecione o padrinho...</option>
            {sugestoes.length > 0 && (
              <optgroup label="Sugestões">
                {sugestoes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} ({Math.round(s.score * 100)}%)
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Todos os padrinhos">
              {padrinhosDisponiveis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </optgroup>
          </select>
          <button
            type="button"
            onClick={confirmar}
            disabled={isPending || !selecionado}
            className="rounded-lg bg-brand-green-dark px-3 py-2 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
          >
            Confirmar
          </button>
          <button
            type="button"
            onClick={ignorar}
            disabled={isPending}
            className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-background disabled:opacity-60"
          >
            Não é apadrinhamento
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
      <div>
        <button
          type="button"
          onClick={() => setMostrarMesesExtras((v) => !v)}
          className="text-xs font-medium text-brand-blue-dark underline-offset-2 hover:underline"
        >
          {mostrarMesesExtras ? "− ocultar meses adicionais" : "+ marcar meses adicionais"}
        </button>
        {mostrarMesesExtras && (
          <div className="mt-2 flex flex-wrap gap-2">
            {mesesVizinhos.map((m) => (
              <label
                key={m.chave}
                className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground"
              >
                <input
                  type="checkbox"
                  checked={mesesExtras.has(m.chave)}
                  onChange={(e) => alternarMesExtra(m.chave, e.target.checked)}
                  className="h-3 w-3 accent-brand-green-dark"
                />
                {m.label}
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setMostrarExtra((v) => !v)}
          className="text-xs font-medium text-brand-blue-dark underline-offset-2 hover:underline"
        >
          {mostrarExtra ? "− ocultar contribuição extra" : "+ contribuição extra"}
        </button>
        {mostrarExtra && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-foreground">
              <input
                type="checkbox"
                checked={temExtra}
                onChange={(e) => setTemExtra(e.target.checked)}
                className="h-3 w-3 accent-brand-green-dark"
              />
              Teve contribuição acima da mensalidade
            </label>
            {temExtra && (
              <input
                type="text"
                inputMode="decimal"
                placeholder="Quanto, se souber (R$)"
                value={valorExtra}
                onChange={(e) => setValorExtra(e.target.value)}
                className="w-40 rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
              />
            )}
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setMostrarDivisao((v) => !v)}
          className="text-xs font-medium text-brand-blue-dark underline-offset-2 hover:underline"
        >
          {mostrarDivisao
            ? "− ocultar divisão entre padrinhos"
            : "+ dividir entre padrinhos diferentes"}
        </button>
        {mostrarDivisao && (
          <div className="mt-2 flex flex-col gap-2 rounded-lg border border-border p-3">
            <p className="text-xs text-muted">
              Pra quando um PIX junta a contribuição de mais de uma pessoa.
              Marca o mês de cada padrinho, sem meses extras nem contribuição
              extra por parte — ajuste depois na ficha se precisar.
            </p>
            {partes.map((parte, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <select
                  value={parte.padrinhoId}
                  onChange={(e) => atualizarParte(i, "padrinhoId", e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
                >
                  <option value="">Selecione o padrinho...</option>
                  {padrinhosDisponiveis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Valor (R$)"
                  value={parte.valor}
                  onChange={(e) => atualizarParte(i, "valor", e.target.value)}
                  className="w-28 rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
                />
                {partes.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removerParte(i)}
                    className="text-xs text-muted hover:text-red-600"
                  >
                    remover
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={adicionarParte}
              className="self-start text-xs font-medium text-brand-blue-dark underline-offset-2 hover:underline"
            >
              + adicionar outro
            </button>
            <p className="text-xs text-muted">
              Soma das partes: {formataValor(
                partes.reduce((acc, p) => acc + (parseFloat(p.valor.replace(",", ".")) || 0), 0),
              )}{" "}
              · Valor do PIX: {formataValor(transacao.valor)}
            </p>
            <button
              type="button"
              onClick={confirmarDivisao}
              disabled={isPending}
              className="self-start rounded-lg bg-brand-green-dark px-3 py-2 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
            >
              Confirmar divisão
            </button>
          </div>
        )}
      </div>
      </div>

      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  );
}
