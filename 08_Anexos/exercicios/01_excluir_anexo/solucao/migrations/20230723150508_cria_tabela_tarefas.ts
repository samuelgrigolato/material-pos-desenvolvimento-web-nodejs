import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tarefas', (table) => {
    table.increments();
    table.text('descricao').notNullable();
    table.integer('id_categoria').notNullable().references('categorias.id');
    table.integer('id_usuario').notNullable().references('usuarios.id');
    table.timestamp('data_conclusao');
  });
}


export async function down(knex: Knex): Promise<void> {
  throw new Error('não suportado');
}
