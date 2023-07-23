import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('categorias', (table) => {
    table.increments();
    table.text('descricao').notNullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  throw new Error('não suportado');
}
