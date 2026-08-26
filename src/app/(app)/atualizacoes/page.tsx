import { createClient } from "@/lib/supabase/server";
import EditarAtualizacaoButton from "./EditarAtualizacaoButton";
import NovaAtualizacaoForm from "./NovaAtualizacaoForm";

type AtualizacaoRow = {
  id: string;
  tipo: string;
  descricao: string;
  origem: "automatico" | "manual";
  autor_email: string | null;
  criado_em: string;
  editado_em: string | null;
};

function formataDataHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AtualizacoesPage() {
  const supabase = await createClient();

  const { data: atualizacoes } = await supabase
    .from("atualizacoes")
    .select("id, tipo, descricao, origem, autor_email, criado_em, editado_em")
    .order("criado_em", { ascending: false })
    .limit(300);

  const lista = (atualizacoes ?? []) as AtualizacaoRow[];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Atualizações
        </h1>
        <p className="mt-1 text-sm text-muted">
          Histórico de cadastros e mudanças — quem fez e quando. Registros
          podem ser editados, mas nunca apagados.
        </p>
      </div>

      <NovaAtualizacaoForm />

      <div className="flex flex-col gap-3">
        {lista.map((a) => (
          <div
            key={a.id}
            className="flex flex-col gap-2 rounded-lg border border-border p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm text-foreground">{a.descricao}</p>
              {a.origem === "manual" && (
                <span className="shrink-0 rounded-full bg-brand-pink/15 px-2 py-0.5 text-xs font-medium text-brand-pink">
                  manual
                </span>
              )}
            </div>
            <p className="text-xs text-muted">
              {formataDataHora(a.criado_em)}
              {a.autor_email && ` · ${a.autor_email}`}
              {a.editado_em && ` · editado em ${formataDataHora(a.editado_em)}`}
            </p>
            <div>
              <EditarAtualizacaoButton id={a.id} descricaoAtual={a.descricao} />
            </div>
          </div>
        ))}
        {lista.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
            Nenhuma atualização registrada ainda.
          </div>
        )}
      </div>
    </div>
  );
}
