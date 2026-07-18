-- Memoriza, a cada conciliação confirmada, qual padrinho corresponde a um
-- nome extraído do extrato — assim, da próxima vez que o mesmo nome aparecer
-- num lançamento, a sugestão já vem certa (com 100% de confiança), sem
-- precisar procurar de novo na lista. A confirmação final continua manual.

create table apelidos_transacao (
  id uuid primary key default gen_random_uuid(),
  nome_normalizado text not null unique,
  padrinho_id uuid not null references padrinhos(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table apelidos_transacao enable row level security;

create policy "equipe autenticada tem acesso total" on apelidos_transacao
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
