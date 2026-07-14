"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizaNome } from "@/lib/nomes";

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

export async function excluirPadrinho(
  id: string,
): Promise<{ ok: false; erro: string } | undefined> {
  const supabase = await createClient();

  const { error } = await supabase.from("padrinhos").delete().eq("id", id);
  if (error) {
    return { ok: false, erro: error.message };
  }

  revalidatePath("/padrinhos");
  redirect("/padrinhos");
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

const MESES_PT: Record<string, string> = {
  jan: "01",
  fev: "02",
  mar: "03",
  abr: "04",
  mai: "05",
  jun: "06",
  jul: "07",
  ago: "08",
  set: "09",
  out: "10",
  nov: "11",
  dez: "12",
};

function parseDataPtExtenso(texto: string): string | null {
  const m = texto.match(/(\d{1,2})\s+de\s+(\w{3})\.?\s+de\s+(\d{4})/i);
  if (!m) return null;
  const mes = MESES_PT[m[2].toLowerCase()];
  if (!mes) return null;
  return `${m[3]}-${mes}-${m[1].padStart(2, "0")}`;
}

function parseDataBarras(texto: string): string | null {
  const m = texto.match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
  if (!m) return null;
  const dia = parseInt(m[1], 10);
  const mes = parseInt(m[2], 10);
  if (dia === 0 || mes === 0) return null;
  let ano = parseInt(m[3], 10);
  if (m[3].length === 2) {
    const pivo = new Date().getFullYear() % 100;
    ano = ano <= pivo ? 2000 + ano : 1900 + ano;
  }
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function extraiCampo(bloco: string, rotulo: string): string | null {
  // [ \t]* (não \s*) para não atravessar a quebra de linha quando o campo
  // está vazio no documento.
  const re = new RegExp(`${rotulo}:[ \\t]*(.*)`);
  const m = bloco.match(re);
  if (!m) return null;
  const v = m[1].trim();
  return v || null;
}

type FichaGoogleDocs = {
  nome: string;
  nascimento: string | null;
  cpf: string | null;
  whatsapp: string | null;
  endereco: string | null;
  email: string | null;
  padrinho_desde: string | null;
};

function parseFichasGoogleDocs(texto: string): FichaGoogleDocs[] {
  const blocos = texto.split("👤PADRINHO/MADRINHA").slice(1);
  const fichas: FichaGoogleDocs[] = [];

  for (const bloco of blocos) {
    const nome = extraiCampo(bloco, "Nome completo");
    if (!nome) continue;

    const nascimentoTexto = extraiCampo(bloco, "Nascimento");
    const cpfTexto = extraiCampo(bloco, "CPF");
    const desdeTexto = extraiCampo(bloco, "Padrinho\\/Madrinha desde");

    fichas.push({
      nome,
      nascimento: nascimentoTexto ? parseDataBarras(nascimentoTexto) : null,
      cpf:
        cpfTexto && !/^x+$/i.test(cpfTexto.replace(/\s/g, ""))
          ? cpfTexto
          : null,
      whatsapp: extraiCampo(bloco, "Whatsapp"),
      endereco: extraiCampo(bloco, "Endereço"),
      email: extraiCampo(bloco, "E-mail"),
      padrinho_desde: desdeTexto ? parseDataPtExtenso(desdeTexto) : null,
    });
  }

  return fichas;
}

function extraiIdDocumentoGoogle(url: string): string | null {
  const m = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

// Mesma pessoa, grafada de formas diferentes no documento e no sistema
// (apelido a mais, sobrenome a mais, acento). Confirmado manualmente pela
// equipe — chave é o nome como está no Google Docs, valor é o nome como
// está cadastrado no sistema.
const ALIAS_NOMES: Record<string, string> = {
  [normalizaNome("ADRIANA (VALÉRIA-ORACY)")]: normalizaNome("ADRIANA (VALÉRIA)"),
  [normalizaNome("ALBA POLIANA DE SOUZA ARAUJO")]: normalizaNome(
    "ALBA POLIANA DE SOUZA",
  ),
  [normalizaNome("CAROLINA MIRANDA DO ESPÍRITO SANTOS")]: normalizaNome(
    "CAROLINA MIRANDA DO ESPÍRITO SANTO",
  ),
  [normalizaNome("LÁZARO EDMILSON BRITO E SILVA")]: normalizaNome(
    "LÁZARO EDMILSON",
  ),
  [normalizaNome("LILIAM RUTH REZENDE (JAMILE)")]: normalizaNome(
    "LILIAM RUTH REZENDE",
  ),
  [normalizaNome("MÁRCIO CATARINO CUNHA DOS SANTOS")]: normalizaNome(
    "MARCIO CATARINO CUNHA",
  ),
  [normalizaNome("MICHELLE CÁSSIA DE AMORIM ALVES")]: normalizaNome(
    "MICHELLE AMORIM",
  ),
  [normalizaNome("ORACY DOS SANTOS SUZARTE BERNARDO")]: normalizaNome(
    "ORACY DOS SANTOS SUZARTE",
  ),
};

type ResultadoImportacaoFichas =
  | { ok: false; erro: string }
  | {
      ok: true;
      encontrados: number;
      atualizados: number;
      semMudanca: number;
      naoEncontrados: string[];
    };

export async function importarFichasGoogleDocs(
  formData: FormData,
): Promise<ResultadoImportacaoFichas> {
  const url = texto(formData, "url");
  if (!url) {
    return { ok: false, erro: "Cole o link do documento." };
  }

  const docId = extraiIdDocumentoGoogle(url);
  if (!docId) {
    return { ok: false, erro: "Não reconheci esse link do Google Docs." };
  }

  let textoDocumento: string;
  try {
    const resposta = await fetch(
      `https://docs.google.com/document/d/${docId}/export?format=txt`,
    );
    if (!resposta.ok) {
      return {
        ok: false,
        erro:
          "Não consegui abrir o documento. Confira se o link está compartilhado como 'qualquer pessoa com o link pode ver'.",
      };
    }
    textoDocumento = await resposta.text();
  } catch {
    return { ok: false, erro: "Falha ao baixar o documento." };
  }

  const fichas = parseFichasGoogleDocs(textoDocumento);
  if (fichas.length === 0) {
    return {
      ok: false,
      erro: "Nenhuma ficha encontrada nesse documento.",
    };
  }

  const supabase = await createClient();
  const { data: padrinhosExistentes, error: erroBusca } = await supabase
    .from("padrinhos")
    .select(
      "id, nome, whatsapp, email, cpf, nascimento, endereco, padrinho_desde",
    );
  if (erroBusca) {
    return { ok: false, erro: erroBusca.message };
  }

  const porNomeNormalizado = new Map(
    (padrinhosExistentes ?? []).map((p) => [normalizaNome(p.nome), p]),
  );

  let atualizados = 0;
  let semMudanca = 0;
  const naoEncontrados: string[] = [];

  for (const ficha of fichas) {
    const existente =
      porNomeNormalizado.get(normalizaNome(ficha.nome)) ??
      porNomeNormalizado.get(ALIAS_NOMES[normalizaNome(ficha.nome)] ?? "");
    if (!existente) {
      naoEncontrados.push(ficha.nome);
      continue;
    }

    const patch: Record<string, string> = {};
    if (!existente.whatsapp && ficha.whatsapp) patch.whatsapp = ficha.whatsapp;
    if (!existente.email && ficha.email) patch.email = ficha.email;
    if (!existente.cpf && ficha.cpf) patch.cpf = ficha.cpf;
    if (!existente.nascimento && ficha.nascimento)
      patch.nascimento = ficha.nascimento;
    if (!existente.endereco && ficha.endereco) patch.endereco = ficha.endereco;
    if (!existente.padrinho_desde && ficha.padrinho_desde)
      patch.padrinho_desde = ficha.padrinho_desde;

    if (Object.keys(patch).length === 0) {
      semMudanca++;
      continue;
    }

    const { error: erroUpdate } = await supabase
      .from("padrinhos")
      .update(patch)
      .eq("id", existente.id);
    if (erroUpdate) {
      return { ok: false, erro: erroUpdate.message };
    }
    atualizados++;
  }

  revalidatePath("/padrinhos");

  return {
    ok: true,
    encontrados: fichas.length,
    atualizados,
    semMudanca,
    naoEncontrados,
  };
}

// Correção única: cadastros antigos como "GENIVAL NASCIMENTO / LÁZARO
// EDMILSON" na verdade são duas (ou mais) pessoas diferentes que apadrinham
// a(s) mesma(s) criança(s) — a planilha original só não separava por "/".
// Separa cada nome em seu próprio cadastro (reaproveitando um já existente
// com esse nome, se houver) e refaz os vínculos com as crianças.
export async function corrigirVinculosCompostos(): Promise<
  { ok: false; erro: string } | { ok: true; separados: number }
> {
  const supabase = await createClient();

  const { data: padrinhos, error: erroPadrinhos } = await supabase
    .from("padrinhos")
    .select("id, nome");
  if (erroPadrinhos) {
    return { ok: false, erro: erroPadrinhos.message };
  }

  const porNomeNormalizado = new Map(
    (padrinhos ?? []).map((p) => [normalizaNome(p.nome), p]),
  );

  const compostos = (padrinhos ?? []).filter((p) => /[+/]/.test(p.nome));
  let separados = 0;

  for (const composto of compostos) {
    const nomes = (composto.nome as string)
      .split(/[+/]/)
      .map((n: string) => n.trim())
      .filter((n: string) => n.length > 0);
    if (nomes.length < 2) continue;

    const { data: vinculos, error: erroVinculos } = await supabase
      .from("apadrinhamentos")
      .select("crianca_id")
      .eq("padrinho_id", composto.id);
    if (erroVinculos) {
      return { ok: false, erro: erroVinculos.message };
    }

    for (const nome of nomes) {
      const chave = normalizaNome(nome);
      let alvo = porNomeNormalizado.get(chave);

      if (!alvo) {
        const { data: novo, error: erroNovo } = await supabase
          .from("padrinhos")
          .insert({ nome })
          .select("id, nome")
          .single();
        if (erroNovo) {
          return { ok: false, erro: erroNovo.message };
        }
        alvo = novo;
        porNomeNormalizado.set(chave, novo);
      }

      for (const { crianca_id } of vinculos ?? []) {
        const { data: existente } = await supabase
          .from("apadrinhamentos")
          .select("id")
          .eq("crianca_id", crianca_id)
          .eq("padrinho_id", alvo.id)
          .maybeSingle();
        if (existente) continue;

        const { error: erroLink } = await supabase
          .from("apadrinhamentos")
          .insert({ crianca_id, padrinho_id: alvo.id });
        if (erroLink) {
          return { ok: false, erro: erroLink.message };
        }
      }
    }

    await supabase.from("padrinhos").delete().eq("id", composto.id);
    separados++;
  }

  revalidatePath("/padrinhos");
  revalidatePath("/criancas");

  return { ok: true, separados };
}
