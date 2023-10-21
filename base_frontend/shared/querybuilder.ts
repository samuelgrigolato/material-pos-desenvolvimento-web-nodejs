import knexLib from 'knex';
import runMode from './run_mode';

const knex = knexLib({
  client: 'pg',
  connection: `postgres://postgres:postgres@${runMode == 'dockerized' ? 'postgres' : '127.0.0.1'}:5432/postgres`,
  debug: true
});

export default knex;
