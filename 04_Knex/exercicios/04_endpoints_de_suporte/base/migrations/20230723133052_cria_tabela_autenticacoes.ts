import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('autenticacoes', (table) => {
    table.uuid('id').primary();
    table.integer('id_usuario').notNullable().references('usuarios.id');
  });
}


export async function down(knex: Knex): Promise<void> {
  throw new Error('não suportado');
}
