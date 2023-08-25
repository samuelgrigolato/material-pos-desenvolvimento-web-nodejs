# Projeto base para a disciplina de front-end

Pré-requisitos:

* Node.js 18+
* PostgreSQL 15+ na porta 5432, usuário e senha "postgres" (instalado manualmente ou via docker)
* Um cliente SQL para executar instruções SQL na base (exemplo: pgAdmin)
* Uma chave de API OpenAI (para usar os endpoints de integração com ChatGPT)

Como rodar a API:

```
$ npm install
$ npx knex migrate:latest
$ export OPENAI_API_KEY=sk-MCSfx...
$ npm run build && npm start
```

Instruções SQL para preparar a base:

```sql
insert into categorias (id, descricao)
values (1, 'Pessoal'), (2, 'Trabalho');

insert into usuarios (nome, login, senha, admin)
values ('Usuário', 'usuario', '$2a$12$.2xyMG/zt6kgICCnzlwDq.39rN.smOKhTRpI.pFW0rswXbWqvFdTm', false),
  ('Admin', 'admin', '$2a$12$.2xyMG/zt6kgICCnzlwDq.39rN.smOKhTRpI.pFW0rswXbWqvFdTm', true);
```

Existe uma exportação de Insomnia nesta pasta, que permite visualizar a suíte de requisições disponível no projeto.

## Comando docker para subir um container PostgreSQL

```
$ docker run -d --name ufscar-desenvweb-2023 -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
```
