import { Knex } from 'knex';


type Categoria = {
  id: number,
  descricao: string
}

declare module 'knex/types/tables' {
  interface Tables {
    categorias: Categoria;
  }
}

export async function buscarCategorias(
  uow: Knex
): Promise<Categoria[]> {
  return await uow('categorias')
    .select('id', 'descricao');
}
