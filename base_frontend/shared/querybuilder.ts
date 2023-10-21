import knexLib from 'knex';

const knex = knexLib({
  client: 'pg',
  connection: 'postgres://postgres:postgres@postgres:5432/postgres',
  debug: true
});

export default knex;
