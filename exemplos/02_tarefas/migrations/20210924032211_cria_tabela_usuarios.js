
export async function up (knex) {
  await knex.schema.createTable('usuarios', function (table) {
    table.increments();
    table.text('login').notNullable();
    table.text('nome').notNullable();
    table.text('senha').notNullable();
  });
};

export async function down (knex) {
  await knex.schema.dropTable('usuarios');
};
