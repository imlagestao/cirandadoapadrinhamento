-- Categoria da atualização ("Situação") — permite marcar o que aconteceu
-- (novo padrinho/madrinha, novo afilhado, desistência, migração/atualização,
-- financeiro) e depois filtrar a lista de Atualizações por isso.
-- Nullable porque atualizações antigas não tinham essa categoria.

alter table atualizacoes
  add column situacao text check (situacao in (
    'novo_padrinho', 'novo_afilhado', 'desistencia',
    'migracao_atualizacao', 'financeiro'
  ));
