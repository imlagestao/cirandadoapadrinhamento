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

function formataDataCurta(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

export default function MensalidadesGrid({
  padrinhoId,
  ano,
  pagos,
  detalhes,
  alternar,
}: {
  padrinhoId: string;
  ano: number;
  pagos: Set<number>;
  detalhes: Map<number, { valor: number; data: string } | null>;
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
              const pago = pagos.has(mes);
              const detalhe = detalhes.get(mes);
              return (
                <td key={mes} className="border-t border-border px-2 py-3">
                  <div className="flex flex-col items-center gap-1">
                    <input
                      type="checkbox"
                      disabled={isPending}
                      defaultChecked={pago}
                      onChange={(e) => handleToggle(mes, e.target.checked)}
                      className="h-4 w-4 rounded border-border accent-brand-green-dark"
                    />
                    {pago && (
                      <span className="text-[10px] leading-tight text-muted">
                        {detalhe
                          ? `R$${detalhe.valor} · ${formataDataCurta(detalhe.data)}`
                          : "manual"}
                      </span>
                    )}
                  </div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
