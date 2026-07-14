"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type StatusCrianca = "matriculado" | "retirado";

type LinhaCrianca = {
  nome: string;
  turma: string | null;
  turno: string | null;
  idade: number | null;
  nascimento: string | null;
  comunidade: string | null;
  padrinho: string | null;
  status: StatusCrianca;
};

const SHEETS: { nome: string; status: StatusCrianca }[] = [
  { nome: "GERAL", status: "matriculado" },
  { nome: "Retirados", status: "retirado" },
];

function buildHeaderMap(worksheet: ExcelJS.Worksheet): Record<string, number> {
  const map: Record<string, number> = {};
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    const text = String(cell.value ?? "").trim();
    if (text) map[text] = colNumber;
  });
  return map;
}

function cellText(cell: ExcelJS.Cell | undefined): string | null {
  if (!cell) return null;
  const v = cell.value;
  if (v == null) return null;
  if (typeof v === "object") {
    if ("richText" in v) {
      return (
        (v as { richText: { text: string }[] }).richText
          .map((t) => t.text)
          .join("")
          .trim() || null
      );
    }
    if ("result" in v) {
      const r = (v as { result?: unknown }).result;
      return r == null ? null : String(r).trim() || null;
    }
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return null;
  }
  const s = String(v).trim();
  return s || null;
}

function cellDate(cell: ExcelJS.Cell | undefined): string | null {
  if (!cell) return null;
  const v = cell.value;
  if (!(v instanceof Date) || isNaN(v.getTime())) return null;
  const year = v.getUTCFullYear();
  if (year < 1900 || year > 2100) return null;
  return v.toISOString().slice(0, 10);
}

function cellInt(cell: ExcelJS.Cell | undefined): number | null {
  if (!cell) return null;
  const v = cell.value;
  if (typeof v === "number") return Math.round(v);
  if (typeof v === "string" && v.trim() && !isNaN(Number(v))) {
    return Math.round(Number(v));
  }
  return null;
}

function normalizaNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

export async function importarPlanilha(formData: FormData) {
  const file = formData.get("arquivo") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, erro: "Selecione um arquivo .xlsx." };
  }

  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const linhas: LinhaCrianca[] = [];

  for (const { nome: nomeAba, status } of SHEETS) {
    const worksheet = workbook.getWorksheet(nomeAba);
    if (!worksheet) continue;

    const map = buildHeaderMap(worksheet);
    const colAluno = map["ALUNO"];
    if (!colAluno) continue;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const nome = cellText(row.getCell(colAluno));
      if (!nome) return;

      linhas.push({
        nome,
        turma: map["TURMA"] ? cellText(row.getCell(map["TURMA"])) : null,
        turno: map["TURNO"] ? cellText(row.getCell(map["TURNO"])) : null,
        idade: map["IDADE"] ? cellInt(row.getCell(map["IDADE"])) : null,
        nascimento: map["NASC."] ? cellDate(row.getCell(map["NASC."])) : null,
        comunidade: map["COMUNIDADE"]
          ? cellText(row.getCell(map["COMUNIDADE"]))
          : null,
        padrinho: map["PADRINHO/MADRINHA"]
          ? cellText(row.getCell(map["PADRINHO/MADRINHA"]))
          : null,
        status,
      });
    });
  }

  if (linhas.length === 0) {
    return {
      ok: false,
      erro:
        "Nenhuma linha encontrada. Confira se o arquivo tem as abas GERAL e Retirados.",
    };
  }

  const supabase = await createClient();

  // Padrinhos: reaproveita os que já existem (por nome normalizado) e cria os que faltam.
  const nomesPadrinhos = new Map<string, string>();
  for (const linha of linhas) {
    if (linha.padrinho) {
      nomesPadrinhos.set(normalizaNome(linha.padrinho), linha.padrinho);
    }
  }

  const { data: padrinhosExistentes, error: erroPadrinhosExistentes } =
    await supabase.from("padrinhos").select("id, nome");
  if (erroPadrinhosExistentes) {
    return { ok: false, erro: erroPadrinhosExistentes.message };
  }

  const padrinhoIdPorNomeNormalizado = new Map<string, string>();
  for (const p of padrinhosExistentes ?? []) {
    padrinhoIdPorNomeNormalizado.set(normalizaNome(p.nome), p.id);
  }

  const padrinhosParaCriar = [...nomesPadrinhos.entries()]
    .filter(([chave]) => !padrinhoIdPorNomeNormalizado.has(chave))
    .map(([, nomeOriginal]) => ({ nome: nomeOriginal }));

  if (padrinhosParaCriar.length > 0) {
    const { data: novosPadrinhos, error: erroNovosPadrinhos } = await supabase
      .from("padrinhos")
      .insert(padrinhosParaCriar)
      .select("id, nome");
    if (erroNovosPadrinhos) {
      return { ok: false, erro: erroNovosPadrinhos.message };
    }
    for (const p of novosPadrinhos ?? []) {
      padrinhoIdPorNomeNormalizado.set(normalizaNome(p.nome), p.id);
    }
  }

  // Crianças: insere todas as linhas coletadas.
  const { data: criancasInseridas, error: erroCriancas } = await supabase
    .from("criancas")
    .insert(
      linhas.map((l) => ({
        nome: l.nome,
        turma: l.turma,
        turno: l.turno,
        idade: l.idade,
        nascimento: l.nascimento,
        comunidade: l.comunidade,
        status: l.status,
      })),
    )
    .select("id, nome");
  if (erroCriancas) {
    return { ok: false, erro: erroCriancas.message };
  }

  // Vínculos crianca <-> padrinho, na mesma ordem em que foram inseridas.
  const vinculos = (criancasInseridas ?? [])
    .map((crianca, i) => {
      const padrinhoNome = linhas[i]?.padrinho;
      if (!padrinhoNome) return null;
      const padrinhoId = padrinhoIdPorNomeNormalizado.get(
        normalizaNome(padrinhoNome),
      );
      if (!padrinhoId) return null;
      return { crianca_id: crianca.id, padrinho_id: padrinhoId };
    })
    .filter((v): v is { crianca_id: string; padrinho_id: string } => v !== null);

  if (vinculos.length > 0) {
    const { error: erroVinculos } = await supabase
      .from("apadrinhamentos")
      .insert(vinculos);
    if (erroVinculos) {
      return { ok: false, erro: erroVinculos.message };
    }
  }

  revalidatePath("/criancas");
  revalidatePath("/padrinhos");
  revalidatePath("/");

  return {
    ok: true,
    criancas: criancasInseridas?.length ?? 0,
    padrinhos: padrinhosParaCriar.length,
    vinculos: vinculos.length,
  };
}
