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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("atualizacoes").insert({
    tipo: "manual",
    origem: "manual",
    descricao,
    autor_email: user?.email ?? null,
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
