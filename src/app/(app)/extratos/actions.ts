"use server";

import crypto from "node:crypto";
import { PDFParse } from "pdf-parse";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import "@/lib/extratos/pdfWorker";
import { parseExtratoBB } from "@/lib/extratos/bb";
import { parseExtratoMercadoPago } from "@/lib/extratos/mercadoPago";
import {
  VALOR_MAXIMO_APADRINHAMENTO,
  VALOR_MINIMO_APADRINHAMENTO,
} from "@/lib/extratos/tipos";
import { normalizaParaComparacao } from "@/lib/extratos/sugestao";

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
  } catch (erro) {
    console.error("Falha ao ler PDF do extrato:", erro);
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    return { ok: false, erro: `Não consegui ler esse PDF (${mensagem}).` };
  }

  // Só interessa identificar pagamentos de padrinhos/madrinhas — despesas
  // do instituto (saídas) não entram no sistema.
  const transacoesExtraidas = (
    banco === "Banco do Brasil"
      ? parseExtratoBB(texto)
      : parseExtratoMercadoPago(texto)
  ).filter((t) => t.tipo === "entrada");

  if (transacoesExtraidas.length === 0) {
    return {
      ok: false,
      erro: "Nenhuma entrada encontrada nesse arquivo.",
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
    // Sem nenhum nome extraído (tarifa, aplicação, transferência externa
    // etc.) não tem como vincular a um padrinho — nem entra na fila. Valores
    // fora da faixa esperada de mensalidade (baixo demais ou alto demais)
    // também não costumam ser apadrinhamento.
    status_conciliacao:
      t.nomeExtraido &&
      t.valor >= VALOR_MINIMO_APADRINHAMENTO &&
      t.valor <= VALOR_MAXIMO_APADRINHAMENTO
        ? "pendente"
        : "ignorado",
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
    .select("data, nome_extraido")
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

  // Memoriza esse nome extraído -> padrinho, pra sugerir automaticamente com
  // 100% de confiança da próxima vez que o mesmo nome aparecer num extrato.
  if (transacao.nome_extraido) {
    const nomeNormalizado = normalizaParaComparacao(transacao.nome_extraido);
    if (nomeNormalizado) {
      await supabase.from("apelidos_transacao").upsert(
        { nome_normalizado: nomeNormalizado, padrinho_id: padrinhoId },
        { onConflict: "nome_normalizado" },
      );
    }
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

// Correção única para lançamentos já importados antes do parser reconhecer
// a variante "Transferência Pix recebida/enviada X" (só reconhecia
// "Pix recebido/enviado X"), e para tirar da fila os que continuam sem
// nenhum nome (tarifa, aplicação, transferência externa etc. — não dá
// pra vincular a um padrinho mesmo).
export async function corrigirNomesTransacoes(): Promise<
  | { ok: false; erro: string }
  | { ok: true; corrigidas: number; semNomeIgnoradas: number }
> {
  const supabase = await createClient();

  const { data: transacoes, error: erroBusca } = await supabase
    .from("transacoes")
    .select("id, descricao")
    .is("nome_extraido", null)
    .eq("status_conciliacao", "pendente");
  if (erroBusca) {
    return { ok: false, erro: erroBusca.message };
  }

  let corrigidas = 0;
  let semNomeIgnoradas = 0;
  for (const t of transacoes ?? []) {
    const m = (t.descricao as string).match(
      /(?:Transferência\s+)?Pix\s*(?:recebid[oa]|enviad[oa])\s+(.+)/i,
    );

    if (m) {
      const { error } = await supabase
        .from("transacoes")
        .update({ nome_extraido: m[1].trim() })
        .eq("id", t.id);
      if (error) {
        return { ok: false, erro: error.message };
      }
      corrigidas++;
      continue;
    }

    const { error } = await supabase
      .from("transacoes")
      .update({ status_conciliacao: "ignorado" })
      .eq("id", t.id);
    if (error) {
      return { ok: false, erro: error.message };
    }
    semNomeIgnoradas++;
  }

  revalidatePath("/extratos");
  return { ok: true, corrigidas, semNomeIgnoradas };
}

// Correção única para lançamentos já importados antes da regra de faixa de
// valor — tira da fila de pendentes os que ficaram lá fora da faixa
// [VALOR_MINIMO_APADRINHAMENTO, VALOR_MAXIMO_APADRINHAMENTO] (não costumam
// ser mensalidade de apadrinhamento).
export async function ignorarValoresForaDaFaixa(): Promise<
  { ok: false; erro: string } | { ok: true; ignoradas: number }
> {
  const supabase = await createClient();

  const { data: transacoes, error: erroBusca } = await supabase
    .from("transacoes")
    .select("id")
    .eq("status_conciliacao", "pendente")
    .or(
      `valor.lt.${VALOR_MINIMO_APADRINHAMENTO},valor.gt.${VALOR_MAXIMO_APADRINHAMENTO}`,
    );
  if (erroBusca) {
    return { ok: false, erro: erroBusca.message };
  }

  const ids = (transacoes ?? []).map((t) => t.id);
  if (ids.length > 0) {
    const { error } = await supabase
      .from("transacoes")
      .update({ status_conciliacao: "ignorado" })
      .in("id", ids);
    if (error) {
      return { ok: false, erro: error.message };
    }
  }

  revalidatePath("/extratos");
  return { ok: true, ignoradas: ids.length };
}

export async function ignorarTransacao(
  transacaoId: string,
): Promise<{ ok: boolean; erro?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("transacoes")
    .update({ status_conciliacao: "ignorado", marcado_manualmente: true })
    .eq("id", transacaoId);
  if (error) {
    return { ok: false, erro: error.message };
  }

  revalidatePath("/extratos");
  return { ok: true };
}

export async function reverterIgnorado(
  transacaoId: string,
): Promise<{ ok: boolean; erro?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("transacoes")
    .update({ status_conciliacao: "pendente", marcado_manualmente: false })
    .eq("id", transacaoId);
  if (error) {
    return { ok: false, erro: error.message };
  }

  revalidatePath("/extratos");
  return { ok: true };
}

// Apaga definitivamente todos os lançamentos marcados como "não é
// apadrinhamento" (automáticos e manuais) — usado pra limpar a lista quando
// ela já cumpriu seu papel de "conferir antes de sumir para sempre".
export async function apagarIgnorados(): Promise<
  { ok: false; erro: string } | { ok: true; apagadas: number }
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transacoes")
    .delete()
    .eq("status_conciliacao", "ignorado")
    .select("id");
  if (error) {
    return { ok: false, erro: error.message };
  }

  revalidatePath("/extratos");
  return { ok: true, apagadas: data?.length ?? 0 };
}

// Verificação/correção geral: toda transação conciliada deveria ter uma
// mensalidade (padrinho+ano+mes) marcada como paga. Se alguma ficou pra
// trás (por qualquer motivo), essa função encontra e conserta.
export async function corrigirMensalidadesFaltando(): Promise<
  { ok: false; erro: string } | { ok: true; corrigidas: number }
> {
  const supabase = await createClient();

  const { data: conciliados, error: erroTransacoes } = await supabase
    .from("transacoes")
    .select("id, data")
    .eq("status_conciliacao", "conciliado");
  if (erroTransacoes) {
    return { ok: false, erro: erroTransacoes.message };
  }

  const dataPorTransacao = new Map(
    (conciliados ?? []).map((t) => [t.id as string, t.data as string]),
  );
  const idsConciliados = [...dataPorTransacao.keys()];
  if (idsConciliados.length === 0) {
    return { ok: true, corrigidas: 0 };
  }

  const { data: conciliacoes, error: erroConciliacoes } = await supabase
    .from("conciliacoes")
    .select("transacao_id, padrinho_id")
    .in("transacao_id", idsConciliados);
  if (erroConciliacoes) {
    return { ok: false, erro: erroConciliacoes.message };
  }

  const linhas = (conciliacoes ?? [])
    .map((c) => {
      const data = dataPorTransacao.get(c.transacao_id as string);
      if (!data) return null;
      const [ano, mes] = data.split("-");
      return {
        padrinho_id: c.padrinho_id as string,
        ano: Number(ano),
        mes: Number(mes),
        pago: true,
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const unicas = [
    ...new Map(
      linhas.map((l) => [`${l.padrinho_id}-${l.ano}-${l.mes}`, l]),
    ).values(),
  ];

  if (unicas.length > 0) {
    const { error: erroUpsert } = await supabase
      .from("mensalidades")
      .upsert(unicas, { onConflict: "padrinho_id,ano,mes" });
    if (erroUpsert) {
      return { ok: false, erro: erroUpsert.message };
    }
  }

  revalidatePath("/extratos");
  revalidatePath("/adimplencia");
  return { ok: true, corrigidas: unicas.length };
}

// Correção única para meses desmarcados antes da mensalidade voltar a
// desfazer a conciliação (bug já corrigido) — acha mensalidades marcadas
// como "não pago" cuja transação ainda ficou presa como "conciliado" e
// devolve pra fila.
export async function corrigirMensalidadesDesmarcadas(): Promise<
  { ok: false; erro: string } | { ok: true; corrigidas: number }
> {
  const supabase = await createClient();

  const { data: naoPagas, error: erroBusca } = await supabase
    .from("mensalidades")
    .select("padrinho_id, ano, mes")
    .eq("pago", false);
  if (erroBusca) {
    return { ok: false, erro: erroBusca.message };
  }

  let corrigidas = 0;
  for (const m of naoPagas ?? []) {
    const mesStr = String(m.mes).padStart(2, "0");
    const inicio = `${m.ano}-${mesStr}-01`;
    const proximoMes = m.mes === 12 ? 1 : m.mes + 1;
    const anoProximoMes = m.mes === 12 ? m.ano + 1 : m.ano;
    const fim = `${anoProximoMes}-${String(proximoMes).padStart(2, "0")}-01`;

    const { data: conciliacoesDoPadrinho } = await supabase
      .from("conciliacoes")
      .select("transacao_id")
      .eq("padrinho_id", m.padrinho_id);
    const idsConciliados = (conciliacoesDoPadrinho ?? []).map(
      (c) => c.transacao_id as string,
    );
    if (idsConciliados.length === 0) continue;

    const { data: transacoesPresas } = await supabase
      .from("transacoes")
      .select("id")
      .in("id", idsConciliados)
      .eq("status_conciliacao", "conciliado")
      .gte("data", inicio)
      .lt("data", fim);

    const transacaoIds = (transacoesPresas ?? []).map((t) => t.id as string);
    if (transacaoIds.length > 0) {
      await supabase.from("conciliacoes").delete().in("transacao_id", transacaoIds);
      await supabase
        .from("transacoes")
        .update({ status_conciliacao: "pendente" })
        .in("id", transacaoIds);
      corrigidas += transacaoIds.length;
    }
  }

  revalidatePath("/extratos");
  revalidatePath("/adimplencia");
  return { ok: true, corrigidas };
}
