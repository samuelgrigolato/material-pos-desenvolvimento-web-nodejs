# Desenvolvimento de APIs usando Node.js

Este repositório contém o material usado na disciplina _Desenvolvimento de APIs usando Node.js_, parte integrante do curso de pós graduação em Desenvolvimento Web oferecido pela UFSCar.

Carga horária: 40 horas.

## Ementa

* Introdução ao Node.js: Apresentação do JavaScript como alternativa de linguagem para desenvolvimento de APIs de dados. Também será apresentado o TS (TypeScript) que é um superconjunto sintático estrito de JavaScript que permite o desenvolvimento de aplicações web mais resilientes e robustas.

* Análise da arquitetura baseada em eventos do Node.js, com foco nos benefícios de performance e concorrência trazidos por ela.

* Desenvolvendo APIs de dados com Fastify: Aprofundamento no framework Fastify para o desenvolvimento de APIs de dados, buscando cobrir casos excepcionais como recebimento de arquivos (upload) e envio de imagens pré-processadas, além do CRUD básico.

* Trabalhando com dados usando Knex: Adicionar persistência de dados na nossa aplicação através do framework de construção de SQL Knex. Gerenciar a evolução da base de dados através da ferramenta nativa de migrações do Knex.

* Servidores Stateless vs. Stateful: Análise conceitual de servidores stateless e servidores stateful, incluindo o conceito de sticky session. Desenvolvimento de mecanismo de autenticação totalmente stateless usando JWT.

* Adicionando uma camada de testes automatizados com Jest.

## Índice

* [00 - Prólogo](00_Prologo/README.md)
* [01 - Node.js e JavaScript](01_Nodejs_e_JavaScript/README.md)
* [02 - TypeScript](02_TypeScript/README.md)
* [03 - Fastify](03_Fastify/README.md)
* [04 - Knex](04_Knex/README.md)
* [05 - Autenticação usando Json Web Token](05_Autenticacao_JWT/README.md)
* [06 - Integração ChatGPT](06_Integracao_ChatGPT/README.md)
* [07 - Testes automatizados](07_Testes_automatizados/README.md)
* [08 - Anexos](08_Anexos/README.md)
* [99 - Resumo teórico](99_Resumo_teorico/README.md)

## Gerando PDF

Instale a ferramenta `md-to-pdf`:

```
npm i -g md-to-pdf
```

Depois execute o seguinte comando:

```
md2pdf <arquivo.md> --launch-options '{ "args": ["--no-sandbox"] }'
```

## Iniciando um servidor PostgreSQL usando docker

Para subir uma imagem docker rodando um servidor PostgreSQL, execute o seguinte comando:

```
docker run --name posdesenvweb-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -p 5432:5432 -d postgres
```
