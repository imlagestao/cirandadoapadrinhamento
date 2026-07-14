-- Campos da ficha do padrinho/madrinha + controle de mensalidades

alter table padrinhos rename column telefone to whatsapp;
alter table padrinhos rename column documento to cpf;
alter table padrinhos add column nascimento date;
alter table padrinhos add column endereco text;
alter table padrinhos add column padrinho_desde date not null default current_date;
alter table padrinhos add column pendencia boolean not null default false;

create table mensalidades (
  id uuid primary key default gen_random_uuid(),
  padrinho_id uuid not null references padrinhos(id) on delete cascade,
  ano int not null,
  mes int not null check (mes between 1 and 12),
  pago boolean not null default false,
  unique (padrinho_id, ano, mes)
);

alter table mensalidades enable row level security;

create policy "equipe autenticada tem acesso total" on mensalidades
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
