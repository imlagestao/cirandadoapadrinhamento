import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { atualizarPadrinho } from "../../actions";
import ExcluirPadrinhoButton from "../../ExcluirPadrinhoButton";
import PadrinhoForm from "../../PadrinhoForm";

export default async function EditarPadrinhoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: padrinho } = await supabase
    .from("padrinhos")
    .select(
      "nome, whatsapp, email, cpf, nascimento, endereco, padrinho_desde, pendencia, status, observacoes",
    )
    .eq("id", id)
    .single();

  if (!padrinho) notFound();

  const atualizarComId = atualizarPadrinho.bind(null, id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Editar padrinho/madrinha
        </h1>
      </div>

      <PadrinhoForm valoresIniciais={padrinho} acao={atualizarComId} />

      <ExcluirPadrinhoButton id={id} nome={padrinho.nome} />
    </div>
  );
}
