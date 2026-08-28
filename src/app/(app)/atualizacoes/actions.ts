"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SITUACOES, type Situacao } from "@/lib/situacoes";

const SITUACOES_VALIDAS = new Set(SITUACOES.map((s) => s.valor));

export async function criarAtualizacaoManual(
  formData: FormData,
): Promise<{ ok: boolean; erro?: string }> {
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!descricao) {
    return { ok: false, erro: "Escreva o que aconteceu." };
  }

  const situacao = String(formData.get("situacao") ?? "").trim();
  if (!SITUACOES_VALIDAS.has(situacao as Situacao)) {
    return { ok: false, erro: "Selecione a situação." };
  }

  // Data em branco = agora mesmo (padrão do banco); data escolhida = meio-dia
  // daquele dia, só pra evitar que o fuso horário jogue pro dia errado.
  const dataEscolhida = String(formData.get("data") ?? "").trim();
  const criadoEm = dataEscolhida ? `${dataEscolhida}T12:00:00` : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("atualizacoes").insert({
    tipo: "manual",
    origem: "manual",
    descricao,
    situacao,
    autor_email: user?.email || null,
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
