import { createClient } from "@/lib/supabase/server";

type TipoAtualizacao =
  | "padrinho_criado"
  | "crianca_criada"
  | "crianca_status"
  | "apadrinhamento_alterado"
  | "importacao";

export async function registrarAtualizacao(
  supabase: Awaited<ReturnType<typeof createClient>>,
  { tipo, descricao }: { tipo: TipoAtualizacao; descricao: string },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("atualizacoes")
    .insert({ tipo, descricao, autor_email: user?.email ?? null });

  if (error) {
    console.error("Falha ao registrar atualização:", error.message);
  }
}
