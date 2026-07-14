import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const [{ data: criancas }, { data: padrinhos }, { data: vinculos }] =
    await Promise.all([
      supabase
        .from("criancas")
        .select("nome, turma, turno, idade, nascimento, comunidade, status")
        .order("nome"),
      supabase
        .from("padrinhos")
        .select(
          "nome, whatsapp, email, cpf, nascimento, endereco, padrinho_desde, pendencia, status, observacoes",
        )
        .order("nome"),
      supabase
        .from("apadrinhamentos")
        .select("criancas(nome), padrinhos(nome)"),
    ]);

  const workbook = new ExcelJS.Workbook();

  const abaCriancas = workbook.addWorksheet("Público atendido");
  abaCriancas.columns = [
    { header: "Nome", key: "nome", width: 35 },
    { header: "Turma", key: "turma", width: 18 },
    { header: "Turno", key: "turno", width: 12 },
    { header: "Idade", key: "idade", width: 8 },
    { header: "Nascimento", key: "nascimento", width: 14 },
    { header: "Comunidade", key: "comunidade", width: 20 },
    { header: "Status", key: "status", width: 14 },
  ];
  abaCriancas.addRows(criancas ?? []);

  const abaPadrinhos = workbook.addWorksheet("Padrinho-Madrinha");
  abaPadrinhos.columns = [
    { header: "Nome", key: "nome", width: 35 },
    { header: "Whatsapp", key: "whatsapp", width: 16 },
    { header: "E-mail", key: "email", width: 25 },
    { header: "CPF", key: "cpf", width: 16 },
    { header: "Nascimento", key: "nascimento", width: 14 },
    { header: "Endereço", key: "endereco", width: 30 },
    { header: "Padrinho desde", key: "padrinho_desde", width: 16 },
    { header: "Pendência", key: "pendencia", width: 12 },
    { header: "Status", key: "status", width: 14 },
    { header: "Observações", key: "observacoes", width: 30 },
  ];
  abaPadrinhos.addRows(padrinhos ?? []);

  const abaVinculos = workbook.addWorksheet("Vínculos");
  abaVinculos.columns = [
    { header: "Criança", key: "crianca", width: 35 },
    { header: "Padrinho/Madrinha", key: "padrinho", width: 35 },
  ];
  type VinculoRow = {
    criancas: { nome: string } | null;
    padrinhos: { nome: string } | null;
  };
  for (const v of (vinculos ?? []) as unknown as VinculoRow[]) {
    abaVinculos.addRow({
      crianca: v.criancas?.nome ?? "",
      padrinho: v.padrinhos?.nome ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const dataHoje = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="backup-ciranda-${dataHoje}.xlsx"`,
    },
  });
}
