"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function texto(formData: FormData, campo: string): string | null {
  const v = formData.get(campo);
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s || null;
}

function dadosPadrinho(formData: FormData) {
  return {
    nome: texto(formData, "nome") ?? "",
    whatsapp: texto(formData, "whatsapp"),
    email: texto(formData, "email"),
    cpf: texto(formData, "cpf"),
    nascimento: texto(formData, "nascimento"),
    endereco: texto(formData, "endereco"),
    padrinho_desde: texto(formData, "padrinho_desde") ?? undefined,
    pendencia: formData.get("pendencia") === "on",
    status: texto(formData, "status") ?? "ativo",
    observacoes: texto(formData, "observacoes"),
  };
}

export async function criarPadrinho(
  formData: FormData,
): Promise<{ ok: false; erro: string } | undefined> {
  const supabase = await createClient();
  const dados = dadosPadrinho(formData);

  if (!dados.nome) {
    return { ok: false, erro: "Informe o nome completo." };
  }

  const { data, error } = await supabase
    .from("padrinhos")
    .insert(dados)
    .select("id")
    .single();

  if (error) {
    return { ok: false, erro: error.message };
  }

  revalidatePath("/padrinhos");
  redirect(`/padrinhos/${data.id}`);
}

export async function atualizarPadrinho(
  id: string,
  formData: FormData,
): Promise<{ ok: false; erro: string } | undefined> {
  const supabase = await createClient();
  const dados = dadosPadrinho(formData);

  if (!dados.nome) {
    return { ok: false, erro: "Informe o nome completo." };
  }

  const { error } = await supabase
    .from("padrinhos")
    .update(dados)
    .eq("id", id);

  if (error) {
    return { ok: false, erro: error.message };
  }

  revalidatePath("/padrinhos");
  revalidatePath(`/padrinhos/${id}`);
  redirect(`/padrinhos/${id}`);
}

export async function alternarMensalidade(
  padrinhoId: string,
  ano: number,
  mes: number,
  pago: boolean,
): Promise<{ ok: boolean; erro?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("mensalidades").upsert(
    { padrinho_id: padrinhoId, ano, mes, pago },
    { onConflict: "padrinho_id,ano,mes" },
  );

  if (error) {
    return { ok: false, erro: error.message };
  }

  revalidatePath(`/padrinhos/${padrinhoId}`);
  return { ok: true };
}
