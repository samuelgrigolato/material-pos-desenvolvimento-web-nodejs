import knex from '../querybuilder.js';

export async function buscarCategorias (uow) {
  return await knex('categorias')
    .transacting(uow)
    .select('id', 'descricao');
}
