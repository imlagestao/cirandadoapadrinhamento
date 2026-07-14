-- padrinho_desde tinha DEFAULT current_date, então todo cadastro já nascia
-- preenchido e a importação das fichas do Google Docs nunca conseguia
-- gravar a data real (a lógica só preenche campos vazios). Como nenhum
-- valor atual é confiável (todos vieram do default, não de uma data real),
-- zera tudo para reimportar as datas certas das fichas.

alter table padrinhos alter column padrinho_desde drop not null;
alter table padrinhos alter column padrinho_desde drop default;
update padrinhos set padrinho_desde = null;
