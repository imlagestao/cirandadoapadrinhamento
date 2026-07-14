import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { atualizarCrianca } from "../../actions";
import CriancaForm from "../../CriancaForm";

export default async function EditarCriancaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: crianca }, { data: padrinhos }, { data: vinculos }] =
    await Promise.all([
      supabase
        .from("criancas")
        .select("nome, turma, turno, idade, nascimento, comunidade, status")
        .eq("id", id)
        .single(),
      supabase.from("padrinhos").select("id, nome").order("nome"),
      supabase.from("apadrinhamentos").select("padrinho_id").eq("crianca_id", id),
    ]);

  if (!crianca) notFound();

  const atualizarComId = atualizarCrianca.bind(null, id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Editar cadastro
        </h1>
      </div>

      <CriancaForm
        valoresIniciais={crianca}
        padrinhoIdsSelecionados={(vinculos ?? []).map((v) => v.padrinho_id)}
        padrinhosDisponiveis={padrinhos ?? []}
        acao={atualizarComId}
      />
    </div>
  );
}
