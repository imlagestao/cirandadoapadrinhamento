"use server";

import crypto from "node:crypto";
import { PDFParse } from "pdf-parse";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseExtratoBB } from "@/lib/extratos/bb";
import { parseExtratoMercadoPago } from "@/lib/extratos/mercadoPago";

type ResultadoImportacaoExtrato =
  | { ok: false; erro: string }
  | { ok: true; total: number; novas: number; duplicadas: number };

export async function importarExtrato(
  formData: FormData,
): Promise<ResultadoImportacaoExtrato> {
  const file = formData.get("arquivo") as File | null;
  const banco = formData.get("banco") as string | null;

  if (!file || file.size === 0) {
    return { ok: false, erro: "Selecione um arquivo PDF." };
  }
  if (!banco) {
    return { ok: false, erro: "Selecione o banco." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let texto: string;
  try {
    const parser = new PDFParse({ data: buffer });
    const resultado = await parser.getText();
    texto = resultado.text;
  } catch {
    return { ok: false, erro: "Não consegui ler esse PDF." };
  }

  const transacoesExtraidas =
    banco === "Banco do Brasil"
      ? parseExtratoBB(texto)
      : parseExtratoMercadoPago(texto);

  if (transacoesExtraidas.length === 0) {
    return {
      ok: false,
      erro: "Nenhum lançamento encontrado nesse arquivo.",
    };
  }

  const supabase = await createClient();
  const { data: conta, error: erroConta } = await supabase
    .from("contas_bancarias")
    .select("id")
    .eq("nome", banco)
    .single();
  if (erroConta || !conta) {
    return { ok: false, erro: "Conta bancária não encontrada." };
  }

  const linhas = transacoesExtraidas.map((t) => ({
    conta_id: conta.id,
    data: t.data,
    descricao: t.descricao,
    nome_extraido: t.nomeExtraido,
    valor: t.valor,
    tipo: t.tipo,
    arquivo_origem: file.name,
    hash: crypto
      .createHash("sha256")
      .update(`${banco}|${t.chaveUnica}`)
      .digest("hex"),
  }));

  const { data: inseridas, error: erroInsert } = await supabase
    .from("transacoes")
    .upsert(linhas, { onConflict: "hash", ignoreDuplicates: true })
    .select("id");

  if (erroInsert) {
    return { ok: false, erro: erroInsert.message };
  }

  revalidatePath("/extratos");

  return {
    ok: true,
    total: linhas.length,
    novas: inseridas?.length ?? 0,
    duplicadas: linhas.length - (inseridas?.length ?? 0),
  };
}

export async function confirmarConciliacao(
  transacaoId: string,
  padrinhoId: string,
): Promise<{ ok: boolean; erro?: string }> {
  const supabase = await createClient();

  const { data: transacao, error: erroTransacao } = await supabase
    .from("transacoes")
    .select("data")
    .eq("id", transacaoId)
    .single();
  if (erroTransacao || !transacao) {
    return { ok: false, erro: erroTransacao?.message ?? "Transação não encontrada." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: erroConciliacao } = await supabase
    .from("conciliacoes")
    .upsert(
      {
        transacao_id: transacaoId,
        padrinho_id: padrinhoId,
        confirmado_por: user?.id ?? null,
      },
      { onConflict: "transacao_id" },
    );
  if (erroConciliacao) {
    return { ok: false, erro: erroConciliacao.message };
  }

  const { error: erroStatus } = await supabase
    .from("transacoes")
    .update({ status_conciliacao: "conciliado" })
    .eq("id", transacaoId);
  if (erroStatus) {
    return { ok: false, erro: erroStatus.message };
  }

  const [ano, mes] = transacao.data.split("-");
  const { error: erroMensalidade } = await supabase
    .from("mensalidades")
    .upsert(
      {
        padrinho_id: padrinhoId,
        ano: Number(ano),
        mes: Number(mes),
        pago: true,
      },
      { onConflict: "padrinho_id,ano,mes" },
    );
  if (erroMensalidade) {
    return { ok: false, erro: erroMensalidade.message };
  }

  revalidatePath("/extratos");
  revalidatePath(`/padrinhos/${padrinhoId}`);
  revalidatePath("/");

  return { ok: true };
}

export async function ignorarTransacao(
  transacaoId: string,
): Promise<{ ok: boolean; erro?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("transacoes")
    .update({ status_conciliacao: "ignorado" })
    .eq("id", transacaoId);
  if (error) {
    return { ok: false, erro: error.message };
  }

  revalidatePath("/extratos");
  return { ok: true };
}
