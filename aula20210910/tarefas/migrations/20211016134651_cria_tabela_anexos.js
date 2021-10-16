
export async function up (knex) {
  await knex.schema.createTable('anexos', function (table) {
    table.increments();
    table.integer('id_tarefa').references('tarefas.id');
    table.text('nome').notNullable();
    table.integer('tamanho').notNullable();
    table.text('mime_type').notNullable();
  });
}

export function down () {
  throw new Error('não usamos aqui!');
}
