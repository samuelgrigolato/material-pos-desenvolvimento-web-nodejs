# Tafeito

Esse projeto contém a api (backend) da aplicação Tafeito. Abaixo você irá conferir as instruções de como deixar a api pronta para ser consumida.

# Instalação do Banco de dados

## 1) Verificação do Node

Antes de subir a API, verifique sua versão do Node.js:

```
$ node -v
```

A API foi testada com Node.js 14, mas deve funcionar igualmente no 16. Caso sua versão não seja nenhuma dessas, instale a 14 (dica: use [nvm](https://github.com/nvm-sh/nvm)).


## 2) Instalação do Banco de dados

Além disso, suba também um servidor de banco de dados [PostgreSQL](https://www.postgresql.org/). Isso pode ser feito instalando-o seguindo o guia no próprio site da ferramenta, ou através do Docker, usando o comando abaixo:

```sh
$ docker run -d --name tarefas-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
```

Lembre-se de subir a instância novamente usando `docker start tarefas-postgres` todas as vezes que quiser executar a API.

Outra opção é usar o docker-compose

```
docker-compose up -d
```

O comando acima irá instanciar o banco psql e o adminer para facilitar o acesso ao banco.

## 3) Instalando das dependencias
Instale agora as dependências do projeto com o comando:

```
$ npm install
```

# Executando a api
Para executar a api, execute o código abaixo:

```sh
export JWT_SECRET=algosecretoaqui
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
npx knex --esm migrate:latest
node app.js
```

Insira usuários com o comando SQL abaixo (caso não tenha preferência use pgAdmin para se conectar no banco de dados):

# Populando o banco de dados
Para popular o banco executar o comando abaixo no psql

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
