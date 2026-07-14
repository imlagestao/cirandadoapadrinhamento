"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizaNome } from "@/lib/nomes";

type StatusCrianca = "matriculado" | "retirado";

type LinhaCrianca = {
  nome: string;
  turma: string | null;
  turno: string | null;
  idade: number | null;
  nascimento: string | null;
  comunidade: string | null;
  padrinhos: string[];
  status: StatusCrianca;
};

// A aba GERAL costuma ficar desatualizada — usamos as abas de cada sala,
// que são as que a equipe mantém em dia. Nessas abas a coluna TURMA só tem
// a letra do grupo (A/B/C); o nome da sala vem do nome da própria aba.
const SHEETS: { nome: string; status: StatusCrianca; salaBase?: string }[] = [
  { nome: "SALA ROSA", status: "matriculado", salaBase: "ROSA" },
  { nome: "SALA AMARELA", status: "matriculado", salaBase: "AMARELA" },
  { nome: "SALA VERDE", status: "matriculado", salaBase: "VERDE" },
  { nome: "SALA AZUL", status: "matriculado", salaBase: "AZUL" },
  { nome: "CIRAND. MUNDO", status: "matriculado", salaBase: "CIRAND. MUNDO" },
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
  if (typeof v === "string") {
    const match = v.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  return null;
}

// Algumas crianças têm mais de um padrinho/madrinha, identificado na
// planilha como "NOME + NOME".
function splitPadrinhos(valor: string | null): string[] {
  if (!valor) return [];
  return valor
    .split("+")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
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

  for (const { nome: nomeAba, status, salaBase } of SHEETS) {
    const worksheet = workbook.getWorksheet(nomeAba);
    if (!worksheet) continue;

    const map = buildHeaderMap(worksheet);
    const colAluno = map["ALUNO"];
    if (!colAluno) continue;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const nome = cellText(row.getCell(colAluno));
      if (!nome) return;

      const turmaCelula = map["TURMA"]
        ? cellText(row.getCell(map["TURMA"]))
        : null;
      const turma = salaBase
        ? turmaCelula
          ? `${salaBase} (${turmaCelula})`
          : salaBase
        : turmaCelula;

      linhas.push({
        nome,
        turma,
        turno: map["TURNO"] ? cellText(row.getCell(map["TURNO"])) : null,
        idade: map["IDADE"] ? cellInt(row.getCell(map["IDADE"])) : null,
        nascimento: map["NASC."] ? cellDate(row.getCell(map["NASC."])) : null,
        comunidade: map["COMUNIDADE"]
          ? cellText(row.getCell(map["COMUNIDADE"]))
          : null,
        padrinhos: splitPadrinhos(
          map["PADRINHO/MADRINHA"]
            ? cellText(row.getCell(map["PADRINHO/MADRINHA"]))
            : null,
        ),
        status,
      });
    });
  }

  if (linhas.length === 0) {
    return {
      ok: false,
      erro:
        "Nenhuma linha encontrada. Confira se o arquivo tem as abas SALA ROSA/AMARELA/VERDE/AZUL, CIRAND. MUNDO e Retirados.",
    };
  }

  const supabase = await createClient();

  // Reimportação substitui o cadastro de crianças (e os vínculos, que caem
  // em cascata) para não duplicar quem já estava importado. Os padrinhos são
  // mantidos, já que podem ter dados preenchidos manualmente (telefone etc.).
  const { error: erroLimpeza } = await supabase
    .from("criancas")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (erroLimpeza) {
    return { ok: false, erro: erroLimpeza.message };
  }

  // Padrinhos: reaproveita os que já existem (por nome normalizado) e cria os que faltam.
  const nomesPadrinhos = new Map<string, string>();
  for (const linha of linhas) {
    for (const nomePadrinho of linha.padrinhos) {
      nomesPadrinhos.set(normalizaNome(nomePadrinho), nomePadrinho);
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

  // Vínculos crianca <-> padrinho (uma criança pode ter mais de um), na
  // mesma ordem em que as crianças foram inseridas.
  const vinculos = (criancasInseridas ?? []).flatMap((crianca, i) => {
    const nomesDaLinha = linhas[i]?.padrinhos ?? [];
    return nomesDaLinha
      .map((nomePadrinho) => {
        const padrinhoId = padrinhoIdPorNomeNormalizado.get(
          normalizaNome(nomePadrinho),
        );
        if (!padrinhoId) return null;
        return { crianca_id: crianca.id, padrinho_id: padrinhoId };
      })
      .filter((v): v is { crianca_id: string; padrinho_id: string } => v !== null);
  });

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

function textoForm(formData: FormData, campo: string): string | null {
  const v = formData.get(campo);
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s || null;
}

function dadosCrianca(formData: FormData) {
  const idadeTexto = textoForm(formData, "idade");
  return {
    nome: textoForm(formData, "nome") ?? "",
    turma: textoForm(formData, "turma"),
    turno: textoForm(formData, "turno"),
    idade: idadeTexto ? parseInt(idadeTexto, 10) : null,
    nascimento: textoForm(formData, "nascimento"),
    comunidade: textoForm(formData, "comunidade"),
    status: textoForm(formData, "status") ?? "matriculado",
  };
}

async function salvarVinculosPadrinhos(
  criancaId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const padrinhoIds = formData.getAll("padrinho_ids").filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );

  await supabase.from("apadrinhamentos").delete().eq("crianca_id", criancaId);

  if (padrinhoIds.length > 0) {
    await supabase.from("apadrinhamentos").insert(
      padrinhoIds.map((padrinhoId) => ({
        crianca_id: criancaId,
        padrinho_id: padrinhoId,
      })),
    );
  }
}

export async function criarCrianca(
  formData: FormData,
): Promise<{ ok: false; erro: string } | undefined> {
  const supabase = await createClient();
  const dados = dadosCrianca(formData);

  if (!dados.nome) {
    return { ok: false, erro: "Informe o nome." };
  }

  const { data, error } = await supabase
    .from("criancas")
    .insert(dados)
    .select("id")
    .single();

  if (error) {
    return { ok: false, erro: error.message };
  }

  await salvarVinculosPadrinhos(data.id, formData);

  revalidatePath("/criancas");
  revalidatePath("/padrinhos");
  redirect("/criancas");
}

export async function atualizarCrianca(
  id: string,
  formData: FormData,
): Promise<{ ok: false; erro: string } | undefined> {
  const supabase = await createClient();
  const dados = dadosCrianca(formData);

  if (!dados.nome) {
    return { ok: false, erro: "Informe o nome." };
  }

  const { error } = await supabase.from("criancas").update(dados).eq("id", id);

  if (error) {
    return { ok: false, erro: error.message };
  }

  await salvarVinculosPadrinhos(id, formData);

  revalidatePath("/criancas");
  revalidatePath("/padrinhos");
  redirect("/criancas");
}
