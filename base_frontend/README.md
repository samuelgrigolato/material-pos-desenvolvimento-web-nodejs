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

## Usando o docker para instalar o ambiente

Crie um arquivo .env na raiz do projeto conforme o modelo abaixo

```
export OPENAI_API_KEY="novo var"
export JWT_SECRET="1234567"
```

Rode os seguintes comandos do docker compose
```SH
docker-compose build
docker-compose up
```
