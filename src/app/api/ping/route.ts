import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Endpoint público (sem login) pra serviços de monitoramento tipo UptimeRobot.
// Faz uma consulta real ao Supabase — não só responde "ok" — porque projetos
// no plano gratuito pausam sozinhos depois de um tempo sem uso da API.
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { error } = await supabase
      .from("padrinhos")
      .select("id", { count: "exact", head: true });
    if (error) throw error;

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "erro" }, { status: 500 });
  }
}
