import { createClient } from "@/lib/supabase/server";
import { criarCrianca } from "../actions";
import CriancaForm from "../CriancaForm";

export default async function NovaCriancaPage() {
  const supabase = await createClient();
  const { data: padrinhos } = await supabase
    .from("padrinhos")
    .select("id, nome")
    .order("nome");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Novo cadastro
        </h1>
        <p className="mt-1 text-sm text-muted">
          Adicione uma criança/adolescente ao público atendido.
        </p>
      </div>

      <CriancaForm acao={criarCrianca} padrinhosDisponiveis={padrinhos ?? []} />
    </div>
  );
}
