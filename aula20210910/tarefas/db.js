import pg from 'pg';

export async function conectar () {
  const client = new pg.Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });
  await client.connect();
  return client;
}
