import { createClient } from "@/lib/supabase/server";
import AtualizacoesLista from "./AtualizacoesLista";
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

export default async function AtualizacoesPage() {
  const supabase = await createClient();

  const { data: atualizacoes } = await supabase
    .from("atualizacoes")
    .select("id, tipo, descricao, origem, autor_email, criado_em, editado_em")
    .order("criado_em", { ascending: false })
    .limit(1000);

  const lista = (atualizacoes ?? []) as AtualizacaoRow[];

  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Atualizações
        </h1>
        <p className="mt-1 text-sm text-muted">
          Histórico de cadastros e mudanças — quem fez e quando. Registros
          podem ser editados, mas nunca apagados. Organizado por mês; o mês
          atual fica aberto, os anteriores ficam em botões.
        </p>
      </div>

      <NovaAtualizacaoForm />

      <AtualizacoesLista lista={lista} mesAtual={mesAtual} />
    </div>
  );
}
