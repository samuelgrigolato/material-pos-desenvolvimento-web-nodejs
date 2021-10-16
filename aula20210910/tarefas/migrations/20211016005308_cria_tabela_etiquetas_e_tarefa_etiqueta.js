
export async function up (knex) {
  await knex.schema.createTable('etiquetas', function (table) {
    table.increments();
    table.text('descricao').notNullable().unique();
    table.text('cor').notNullable(); // rgb(125, 50, 75)
  });
  await knex.schema.createTable('tarefa_etiqueta', function (table) {
    table.integer('id_tarefa').references('tarefas.id');
    table.integer('id_etiqueta').references('etiquetas.id');
    table.primary([ 'id_tarefa', 'id_etiqueta' ]);
  });
}

export function down () {
  throw new Error('não usamos aqui!');
}
