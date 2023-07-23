import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('usuarios', (table) => {
    table.increments();
    table.text('nome').notNullable();
    table.text('login').notNullable();
    table.text('senha').notNullable();
    table.boolean('admin').notNullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('usuarios');
}
