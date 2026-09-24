import Link from "next/link";
import { getAniversariantesDoMes, MESES_NOME } from "@/lib/aniversarios";
import { linkWhatsapp } from "@/lib/whatsapp";

export default async function AniversariantesPage() {
  const hoje = new Date();
  const mes = hoje.getMonth() + 1;
  const { padrinhos, criancas } = await getAniversariantesDoMes(mes);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Aniversariantes
        </h1>
        <p className="mt-1 text-sm text-muted">
          Padrinhos, madrinhas e crianças que fazem aniversário em{" "}
          {MESES_NOME[mes - 1]}.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Padrinhos e madrinhas ({padrinhos.length})
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="w-16 px-4 py-3 font-medium">Dia</th>
                <th className="px-3 py-3 font-medium">Nome</th>
                <th className="px-3 py-3 font-medium">Afilhado(s)</th>
                <th className="px-3 py-3 font-medium">Contato</th>
              </tr>
            </thead>
            <tbody>
              {padrinhos.map((p) => {
                const wa = linkWhatsapp(
                  p.whatsapp,
                  `Feliz aniversário, ${p.nome}! 🎉 A equipe do Instituto Mãe Lalu deseja um dia muito especial e agradece de coração por fazer parte da Ciranda do Apadrinhamento!`,
                );
                return (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {p.dia}
                    </td>
                    <td className="px-3 py-3 font-medium text-foreground">
                      <Link
                        href={`/padrinhos/${p.id}`}
                        className="text-brand-blue-dark hover:underline"
                      >
                        {p.nome}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-muted">
                      {p.afilhados.length > 0 ? p.afilhados.join(", ") : "—"}
                    </td>
                    <td className="px-3 py-3">
                      {wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="whitespace-nowrap rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-medium text-brand-green-dark hover:bg-brand-green/25"
                        >
                          Parabenizar no WhatsApp
                        </a>
                      ) : (
                        <span className="text-xs text-muted/40">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {padrinhos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Nenhum padrinho ou madrinha faz aniversário este mês.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Crianças e adolescentes ({criancas.length})
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="w-16 px-4 py-3 font-medium">Dia</th>
                <th className="px-3 py-3 font-medium">Nome</th>
                <th className="px-3 py-3 font-medium">Turma</th>
                <th className="px-3 py-3 font-medium">Padrinho/Madrinha</th>
              </tr>
            </thead>
            <tbody>
              {criancas.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {c.dia}
                  </td>
                  <td className="px-3 py-3 font-medium text-foreground">
                    {c.nome}
                  </td>
                  <td className="px-3 py-3 text-muted">{c.turma ?? "—"}</td>
                  <td className="px-3 py-3">
                    {c.padrinhos.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {c.padrinhos.map((p) => {
                          const wa = linkWhatsapp(
                            p.whatsapp,
                            `Oi ${p.nome}! Passando pra lembrar que ${c.nome}, seu afilhado(a), faz aniversário dia ${c.dia}/${mes} 🎂. Que tal mandar uma mensagem carinhosa?`,
                          );
                          return (
                            <div key={p.id} className="flex items-center gap-2">
                              <Link
                                href={`/padrinhos/${p.id}`}
                                className="text-brand-blue-dark hover:underline"
                              >
                                {p.nome}
                              </Link>
                              {wa && (
                                <a
                                  href={wa}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="whitespace-nowrap rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-medium text-brand-green-dark hover:bg-brand-green/25"
                                >
                                  Lembrar no WhatsApp
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-muted/40">Sem padrinho/madrinha</span>
                    )}
                  </td>
                </tr>
              ))}
              {criancas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Nenhuma criança ou adolescente faz aniversário este mês.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
