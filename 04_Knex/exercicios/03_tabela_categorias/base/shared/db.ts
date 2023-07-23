import pg from 'pg';


export async function conectar() {
  const client = new pg.Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
  });
  await client.connect();
  return client;
}
