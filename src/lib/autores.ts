// Quem tem acesso ao sistema hoje, pra mostrar o nome em vez do e-mail cru
// nas Atualizações. Os e-mails antigos (comunicacao@, adm@) ficam mapeados
// também, pra continuar identificando registros já feitos antes da troca.
export const AUTORES_CONHECIDOS: { email: string; nome: string }[] = [
  { email: "leanesuzarte@institutomaelalu.org", nome: "Leane" },
  { email: "comunicacao@institutomaelalu.org", nome: "Leane" },
  { email: "lavinhaassis@institutomaelalu.org", nome: "Lavínia" },
  { email: "adm@institutomaelalu.org", nome: "Lavínia" },
  { email: "leilanesuzarte@institutomaelalu.org", nome: "Leilane" },
  { email: "apd@institutomaelalu.org", nome: "Rana" },
];

const MAPA_NOMES = new Map(
  AUTORES_CONHECIDOS.map((a) => [a.email.toLowerCase(), a.nome]),
);

export function nomeDoAutor(email: string | null): string | null {
  if (!email) return null;
  return MAPA_NOMES.get(email.toLowerCase()) ?? email;
}

// Só os e-mails atuais (sem os antigos duplicados) — pra popular o seletor
// de autor no formulário manual.
export const AUTORES_ATUAIS = [
  { email: "leanesuzarte@institutomaelalu.org", nome: "Leane" },
  { email: "lavinhaassis@institutomaelalu.org", nome: "Lavínia" },
  { email: "leilanesuzarte@institutomaelalu.org", nome: "Leilane" },
  { email: "apd@institutomaelalu.org", nome: "Rana" },
];
