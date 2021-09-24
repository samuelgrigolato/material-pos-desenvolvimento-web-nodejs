
export const development = {
  client: 'postgresql',
  connection: 'postgres://postgres:postgres@localhost:5432/postgres',
  migrations: {
    tableName: 'knex_migrations'
  }
};
