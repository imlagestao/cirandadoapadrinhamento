"use client";

import { useTransition } from "react";

const MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export default function MensalidadesGrid({
  padrinhoId,
  ano,
  pagos,
  alternar,
}: {
  padrinhoId: string;
  ano: number;
  pagos: Set<number>;
  alternar: (
    padrinhoId: string,
    ano: number,
    mes: number,
    pago: boolean,
  ) => Promise<{ ok: boolean; erro?: string }>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(mes: number, checked: boolean) {
    startTransition(async () => {
      await alternar(padrinhoId, ano, mes, checked);
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-center text-sm">
        <thead>
          <tr>
            {MESES.map((m) => (
              <th
                key={m}
                className="bg-brand-blue-dark px-2 py-2 text-xs font-semibold uppercase text-white"
              >
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {MESES.map((_, i) => {
              const mes = i + 1;
              return (
                <td key={mes} className="border-t border-border px-2 py-3">
                  <input
                    type="checkbox"
                    disabled={isPending}
                    defaultChecked={pagos.has(mes)}
                    onChange={(e) => handleToggle(mes, e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-brand-green-dark"
                  />
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
