# API de Tarefas

Antes de subir a API, verifique sua versão do Node.js:

```
$ node -v
```

A API foi testada com Node.js 14, mas deve funcionar igualmente no 16. Caso sua versão não seja nenhuma dessas, instale a 14 (dica: use [nvm](https://github.com/nvm-sh/nvm)).

Além disso, suba também um servidor de banco de dados [PostgreSQL](https://www.postgresql.org/). Isso pode ser feito instalando-o seguindo o guia no próprio site da ferramenta, ou através do Docker, usando o comando abaixo:

```
$ docker run -d --name tarefas-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
```

Lembre-se de subir a instância novamente usando `docker start tarefas-postgres` todas as vezes que quiser executar a API.

Instale agora as dependências do projeto com o comando:

```
$ npm install
```

E execute a API com:

```sh
export JWT_SECRET=algosecretoaqui
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres2
npx knex --esm migrate:latest
node app.js
```

Insira usuários com o comando SQL abaixo (caso não tenha preferência use pgAdmin para se conectar no banco de dados):

```sql
insert into usuarios (login, nome, senha)
values ('alguem', 'Alguém', '$2a$12$IW0EPL8kb/tkJYYTPsg4ceYDX27nscwwCCLHKteNhb2RDMyEFvzNu');
```

Essa senha é `123456`. Você pode gerar hashes bcrypt usando ferramentas online como [esta aqui](https://bcrypt-generator.com/).

Insira categorias com o comando SQL abaixo:

```sql
insert into categorias (descricao)
values ('Pessoal'), ('Trabalho');
select id, descricao from categorias; -- para confirmar os IDs gerados
```
