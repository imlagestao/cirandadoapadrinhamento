-- Marca quando parte (ou todo) o valor de um PIX conciliado é uma
-- contribuição voluntária acima da mensalidade combinada, não cobertura de
-- mais meses.
alter table conciliacoes
  add column contribuicao_extra boolean not null default false,
  add column valor_extra numeric(12, 2);
