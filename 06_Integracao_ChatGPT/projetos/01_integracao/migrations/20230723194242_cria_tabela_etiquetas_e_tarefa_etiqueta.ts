import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('etiquetas', (table) => {
    table.increments();
    table.text('descricao').notNullable().unique();
    table.specificType('cor', 'integer[3]').notNullable();
  });
  await knex.schema.createTable('tarefa_etiqueta', (table) => {
    table.integer('id_tarefa').notNullable().references('tarefas.id');
    table.integer('id_etiqueta').notNullable().references('etiquetas.id');
    table.primary(['id_tarefa', 'id_etiqueta']);
  });
}


export async function down(knex: Knex): Promise<void> {
  throw new Error('não suportado');
}
