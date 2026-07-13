const STATS = [
  { label: "Crianças cadastradas", value: "—", accent: "green" },
  { label: "Padrinhos ativos", value: "—", accent: "blue" },
  { label: "Pendentes de conciliação", value: "—", accent: "pink" },
  { label: "Possível inadimplência", value: "—", accent: "green" },
] as const;

const ACCENT_CLASSES: Record<(typeof STATS)[number]["accent"], string> = {
  green: "border-l-brand-green",
  blue: "border-l-brand-blue",
  pink: "border-l-brand-pink",
};

export default function Home() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Painel geral
        </h1>
        <p className="mt-1 text-sm text-muted">
          Visão geral do apadrinhamento — dados chegam assim que o banco for
          conectado.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border border-border border-l-4 bg-surface p-5 shadow-sm ${
              ACCENT_CLASSES[stat.accent]
            }`}
          >
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
        Conecte o Supabase para começar a importar crianças, padrinhos e
        extratos.
      </div>
    </div>
  );
}
