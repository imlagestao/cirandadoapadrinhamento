-- Permite dividir uma transação entre padrinhos diferentes (ex: um PIX que
-- junta a contribuição de duas pessoas). Troca a restrição de "uma
-- transação = um padrinho" por "uma transação = um padrinho, uma vez" —
-- ainda impede duplicar, mas permite mais de um padrinho por transação.
do $$
declare
  nome_constraint text;
begin
  select conname into nome_constraint
  from pg_constraint
  where conrelid = 'conciliacoes'::regclass
    and contype = 'u'
    and conkey = (
      select array_agg(attnum)
      from pg_attribute
      where attrelid = 'conciliacoes'::regclass and attname = 'transacao_id'
    );
  if nome_constraint is not null then
    execute format('alter table conciliacoes drop constraint %I', nome_constraint);
  end if;
end $$;

alter table conciliacoes add constraint conciliacoes_transacao_padrinho_key
  unique (transacao_id, padrinho_id);

alter table conciliacoes add column valor_parte numeric(12, 2);
