export default function RelatoriosPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Relatórios
        </h1>
        <p className="mt-1 text-sm text-muted">
          Inadimplência, totais por turma/comunidade e exportação para
          prestação de contas.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-5">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Backup completo
          </p>
          <p className="text-xs text-muted">
            Baixa uma cópia em .xlsx de todo o cadastro (público atendido,
            padrinhos/madrinhas e vínculos). Vale guardar periodicamente, além
            dos backups automáticos do banco de dados.
          </p>
        </div>
        <a
          href="/api/backup"
          className="whitespace-nowrap rounded-lg bg-brand-green-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          Baixar backup
        </a>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
        Relatórios de inadimplência e totais chegam na próxima etapa.
      </div>
    </div>
  );
}
