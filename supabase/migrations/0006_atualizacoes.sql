-- Registro de atualizações — histórico de cadastros/mudanças importantes
-- (quem fez e quando), substituindo o controle externo que era feito à
-- parte. Só pode ser editado, nunca apagado, pra não perder histórico.

create table atualizacoes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in (
    'padrinho_criado', 'crianca_criada', 'crianca_status',
    'apadrinhamento_alterado', 'importacao', 'manual'
  )),
  descricao text not null,
  origem text not null default 'automatico' check (origem in ('automatico', 'manual')),
  autor_email text,
  criado_em timestamptz not null default now(),
  editado_em timestamptz
);

alter table atualizacoes enable row level security;

create policy "equipe autenticada tem acesso total" on atualizacoes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
