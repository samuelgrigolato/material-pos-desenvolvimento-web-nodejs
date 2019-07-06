const crypto = require('crypto');
const { Client } = require('pg');
const client = new Client({
    database: 'tarefas1',
    user: 'postgres',
    password: 'postgres'
});

async function main() {

    await client.connect();

    const login = 'samuel';
    const senha = '123456';

    const salt = 'segredo';
    let senhaCriptografada = `${salt}${senha}`;
    for (let i = 0; i < 10; i++) {
        senhaCriptografada = crypto.createHash('sha256')
            .update(senhaCriptografada)
            .digest();
    }

    const res = await client.query(
        'insert into usuarios (id, login, senha) ' +
        'values (nextval(\'usuarios_id_seq\'), $1, $2)',
        [login, senhaCriptografada]);

    console.log(`Linhas alteradas: ${res.rowCount}`);
    await client.end();

}

main();
