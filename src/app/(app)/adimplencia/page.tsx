import Link from "next/link";
import { getGradeAdimplencia, getResumoInadimplencia } from "@/lib/inadimplencia";
import { linkWhatsapp } from "@/lib/whatsapp";

const MESES_ABREV = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const MESES_NOME = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const BUCKETS = [
  { label: "Em dia", min: 0, max: 0, cor: "var(--status-good)" },
  { label: "1 mês sem pagar", min: 1, max: 1, cor: "var(--status-warning)" },
  { label: "2–3 meses sem pagar", min: 2, max: 3, cor: "var(--status-serious)" },
  { label: "4+ meses sem pagar", min: 4, max: Infinity, cor: "var(--status-critical)" },
] as const;

const ABAS = [
  { visao: "graficos", label: "Gráficos" },
  { visao: "lista", label: "Lista completa" },
  { visao: "contatos", label: "Contatos do mês" },
] as const;

function buildHrefContatos(ano: number, mes: number): string {
  return `/adimplencia?visao=contatos&ano=${ano}&mes=${mes}`;
}

export default async function AdimplenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ visao?: string; ano?: string; mes?: string }>;
}) {
  const { visao: visaoParam, ano: anoParam, mes: mesParam } = await searchParams;
  const visao =
    visaoParam === "lista" || visaoParam === "contatos" ? visaoParam : "graficos";

  const { meses, linhas } = await getGradeAdimplencia();
  const total = linhas.length;

  const hoje = new Date();
  const anoSelecionado = Number(anoParam) || hoje.getFullYear();
  const mesSelecionado = Number(mesParam) || hoje.getMonth() + 1;
  const selecaoValida = meses.some(
    (m) => m.ano === anoSelecionado && m.mes === mesSelecionado,
  );
  const anoContatos = selecaoValida ? anoSelecionado : hoje.getFullYear();
  const mesContatos = selecaoValida ? mesSelecionado : hoje.getMonth() + 1;
  const resumoContatos =
    visao === "contatos"
      ? await getResumoInadimplencia(anoContatos, mesContatos)
      : null;

  const mesAtualIndex = meses.length - 1;
  const adimplentesMesAtual = linhas.filter((l) => l.pagamentos[mesAtualIndex]).length;
  const percentualMesAtual = total > 0 ? Math.round((adimplentesMesAtual / total) * 100) : 0;
  const emDiaSempre = linhas.filter((l) => l.totalPago === meses.length).length;
  const cronicos = linhas.filter((l) => l.mesesSeguidosSemPagar >= 2).length;

  const percentualPorMes = meses.map((_, i) => {
    if (total === 0) return 0;
    const pagaram = linhas.filter((l) => l.pagamentos[i]).length;
    return Math.round((pagaram / total) * 100);
  });

  const buckets = BUCKETS.map((b) => ({
    ...b,
    quantidade: linhas.filter(
      (l) => l.mesesSeguidosSemPagar >= b.min && l.mesesSeguidosSemPagar <= b.max,
    ).length,
  }));
  const maiorBucket = Math.max(1, ...buckets.map((b) => b.quantidade));

  const linhasOrdenadas = [...linhas].sort(
    (a, b) => b.mesesSeguidosSemPagar - a.mesesSeguidosSemPagar,
  );

  return (
    <div className="viz-root mx-auto flex max-w-6xl flex-col gap-6">
      <style>{`
        .viz-root {
          --status-good: #0ca30c;
          --status-warning: #fab219;
          --status-serious: #ec835a;
          --status-critical: #d03b3b;
        }
      `}</style>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Adimplência
        </h1>
        <p className="mt-1 text-sm text-muted">
          Panorama de pagamento dos padrinhos/madrinhas ativos, mês a mês.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border border-l-4 border-l-brand-green bg-surface p-5 shadow-sm">
          <p className="text-sm text-muted">
            Adimplência em {MESES_ABREV[(meses[mesAtualIndex]?.mes ?? 1) - 1]}
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {percentualMesAtual}%
          </p>
          <p className="mt-1 text-xs text-muted">
            {adimplentesMesAtual} de {total} pagaram
          </p>
        </div>
        <div className="rounded-xl border border-border border-l-4 border-l-brand-blue bg-surface p-5 shadow-sm">
          <p className="text-sm text-muted">Em dia todos os meses</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{emDiaSempre}</p>
          <p className="mt-1 text-xs text-muted">de {total} ativos</p>
        </div>
        <div className="rounded-xl border border-border border-l-4 border-l-brand-pink bg-surface p-5 shadow-sm">
          <p className="text-sm text-muted">Sem pagar há 2+ meses seguidos</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{cronicos}</p>
          <p className="mt-1 text-xs text-muted">vale um contato direto</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border">
        {ABAS.map((aba) => (
          <Link
            key={aba.visao}
            href={`/adimplencia?visao=${aba.visao}`}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              visao === aba.visao
                ? "border-b-2 border-brand-green-dark text-brand-green-dark"
                : "text-muted hover:text-foreground"
            }`}
          >
            {aba.label}
          </Link>
        ))}
      </div>

      {visao === "graficos" && (
        <>
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Adimplência por mês
            </h2>
            <p className="mb-4 text-xs text-muted">
              % de padrinhos/madrinhas ativos com pagamento confirmado no mês.
            </p>
            <div className="flex h-40 items-end gap-3 sm:gap-5">
              {meses.map((m, i) => {
                const pct = percentualPorMes[i];
                return (
                  <div
                    key={`${m.ano}-${m.mes}`}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <span className="text-xs font-semibold text-foreground">
                      {pct}%
                    </span>
                    <div className="flex h-28 w-full max-w-8 items-end justify-center">
                      <div
                        className="w-full rounded-t-[4px] bg-brand-green-dark"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted">
                      {MESES_ABREV[m.mes - 1]}
                    </span>
                  </div>
                );
              })}
              {meses.length === 0 && (
                <p className="text-sm text-muted">Sem dados ainda.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Tempo sem pagar
            </h2>
            <p className="mb-4 text-xs text-muted">
              Quantos padrinhos/madrinhas ativos estão em cada faixa, hoje.
            </p>
            <div className="flex flex-col gap-3">
              {buckets.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: b.cor }}
                  />
                  <span className="w-40 shrink-0 text-sm text-foreground">
                    {b.label}
                  </span>
                  <div className="h-5 flex-1 overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(b.quantidade / maiorBucket) * 100}%`,
                        backgroundColor: b.cor,
                      }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-sm font-semibold text-foreground">
                    {b.quantidade}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {visao === "lista" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="sticky left-0 bg-surface px-4 py-3 font-medium">
                  Padrinho/Madrinha
                </th>
                {meses.map((m) => (
                  <th
                    key={`${m.ano}-${m.mes}`}
                    className="px-3 py-3 text-center font-medium"
                  >
                    {MESES_ABREV[m.mes - 1]}
                  </th>
                ))}
                <th className="px-3 py-3 text-center font-medium">
                  Seguidos sem pagar
                </th>
                <th className="px-3 py-3 font-medium">Contato</th>
              </tr>
            </thead>
            <tbody>
              {linhasOrdenadas.map((linha) => {
                const wa = linkWhatsapp(linha.whatsapp);
                return (
                  <tr key={linha.id} className="border-b border-border last:border-0">
                    <td className="sticky left-0 bg-surface px-4 py-2 font-medium text-foreground">
                      <Link
                        href={`/padrinhos/${linha.id}`}
                        className="text-brand-blue-dark hover:underline"
                      >
                        {linha.nome}
                      </Link>
                    </td>
                    {linha.pagamentos.map((pago, i) => (
                      <td key={i} className="px-3 py-2 text-center">
                        {pago ? (
                          <span className="text-brand-green-dark">✓</span>
                        ) : (
                          <span className="text-muted/40">—</span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center">
                      {linha.mesesSeguidosSemPagar > 0 ? (
                        <span
                          className={
                            linha.mesesSeguidosSemPagar >= 2
                              ? "font-semibold text-red-500"
                              : "text-muted"
                          }
                        >
                          {linha.mesesSeguidosSemPagar}
                        </span>
                      ) : (
                        <span className="text-muted/40">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="whitespace-nowrap rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-medium text-brand-green-dark hover:bg-brand-green/25"
                        >
                          WhatsApp
                        </a>
                      ) : (
                        <span className="text-xs text-muted/40">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {linhasOrdenadas.length === 0 && (
                <tr>
                  <td
                    colSpan={meses.length + 3}
                    className="px-4 py-8 text-center text-muted"
                  >
                    Nenhum padrinho/madrinha ativo cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {visao === "contatos" && resumoContatos && (
        <>
          <div className="flex flex-wrap gap-2">
            {meses.map((m) => (
              <Link
                key={`${m.ano}-${m.mes}`}
                href={buildHrefContatos(m.ano, m.mes)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  m.ano === anoContatos && m.mes === mesContatos
                    ? "bg-brand-blue-dark text-white"
                    : "bg-brand-blue/10 text-brand-blue-dark hover:bg-brand-blue/20"
                }`}
              >
                {MESES_NOME[m.mes - 1]}/{m.ano}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm text-muted">Padrinhos ativos</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {resumoContatos.totalAtivos}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm text-muted">
                Pagaram em {MESES_NOME[mesContatos - 1]}
              </p>
              <p className="mt-2 text-3xl font-bold text-brand-green-dark">
                {resumoContatos.pagaram}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm text-muted">Sem pagamento identificado</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {resumoContatos.inadimplentes.length}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Padrinho/Madrinha</th>
                  <th className="px-4 py-3 font-medium">Contato</th>
                  <th className="px-4 py-3 font-medium">Crianças apadrinhadas</th>
                </tr>
              </thead>
              <tbody>
                {resumoContatos.inadimplentes.map((p) => {
                  const wa = linkWhatsapp(p.whatsapp);
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">
                        <Link
                          href={`/padrinhos/${p.id}`}
                          className="text-brand-blue-dark hover:underline"
                        >
                          {p.nome}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        <div className="flex items-center gap-2">
                          <span>
                            {[p.whatsapp, p.email].filter(Boolean).join(" · ") ||
                              "—"}
                          </span>
                          {wa && (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="whitespace-nowrap rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-medium text-brand-green-dark hover:bg-brand-green/25"
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {p.criancas.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {p.criancas.map((nome) => (
                              <span key={nome}>{nome}</span>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
                {resumoContatos.inadimplentes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted">
                      Nenhum padrinho/madrinha sem pagamento identificado neste
                      mês.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
