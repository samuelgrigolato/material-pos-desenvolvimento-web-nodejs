
export async function up (knex) {
  await knex.schema.createTable('autenticacoes', function (table) {
    table.uuid('id').primary();
    table.integer('id_usuario').notNullable().references('usuarios.id');
  });
}

export async function down () {
  throw new Error('não suportado');
}
