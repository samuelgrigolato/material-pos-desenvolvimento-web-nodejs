import knexLib from 'knex';

const knex = knexLib({
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
  debug: true
});

export default knex;
