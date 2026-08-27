-- Vínculo com a transação que pagou aquele mês — permite mostrar valor e
-- data na ficha do padrinho, e tornar exata a reversão ao desmarcar um mês
-- (antes era só uma suposição por data).
alter table mensalidades
  add column transacao_id uuid references transacoes(id) on delete set null;
