import Image from "next/image";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

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
        <div className="px-6 py-6">
          <Image
            src="/logo-ciranda.png"
            alt="Ciranda do Apadrinhamento"
            width={1080}
            height={302}
            className="h-auto w-full"
            priority
          />
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
        <div className="flex flex-col gap-2 px-6 py-4">
          <span className="text-xs text-muted">Instituto Mãe Lalu</span>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center border-b border-border bg-surface px-4 py-3 md:hidden">
          <Image
            src="/logo-ciranda.png"
            alt="Ciranda do Apadrinhamento"
            width={1080}
            height={302}
            className="h-8 w-auto"
            priority
          />
        </header>
        <main className="flex-1 bg-background p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
