
export async function up (knex) {
  await knex.schema.createTable('anexos', function (table) {
    table.increments();
    table.text('nome').notNullable();
    table.integer('tamanho').notNullable();
    table.text('mime_type').notNullable();
    table.integer('id_tarefa').references('tarefas.id');
  });
}

export async function down () {
  throw new Error('não suportado');
}
