import { createClient } from "@/lib/supabase/server";
import type { Situacao } from "@/lib/situacoes";

type TipoAtualizacao =
  | "padrinho_criado"
  | "crianca_criada"
  | "crianca_status"
  | "apadrinhamento_alterado"
  | "importacao";

export async function registrarAtualizacao(
  supabase: Awaited<ReturnType<typeof createClient>>,
  {
    tipo,
    descricao,
    situacao,
  }: { tipo: TipoAtualizacao; descricao: string; situacao?: Situacao },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("atualizacoes")
    .insert({ tipo, descricao, situacao: situacao ?? null, autor_email: user?.email ?? null });

  if (error) {
    console.error("Falha ao registrar atualização:", error.message);
  }
}
