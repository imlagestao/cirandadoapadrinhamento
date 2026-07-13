-- Ciranda do Apadrinhamento — schema inicial
-- Instituto Mãe Lalu

create extension if not exists pgcrypto;

create table criancas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  turma text,
  turno text,
  idade int,
  nascimento date,
  comunidade text,
  status text not null default 'matriculado'
    check (status in ('matriculado', 'retirado')),
  created_at timestamptz not null default now()
);

create table padrinhos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  documento text,
  status text not null default 'ativo'
    check (status in ('ativo', 'inadimplente', 'inativo')),
  observacoes text,
  created_at timestamptz not null default now()
);

create table apadrinhamentos (
  id uuid primary key default gen_random_uuid(),
  crianca_id uuid not null references criancas(id) on delete cascade,
  padrinho_id uuid not null references padrinhos(id) on delete cascade,
  data_inicio date not null default current_date,
  data_fim date,
  created_at timestamptz not null default now()
);

create table contas_bancarias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique
);

insert into contas_bancarias (nome) values ('Banco do Brasil'), ('Mercado Pago');

create table transacoes (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references contas_bancarias(id),
  data date not null,
  descricao text not null,
  nome_extraido text,
  valor numeric(12, 2) not null,
  tipo text not null check (tipo in ('entrada', 'saida')),
  arquivo_origem text,
  hash text not null unique,
  status_conciliacao text not null default 'pendente'
    check (status_conciliacao in ('pendente', 'conciliado', 'ignorado')),
  created_at timestamptz not null default now()
);

create table conciliacoes (
  id uuid primary key default gen_random_uuid(),
  transacao_id uuid not null unique references transacoes(id) on delete cascade,
  padrinho_id uuid not null references padrinhos(id),
  confirmado_por uuid references auth.users(id),
  confirmado_em timestamptz not null default now(),
  score_confianca numeric
);

-- RLS: qualquer usuário autenticado (equipe interna) tem acesso total.
-- Não há login público — o acesso é controlado por quem tem conta no Supabase Auth.
alter table criancas enable row level security;
alter table padrinhos enable row level security;
alter table apadrinhamentos enable row level security;
alter table contas_bancarias enable row level security;
alter table transacoes enable row level security;
alter table conciliacoes enable row level security;

create policy "equipe autenticada tem acesso total" on criancas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "equipe autenticada tem acesso total" on padrinhos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "equipe autenticada tem acesso total" on apadrinhamentos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "equipe autenticada tem acesso total" on contas_bancarias
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "equipe autenticada tem acesso total" on transacoes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "equipe autenticada tem acesso total" on conciliacoes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
