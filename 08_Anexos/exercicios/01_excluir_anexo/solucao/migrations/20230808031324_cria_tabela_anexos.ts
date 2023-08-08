import { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('anexos', function (table) {
    table.uuid('id').primary();
    table.text('nome').notNullable();
    table.integer('tamanho').notNullable();
    table.text('mime_type').notNullable();
    table.integer('id_tarefa').references('tarefas.id');
  });
}


export async function down(knex: Knex): Promise<void> {
  throw new Error('não suportado');
}
