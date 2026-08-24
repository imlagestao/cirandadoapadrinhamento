"use client";

import { usePathname, useRouter } from "next/navigation";

export default function BotaoVoltar() {
  const router = useRouter();
  const pathname = usePathname();

  // No painel inicial não há "página anterior" dentro do sistema — o menu
  // já cobre a navegação a partir dali.
  if (pathname === "/") return null;

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-brand-green/10 hover:text-brand-green-dark"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path
          d="M15 18l-6-6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Voltar
    </button>
  );
}
