import pg from 'pg';


export async function conectar () {
  const client = new pg.Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres'
  }); // note que tudo isso pode (e é boa prática) vir em variáveis de ambiente
  await client.connect();
  return client;
}
