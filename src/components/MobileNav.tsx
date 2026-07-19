"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { NAV_ITEMS } from "@/components/navItems";

export default function MobileNav() {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={aberto}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground"
      >
        {aberto ? (
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {aberto && (
        <nav className="absolute right-0 top-full z-20 mt-2 w-64 flex-col gap-1 rounded-xl border border-border bg-surface p-3 shadow-lg">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-brand-green/10 hover:text-brand-green-dark"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 border-t border-border px-3 pt-3">
            <LogoutButton />
          </div>
        </nav>
      )}
    </div>
  );
}
