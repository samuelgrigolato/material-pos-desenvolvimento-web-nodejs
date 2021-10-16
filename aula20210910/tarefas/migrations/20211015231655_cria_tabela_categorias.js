
export async function up (knex) {
  await knex.schema.createTable('categorias', function (table) {
    table.increments();
    table.text('descricao').notNullable();
  });
}

export function down () {
  throw new Error('não usamos aqui!');
}
