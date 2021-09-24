
export async function up (knex) {
  await knex.schema.createTable('tarefas', function (table) {
    table.increments();
    table.text('descricao').notNullable();
    table.integer('id_categoria').notNullable().references('categorias.id');
    table.integer('id_usuario').notNullable().references('usuarios.id');
    table.timestamp('data_conclusao');
  });
}

export async function down () {
  throw new Error('não suportado');
}
