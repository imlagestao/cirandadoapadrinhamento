import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Painel" },
  { href: "/criancas", label: "Crianças" },
  { href: "/padrinhos", label: "Padrinhos" },
  { href: "/extratos", label: "Extratos & Conciliação" },
  { href: "/relatorios", label: "Relatórios" },
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
        <div className="flex items-center gap-2 px-6 py-6">
          <HandHeartMark />
          <div className="leading-tight">
            <p className="text-lg font-bold text-brand-green-dark">Ciranda do</p>
            <p className="-mt-1 text-lg font-bold text-brand-blue-dark">
              Apadrinhamento
            </p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-brand-green/10 hover:text-brand-green-dark"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-4 text-xs text-muted">Instituto Mãe Lalu</div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <HandHeartMark size={28} />
            <span className="font-bold text-brand-green-dark">Ciranda</span>
          </div>
        </header>
        <main className="flex-1 bg-background p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}

function HandHeartMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M14 30V16a3 3 0 0 1 6 0v10M20 26V13a3 3 0 0 1 6 0v13M26 26V15a3 3 0 0 1 6 0v11M32 27v-8a3 3 0 0 1 6 0v18c0 8-6 14-14 14s-13-4-16-10l-6-13a3 3 0 0 1 5-3l4 6"
        stroke="var(--brand-green)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30 12c0-3 2-5 4.5-5s4.5 2 4.5 5c0 3-4.5 7-4.5 7s-4.5-4-4.5-7Z"
        fill="var(--brand-pink)"
      />
    </svg>
  );
}
