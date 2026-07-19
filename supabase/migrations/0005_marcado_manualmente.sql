-- Distingue transações ignoradas manualmente (alguém clicou "Não é
-- apadrinhamento") das ignoradas automaticamente pelo sistema (sem nome, ou
-- valor fora da faixa esperada) — para poder listar as manuais primeiro
-- (mais fácil reverter engano) e permitir apagar só as automáticas.

alter table transacoes add column marcado_manualmente boolean not null default false;
