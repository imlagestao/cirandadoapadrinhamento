// Gera o link direto de conversa (wa.me) a partir de um telefone salvo em
// qualquer formato (com DDD, com/sem 9º dígito, com ou sem +55).
export function linkWhatsapp(telefone: string | null): string | null {
  if (!telefone) return null;
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 13) return null;
  const comCodigoPais = digitos.startsWith("55") ? digitos : `55${digitos}`;
  return `https://wa.me/${comCodigoPais}`;
}
