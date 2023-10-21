import type { Knex } from 'knex';
import runMode from './shared/run_mode';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection: `postgres://postgres:postgres@${runMode === 'dockerized' ? 'postgres' : '127.0.0.1'}:5432/postgres`,
    migrations: {
      tableName: 'knex_migrations',
      extension: 'ts',
    }
  },
};

export default config;
