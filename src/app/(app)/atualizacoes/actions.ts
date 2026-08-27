"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function criarAtualizacaoManual(
  formData: FormData,
): Promise<{ ok: boolean; erro?: string }> {
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!descricao) {
    return { ok: false, erro: "Escreva o que aconteceu." };
  }

  // Data em branco = agora mesmo (padrão do banco); data escolhida = meio-dia
  // daquele dia, só pra evitar que o fuso horário jogue pro dia errado.
  const dataEscolhida = String(formData.get("data") ?? "").trim();
  const criadoEm = dataEscolhida ? `${dataEscolhida}T12:00:00` : undefined;

  // Autor escolhido no formulário (pra registrar em nome de outra pessoa da
  // equipe) tem prioridade sobre quem está logado agora.
  const autorEscolhido = String(formData.get("autor") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("atualizacoes").insert({
    tipo: "manual",
    origem: "manual",
    descricao,
    autor_email: autorEscolhido || user?.email || null,
    ...(criadoEm ? { criado_em: criadoEm } : {}),
  });

  if (error) {
    return { ok: false, erro: error.message };
  }

  revalidatePath("/atualizacoes");
  return { ok: true };
}

export async function editarAtualizacao(
  id: string,
  descricao: string,
): Promise<{ ok: boolean; erro?: string }> {
  const texto = descricao.trim();
  if (!texto) {
    return { ok: false, erro: "A descrição não pode ficar vazia." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("atualizacoes")
    .update({ descricao: texto, editado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { ok: false, erro: error.message };
  }

  revalidatePath("/atualizacoes");
  return { ok: true };
}
