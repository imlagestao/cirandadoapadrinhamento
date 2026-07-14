import { criarPadrinho } from "../actions";
import PadrinhoForm from "../PadrinhoForm";

export default function NovoPadrinhoPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Novo padrinho/madrinha
        </h1>
        <p className="mt-1 text-sm text-muted">
          Cadastre os dados de contato e acompanhamento.
        </p>
      </div>

      <PadrinhoForm acao={criarPadrinho} />
    </div>
  );
}
